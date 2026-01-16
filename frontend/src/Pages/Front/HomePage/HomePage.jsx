import React, { useState, useEffect } from 'react'
import FrontLayout from '../../../Component/Layouts/Front/index'
import $ from 'jquery';
import 'slick-carousel';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import TechnologySlider from '../../../Component/Layouts/Front/TechnologySlider/TechnologySlider';
import CompanyPartners from '../CompanyPartners/CompanyPartners';
import CandidateReview from '../CandidateReview/CandidateReview';
const HomePage = () => {

  useEffect(() => {
    // Initialize slick slider
    $(".how_sliderdual").slick({
      dots: false,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      autoplay: true,
      infinite: true,
      autoplaySpeed: 2000,
      responsive: [
        {
          breakpoint: 1920,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            dots: false
          }
        },
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            dots: false
          }
        },
        {
          breakpoint: 1366,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 576,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    });

    // Cleanup function to prevent memory leaks
    return () => {
      try {
        if ($(".how_sliderdual").hasClass('slick-initialized')) {
          $(".how_sliderdual").slick('unslick');
        }
      } catch (error) {
        console.warn('Error destroying slick slider:', error);
      }
    };
  }, []);

  return (
    <FrontLayout>

      {/* main page display on web for large screens  */}
      <section className="d-xxl-block d-xl-block d-lg-block d-md-block d-md-block d-sm-none d-none">
        <div className="home-2_hero-section section-padding-120 mt-5" id="hero">
          <div className="container">
            <div className="row row--custom">
              <div className="col-xxl-6 col-lg-6 col-md-12 col-xs-8 col-12" data-aos-duration="1000" data-aos="fade-left"
                data-aos-delay="300">
                {/* <!-- <div className="home-2_hero-image-block">
                <div className="home-2_hero-image">
                  <img src="public_assets/images/newpage/index/focalyt2.gif" alt="hero image" className="img-fluid"
                    draggable="false"/>
                </div>
              </div> --> */}
                <div className="home-2_hero-image-block">
                  <h2 className="tagline">
                    #Building Future Ready Minds
                  </h2>
                </div>
                <div className="images">
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/drone.png" alt="drone" className="img1" />
                  </a>
                  <a href="/candidate/login">'
                    <img src="/Assets/public_assets/images/icons/ai.png" alt="ai" className="img1" />
                  </a>
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/robotic.png" alt="robotic" className="img1" />
                  </a>
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/iot.png" alt="iot" className="img1" />
                  </a>
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/ar_vr.png" alt="ar vr" className="img1" />
                  </a>
                </div>
              </div>

              <div className="col-xxl-auto col-lg-6 col-md-12 my-auto" data-aos-duration="1000" data-aos="fade-right"
                data-aos-delay="300">
                <div className="home-2_hero-content mt-5">
                  <div className="home-2_hero-content-text">
                    <h4>Unlock Your Future With</h4>
                    <h1 className="hero-content__title heading-xl text-white mb-0">
                      FOCALYT
                    </h1>
                  </div>
                </div>
                <div className="border_cta">
                  <p className="text-white">Job Discovery&nbsp;&nbsp;|&nbsp;&nbsp;Skilling and
                    Upskilling</p>
                </div>
                <div className="pt-4 last_cta">
                  <h3 className="color-pink fw-bolder">ALL IN ONE PLACE!</h3>
                </div>
                <div className="col-xxl-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
                  <div className="row justify-content-start" id="features_cta">
                    <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
                      <a href="/joblisting">
                        <figure className="figure">
                          <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/job_search.png"
                            data-src="/Assets/public_assets/images/newpage/index/job_search.png" />
                          <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/job_search_v.png" src="/Assets/public_assets/images/newpage/index/job_search_v.png" />
                        </figure>
                        <h4 className="head">Future Technology Jobs</h4>
                      </a>
                    </div>
                    <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
                      <a href="/courses">
                        <figure className="figure">
                          <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/skill_course.png"
                            data-src="/Assets/public_assets/images/newpage/index/skill_course.png" />
                          <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/skill_course_v.png" src="/Assets/public_assets/images/newpage/index/skill_course_v.png" />
                        </figure>
                        <h4 className="head">Future Technology Courses</h4>
                      </a>
                    </div>
                    <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
                      <a href="/labs">
                        <figure className="figure">
                          <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png"
                            data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png" />
                          <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" />
                        </figure>
                        <h4 className="head">Future Technology Labs</h4>
                      </a>
                    </div>
                    {/* <!-- <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
                    <figure className="figure">
                      <img className="Sirv image-main" src="public_assets/images/newpage/index/job_safety.png" data-src="public_assets/images/newpage/index/job_safety.png">
                      <img className="Sirv image-hover" data-src="public_assets/images/newpage/index/job_safety_v.png">
                    </figure>
                    <h4 className="head">Loans &amp; Advances</h4>
                    <h4 className="head">Loans &amp; Advances</h4>
                  </div> --> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <!-- CTA's -->
            <!-- END --> */}
        </div>

        {/* carousel  */}
        <div className='' style={{ background: "#121212" }}>
          <TechnologySlider />

        </div>

      </section>
      <section className="d-xxl-none d-xl-none d-lg-none d-md-none d-sm-block d-block" id="hero_sm">
        <div className="home-2_hero-section section-padding-120 mt-5" id="hero">
          <div className="container">
            <div className="row row--custom">
              <div className="col-xxl-6 col-lg-6 col-md-12 col-xs-8 col-12" data-aos-duration="1000" data-aos="fade-left"
                data-aos-delay="300">
                {/* <!-- <div className="home-2_hero-image-block">
                <div className="home-2_hero-image">
                  <img src="public_assets/images/newpage/index/focalyt2.gif" alt="hero image" className="img-fluid"
                    draggable="false"/>
                </div>
              </div> --> */}
                <div className="home-2_hero-image-block">
                  <h2 className="tagline">
                    #Building Future Ready Minds
                  </h2>
                </div>
                <div className="images">
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/drone.png" alt="drone" className="img1" />
                  </a>
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/ai.png" alt="ai" className="img1" /></a>

                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/robotic.png" alt="robotic" className="img1" />
                  </a>
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/iot.png" alt="iot" className="img1" />
                  </a>
                  <a href="/candidate/login">
                    <img src="/Assets/public_assets/images/icons/ar_vr.png" alt="ar vr" className="img1" />
                  </a>
                </div>
              </div>

              <div className="col-xxl-auto col-lg-6 col-md-12 my-auto" data-aos-duration="1000" data-aos="fade-right"
                data-aos-delay="300">
                <div className="home-2_hero-content mt-5">
                  <div className="home-2_hero-content-text">
                    <h4>Unlock Your Future With</h4>
                    <h1 className="hero-content__title heading-xl text-white mb-0">
                      FOCALYT
                    </h1>
                  </div>
                </div>
                <div className="border_cta">
                  <p className="text-white">Job Discovery&nbsp;&nbsp;|&nbsp;&nbsp;Skilling and
                    Upskilling</p>
                </div>
                <div className="pt-4 last_cta">
                  <h3 className="color-pink fw-bolder">ALL IN ONE PLACE!</h3>
                </div>
                <div className="col-xxl-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
                  <div className="row justify-content-start" id="features_cta">
                    <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4 text-center mb-sm-3 mb-3 cta_cols">
                      <a href="/joblisting">
                        <figure className="figure">
                          <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/job_search.png"
                            data-src="/Assets/public_assets/images/newpage/index/job_search.png" />
                          <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/job_search_v.png" src="/Assets/public_assets/images/newpage/index/job_search_v.png" />
                        </figure>
                        <h4 className="head">Future Technology Jobs</h4>
                      </a>
                    </div>
                    <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4 text-center mb-sm-3 mb-3 cta_cols">
                      <a href="/courses">
                        <figure className="figure">
                          <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/skill_course.png"
                            data-src="/Assets/public_assets/images/newpage/index/skill_course.png" />
                          <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/skill_course_v.png" src="/Assets/public_assets/images/newpage/index/skill_course_v.png" />
                        </figure>
                        <h4 className="head">Future Technology Courses</h4>
                      </a>
                    </div>
                    <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4 text-center mb-sm-3 mb-3 cta_cols">
                      <a href="/labs">
                        <figure className="figure">
                          <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png"
                            data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png" />
                          <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" />
                        </figure>
                        <h4 className="head">Future Technology Labs</h4>
                      </a>
                    </div>
                    {/* <!-- <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
                    <figure className="figure">
                      <img className="Sirv image-main" src="public_assets/images/newpage/index/job_safety.png" data-src="public_assets/images/newpage/index/job_safety.png">
                      <img className="Sirv image-hover" data-src="public_assets/images/newpage/index/job_safety_v.png">
                    </figure>
                    <h4 className="head">Loans &amp; Advances</h4>
                    <h4 className="head">Loans &amp; Advances</h4>
                  </div> --> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <!-- CTA's -->
            <!-- END --> */}
        </div>

        {/* carousel  */}
        <div className='' style={{ background: "#121212" }}>
          <TechnologySlider />

        </div>

      </section>


      <section id="how">

        <div className="home-2_content-section-1 section-padding-120" id="about">
          <div className="container">
            <div className="main-screen">
              <div className="row row--custom d-xl-block d-lg-block d-md-none d-sm-none d-none">
                <div className="faq-4_main-section">
                  <div className="container">
                    <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">
                      <div className="col-xl-6 col-lg-6 "></div>
                      <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mt-0" >
                        <div className="content m-0">
                          <div className="content-text-block">
                            <h2 className="content-title text-capitalize heading-md how_focal color-pink">
                              What Focalyt Does
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6 my-auto">
                        <div className="tab-content">
                          <div className="tab-pane fade show active" id="general-tab-pane" role="tabpanel"
                            aria-labelledby="cotent-tab" tabindex="0">
                            <div className="accordion-style-7-wrapper robo_img ">
                              <figure>
                                <img src="/Assets/public_assets/images/course/courses.jpeg" className="img-fluid"
                                  draggable="false" />
                              </figure>
                            </div>
                          </div>
                          <div className="tab-pane fade " id="account-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
                            tabindex="0">
                            <div className="accordion-style-7-wrapper robo_img ">
                              <figure>
                                <img src="/Assets/public_assets/images/course/labs.jpeg" className="img-fluid"
                                  draggable="false" />
                              </figure>
                            </div>
                          </div>
                          <div className="tab-pane fade " id="purchasing-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
                            tabindex="0">
                            <div className="accordion-style-7-wrapper robo_img ">
                              <figure>
                                <img src="/Assets/public_assets/images/course/jobs.jpeg" className="img-fluid"
                                  draggable="false" />
                              </figure>
                            </div>
                          </div>
                          <div className="tab-pane fade" id="technical-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
                            tabindex="0">
                            <div className="accordion-style-7-wrapper robo_img ">
                              <figure>
                                <img src="/Assets/public_assets/images/course/social_impact.jpg" className="img-fluid"
                                  draggable="false" />
                              </figure>
                            </div>
                          </div>
                          <div className="tab-pane fade" id="continous-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
                            tabindex="0">
                            <div className="accordion-style-7-wrapper robo_img ">
                              <figure>
                                <img src="/Assets/public_assets/images/course/iot.jpg" className="img-fluid"
                                  draggable="false" />
                              </figure>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6">
                        <ul className="faq-tab__nav faq-filter-list feature-widget-7-row" role="tablist" id="cotent-tab">
                          <li className="nav-item" role="presentation">
                            <button className="nav-link active" id="general-tab-nav" data-bs-toggle="tab"
                              data-bs-target="#general-tab-pane" type="button" role="tab" aria-controls="general-tab-pane"
                              aria-selected="true">
                              <div className="mobile-bg">
                                <div className="feature-widget-7">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="color-pink fw-bold">1</h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <h5 className="feature-widget-7__title mb-0 color-pink">Future-Ready Courses</h5>
                                    <p>Advanced courses in AI, Machine Learning, Cloud Computing, Drone Pilot Training, and more to prepare students for future careers.</p>
                                  </div>
                                </div>
                              </div>

                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button className="nav-link " id="account-tab-nav" data-bs-toggle="tab"
                              data-bs-target="#account-tab-pane" type="button" role="tab" aria-controls="account-tab-pane"
                              aria-selected="false">
                              <div className="mobile-bg">
                                <div className="feature-widget-7">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="color-pink fw-bold">2</h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <h5 className="feature-widget-7__title mb-0 color-pink">Future Technology Labs</h5>
                                    <p>Set up Future Technology Labs in schools and colleges to provide hands-on learning experiences with cutting-edge technologies.</p>
                                  </div>
                                </div>
                              </div>
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button className="nav-link " id="purchasing-tab-nav" data-bs-toggle="tab"
                              data-bs-target="#purchasing-tab-pane" type="button" role="tab"
                              aria-controls="purchasing-tab-pane" aria-selected="false" />
                            <div className="mobile-bg">
                              <div className="feature-widget-7">
                                <div className="feature-widget-7__icon-wrapper my-auto">
                                  <h5 className="color-pink fw-bold">3</h5>
                                </div>
                                <div className="feature-widget-7__body">
                                  <h5 className="feature-widget-7__title mb-0 color-pink">Job Opportunities in Future Technology</h5>
                                  <p>Offer global career opportunities in emerging tech fields by bridging the gap between skills and industry demands.</p>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button className="nav-link " id="technical-tab-nav" data-bs-toggle="tab"
                              data-bs-target="#technical-tab-pane" type="button" role="tab"
                              aria-controls="technical-tab-pane" aria-selected="false">
                              <div className="mobile-bg">
                                <div className="feature-widget-7">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="color-pink fw-bold">4</h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <h5 className="feature-widget-7__title mb-0 color-pink">Social Impact Projects </h5>
                                    <p>Execute Govt and CSR initiatives focused on skill development, education, and employment to empower underserved communities.</p>
                                  </div>
                                </div>
                              </div>
                            </button>
                          </li>
                          {/* <!-- <li className="nav-item" role="presentation">
                    <button className="nav-link " id="continous-tab-nav" data-bs-toggle="tab"
                      data-bs-target="#continous-tab-pane" type="button" role="tab"
                      aria-controls="continous-tab-pane" aria-selected="false">
                      <div className="mobile-bg">
                        <div className="feature-widget-7">
                          <div className="feature-widget-7__icon-wrapper my-auto">
                            <h5 className="color-pink fw-bold">5</h5>
                          </div>
                          <div className="feature-widget-7__body">
                            <h5 className="feature-widget-7__title mb-0 color-pink">Support for Innovation</h5>
                            <p>Facilitate innovation through tools and platforms that encourage exploration and application of futuristic technologies.</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li> --> */}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="small-screen">
              <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">
                <div className="col-xl-6 col-lg-6 "></div>
                <div className="col-lg-6 col-12 d-xl-none d-lg-none d-md-block d-sm-block d-block" data-aos-duration="1000" data-aos="fade-down"
                  data-aos-delay="300">
                  <div className="content m-0">
                    <div className="content-text-block">
                      <h2 className="content-title heading-md text-capitalize how_focal">
                        What Focalyt Does
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="how_sliderdual slider d-xl-none d-lg-none d-md-block d-sm-block d-block" id="how_sliderdual2">
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/courses.jpeg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">1</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Future-Ready Courses</h5>
                    <p>Advanced courses in AI, Machine Learning, Cloud Computing, Drone Pilot Training, and more to prepare students for future careers.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/labs.jpeg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">2</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Future Technology Labs</h5>
                    <p>Set up Future Technology Labs in schools and colleges to provide hands-on learning experiences with cutting-edge technologies.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/jobs.jpeg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">3</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Job Opportunities in Future Technology</h5>
                    <p>Offer global career opportunities in emerging tech fields by bridging the gap between skills and industry demands.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/social_impact.jpg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">4</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Social Impact Projects </h5>
                    <p>Execute Govt and CSR initiatives focused on skill development, education, and employment to empower underserved communities.</p>
                  </div>
                </div>
              </div>
              {/* <!-- <div className="">
      <figure>
        <img src="public_assets/images/newpage/index/steps/progress.png" className="img-fluid" draggable="false">
      </figure>
      <div className="feature-widget-7 c_bg_color">
        <div className="feature-widget-7__icon-wrapper my-auto">
          <h5 className="color-pink fw-bold">5</h5>
          <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
        </div>
        <div className="feature-widget-7__body">
          <h5 className="feature-widget-7__title mb-0 color-pink">Continuous Progress</h5>
          <p>Regularly update your profile, track your skill develop- ment, and connect with opportunities for
            career growth.</p>
        </div>
      </div>
    </div> --> */}
            </div>

          </div>
        </div>
      </section>

      {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Home  : Future Technolody Labs Section
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}
      <section class="">
        <div class="container">
          <h2 class="section-title py-md-4 text-center color-pink">Empowering Minds Through Future Technology</h2>
          <div class="row g-4 pb-5">

            <div class="col-md-5 large-images" style={{display: 'flex'}}>
              <div class="row g-4">
                <div class="col-12">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home1.jpg" alt="Robotics Workshop" class="img-fluid" />
                  </div>
                </div>
                <div class="col-12">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home2.jpg" alt="Coding Session" class="img-fluid" />
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-7 small-images">
              <div class="row g-4">
                <div class="col-md-6">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home3.jpg" alt="AI Research" class="img-fluid" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home4.jpg" alt="Machine Learning" class="img-fluid" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home5.jpg" alt="Coding Challenge" class="img-fluid" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home6.jpg" alt="Tech Seminar" class="img-fluid" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home7.jpg" alt="Team Project" class="img-fluid" />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="lab-gallery-item">
                    <img src="/Assets/images/homepage/home8.jpg" alt="Innovation Lab" class="img-fluid" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Home 2 : Feature Section
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}
      <section id="skills">

        <div className="home-2_feature-section section-padding">
          <div className="container">
            <div className="row justify-content-center text-center">
              <div className="col-xxl-6 col-lg-7 col-md-9" >
                <div className="section-heading">
                  <h2 className="section-heading__title heading-md fw-light text-uppercase color-pink mb-0">Skills for Success
                  </h2>
                  <h3 className="section-heading__title heading-md fw-bolder text-uppercase color-pink ">Today and Tomorrow
                  </h3>
                  <h4 className="text-black">Let us know who are you?</h4>
                </div>
              </div>
            </div>
            <div className="row justify-content-center gutter-y-default">
              <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2" >
                <div id="student" className="role text-center">
                  <h5 className="text-black fw-bold">STUDENT</h5>
                  <p className="text-black fw-normal pt-1 px-2">Aspiring to launch your career</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/student.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2" >
                <div id="employer" className="role text-center">
                  <h5 className="text-black fw-bold">JOB SEEKER</h5>
                  <p className="text-black fw-normal pt-1 px-2">Find jobs and Internships</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/employee.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2" >
                <div id="employee" className="role text-center">
                  <h5 className="text-black fw-bold">EMPLOYER</h5>
                  <p className="text-black fw-normal pt-1 px-2">Seeking skilled talent</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>

                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/employer.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2">
                <div id="institute" className="role text-center">
                  <h5 className="text-black fw-bold">INSTITUTE</h5>
                  <p className="text-black fw-normal pt-1 px-2">Schools and Colleges</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/employee.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2">
                <div id="educator" className="role text-center">
                  <h5 className="text-black fw-bold">SKILL-EDUCATOR</h5>
                  <p className="text-black fw-normal pt-1 px-2">Passionate for Training</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure className="pt-2">
                  <img src="public_assets/images/newpage/index/skill-educator.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Home 2  : Content Section 1
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}



      {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Home 2  : AR & VR
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}
      <section id="Ar">
        <div className="home-2_content-section-1 section-padding-120" id="">
          <div className="container">
            <div className="row row--custom d-xl-block d-lg-block d-md-none d-sm-none d-none">
              <div className="faq-4_main-section">
                <div className="container">
                  <div className="main-screen">
                    <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">
                      <div className="col-xl-6 col-lg-6 "></div>

                      <div className="col-lg-6 col-md-12 col-sm-12 col-12 mt-0 aos-init aos-animation" data-aos="fade-down" data-aos-duration="1000" data-aos-once="false">

                        <div className="content m-0">
                          <div className="content-text-block">
                            <h2 className="content-title heading-md  how_focal m-0">
                              Future Technology Labs for Institute
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">

                        <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6 my-auto">
                          <div className="tab-content">
                            <div className="tab-pane fade show active" id="general-tab-panes" role="tabpanel"
                              aria-labelledby="cotent-tab" tabindex="0">
                              <div className="accordion-style-7-wrapper robo_img">
                                <figure>
                                  <img src="/Assets/public_assets/images/course/robo.jpg" className="img-fluid" draggable="false" />
                                </figure>
                              </div>
                            </div>
                            <div className="tab-pane fade " id="account-tab-panes1" role="tabpanel" aria-labelledby="cotent-tab"
                              tabindex="0">
                              <div className="accordion-style-7-wrapper robo_img">
                                <figure>
                                  <img src="/Assets/public_assets/images/course/ai.jpg" className="img-fluid"
                                    draggable="false" />
                                </figure>
                              </div>
                            </div>
                            <div className="tab-pane fade " id="purchasing-tab-pane2" role="tabpanel" aria-labelledby="cotent-tab"
                              tabindex="0">
                              <div className="accordion-style-7-wrapper robo_img">
                                <figure>
                                  <img src="/Assets/public_assets/images/course/ar_vr.jpg" className="img-fluid"
                                    draggable="false" />
                                </figure>
                              </div>
                            </div>
                            <div className="tab-pane fade" id="technical-tab-pane3" role="tabpanel" aria-labelledby="cotent-tab"
                              tabindex="0">
                              <div className="accordion-style-7-wrapper robo_img">
                                <figure>
                                  <img src="/Assets/public_assets/images/course/drone.jpg" className="img-fluid"
                                    draggable="false" />
                                </figure>
                              </div>
                            </div>
                            <div className="tab-pane fade" id="continous-tab-pane4" role="tabpanel" aria-labelledby="cotent-tab"
                              tabindex="0">
                              <div className="accordion-style-7-wrapper robo_img">
                                <figure>
                                  <img src="/Assets/public_assets/images/course/iot.jpg" className="img-fluid"
                                    draggable="false" />
                                </figure>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6">
                          <ul className="faq-tab__nav faq-tab__nav2 faq-filter-list feature-widget-7-row" role="tablist"
                            id="cotent-tab">
                            <li className="nav-item" role="presentation">
                              <button className="nav-link active" id="general-tab-nav" data-bs-toggle="tab"
                                data-bs-target="#general-tab-panes" type="button" role="tab" aria-controls="general-tab-panes"
                                aria-selected="true">
                                <div className="mobile-bg">
                                  <div className="feature-widget-7">
                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                      <h5 className="color-pink fw-bold">1</h5>
                                    </div>
                                    <div className="feature-widget-7__body">
                                      <h5 className="feature-widget-7__title mb-0 color-pink">Robotics</h5>
                                      <p>Empower students with hands-on learning in robotics, fostering innovation and critical thinking.</p>
                                    </div>
                                  </div>
                                </div>

                              </button>
                            </li>
                            <li className="nav-item new-nav-item" role="presentation">
                              <button className="nav-link " id="account-tab-nav" data-bs-toggle="tab"
                                data-bs-target="#account-tab-panes1" type="button" role="tab"
                                aria-controls="account-tab-panes1" aria-selected="false">
                                <div className="mobile-bg">
                                  <div className="feature-widget-7">
                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                      <h5 className="color-pink fw-bold">2</h5>
                                    </div>
                                    <div className="feature-widget-7__body">
                                      <h5 className="feature-widget-7__title mb-0 color-pink">Artificial Intelligence</h5>
                                      <p>Equip learners with AI tools and techniques, preparing them for cutting-edge careers in technology.</p>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </li>
                            <li className="nav-item" role="presentation">
                              <button className="nav-link " id="purchasing-tab-nav" data-bs-toggle="tab"
                                data-bs-target="#purchasing-tab-pane2" type="button" role="tab"
                                aria-controls="purchasing-tab-pane2" aria-selected="false" />
                              <div className="mobile-bg">
                                <div className="feature-widget-7">
                                  <div className="feature-widget-7__icon-wrapper my-auto">
                                    <h5 className="color-pink fw-bold">3</h5>
                                  </div>
                                  <div className="feature-widget-7__body">
                                    <h5 className="feature-widget-7__title mb-0 color-pink">AR & VR</h5>
                                    <p>Introduce students to immersive learning experiences with Augmented and Virtual Reality technologies.</p>
                                  </div>
                                </div>
                              </div>
                            </li>
                            <li className="nav-item" role="presentation">
                              <button className="nav-link " id="technical-tab-nav" data-bs-toggle="tab"
                                data-bs-target="#technical-tab-pane3" type="button" role="tab"
                                aria-controls="technical-tab-pane3" aria-selected="false">
                                <div className="mobile-bg">
                                  <div className="feature-widget-7">
                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                      <h5 className="color-pink fw-bold">4</h5>
                                    </div>
                                    <div className="feature-widget-7__body">
                                      <h5 className="feature-widget-7__title mb-0 color-pink">Drone</h5>
                                      <p>Teach students to build, operate, and program drones, opening up opportunities in industries like agriculture, logistics, and surveillance.</p>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </li>
                            <li className="nav-item" role="presentation">
                              <button className="nav-link " id="continous-tab-nav" data-bs-toggle="tab"
                                data-bs-target="#continous-tab-pane4" type="button" role="tab"
                                aria-controls="continous-tab-pane4" aria-selected="false">
                                <div className="mobile-bg">
                                  <div className="feature-widget-7">
                                    <div className="feature-widget-7__icon-wrapper my-auto">
                                      <h5 className="color-pink fw-bold">5</h5>
                                    </div>
                                    <div className="feature-widget-7__body">
                                      <h5 className="feature-widget-7__title mb-0 color-pink">Internet of Things (IoT)</h5>
                                      <p>Train students to connect and control devices through IoT, developing skills for smart home technology, industrial automation, and healthcare applications.</p>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </li>

                          </ul>
                        </div>
                        <div className="row">
                          <div className="col-lg-6"></div>
                          <div className="col-lg-6">

                            <div className="">
                              <div className="new_link text-center">
                                <a href="/labs" className="view_more">View More</a>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                <div className="col-lg-6 col-12 d-xl-none d-lg-none d-md-block d-sm-block d-block">
                  <div className="content">
                    <div className="content-text-block">
                      <h2 className="content-title heading-md text-uppercase how_focal">
                        How Focalyt Works
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="how_sliderdual slider d-xl-none d-lg-none d-md-block d-sm-block d-block" id="how_sliderdual">
                  <div className="">
                    <figure>
                      <img src="public_assets/images/course/courses.jpg" className="img-fluid" draggable="false" />
                    </figure>
                    <div className="feature-widget-7 c_bg_color">
                      <div className="feature-widget-7__icon-wrapper my-auto">
                        <h5 className="color-pink fw-bold">1</h5>
                        <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                      </div>
                      <div className="feature-widget-7__body">
                        <h5 className="feature-widget-7__title mb-0 color-pink">Future-Ready Courses</h5>
                        <p>Advanced courses in AI, Machine Learning, Cloud Computing, Drone Pilot Training, and more to prepare students for future careers.</p>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <figure>
                      <img src="public_assets/images/course/labs.jpg" className="img-fluid" draggable="false" />
                    </figure>
                    <div className="feature-widget-7 c_bg_color">
                      <div className="feature-widget-7__icon-wrapper my-auto">
                        <h5 className="color-pink fw-bold">2</h5>
                        <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                      </div>
                      <div className="feature-widget-7__body">
                        <h5 className="feature-widget-7__title mb-0 color-pink">Future Technology Labs</h5>
                        <p>Set up Future Technology Labs in schools and colleges to provide hands-on learning experiences with cutting-edge technologies.</p>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <figure>
                      <img src="public_assets/images/course/jobs.jpg" className="img-fluid" draggable="false" />
                    </figure>
                    <div className="feature-widget-7 c_bg_color">
                      <div className="feature-widget-7__icon-wrapper my-auto">
                        <h5 className="color-pink fw-bold">3</h5>
                        <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                      </div>
                      <div className="feature-widget-7__body">
                        <h5 className="feature-widget-7__title mb-0 color-pink">Job Opportunities in Future Technology</h5>
                        <p>Offer global career opportunities in emerging tech fields by bridging the gap between skills and industry demands.</p>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <figure>
                      <img src="public_assets/images/course/social_impact.jpg" className="img-fluid" draggable="false" />
                    </figure>
                    <div className="feature-widget-7 c_bg_color">
                      <div className="feature-widget-7__icon-wrapper my-auto">
                        <h5 className="color-pink fw-bold">4</h5>
                        <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                      </div>
                      <div className="feature-widget-7__body">
                        <h5 className="feature-widget-7__title mb-0 color-pink">Social Impact Projects </h5>
                        <p>Execute Govt and CSR initiatives focused on skill development, education, and employment to empower underserved communities.</p>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <figure>
                      <img src="public_assets/images/newpage/index/steps/progress.png" className="img-fluid" draggable="false" />
                    </figure>
                    <div className="feature-widget-7 c_bg_color">
                      <div className="feature-widget-7__icon-wrapper my-auto">
                        <h5 className="color-pink fw-bold">5</h5>
                        <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                      </div>
                      <div className="feature-widget-7__body">
                        <h5 className="feature-widget-7__title mb-0 color-pink">Continuous Progress</h5>
                        <p>Regularly update your profile, track your skill develop- ment, and connect with opportunities for
                          career growth.</p>
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <div className="new_link text-center">
                      <a href="/futureTechnologyLabs" className="view_more">View More</a>
                    </div>
                  </div>
                  {/* <!-- <div className=" --> */}
                </div>

              </div>

            </div>
            <div className="col-lg-6 col-12 d-xl-none d-lg-none d-md-block d-sm-block d-block">
              <div className="small-screen new-small-screen">
                <div className="content m-0">
                  <div className="content-text-block">
                    <h2 className="content-title heading-md how_focal pb-4">
                      Future Technology Labs for Institute
                    </h2>
                  </div>
                </div>
              </div>

            </div>
            <div className="how_sliderdual slider d-xl-none d-lg-none d-md-block d-sm-block d-block" id="how_sliderdual2">
              {/* <!-- <div className="">
            <figure>
              <img src="public_assets/images/newpage/index/steps/regi.png" className="img-fluid" draggable="false"/>
            </figure>
            <div className="feature-widget-7 c_bg_color">
              <div className="feature-widget-7__icon-wrapper my-auto">
                <h5 className="color-pink fw-bold">1</h5>
                <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
              </div>
              <div className="feature-widget-7__body">
                <h5 className="feature-widget-7__title mb-0 color-pink">Drone</h5>
                              <p>Teach students to build, operate, and program drones, opening up opportunities in industries like agriculture, logistics, and surveillance.</p>
              </div>
            </div>
          </div> --> */}
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/robo.jpg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">1</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Robotics</h5>
                    <p>Empower students with hands-on learning in robotics, fostering innovation and critical thinking.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/ai.jpg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">2</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Artificial Intelligence</h5>
                    <p>Equip learners with AI tools and techniques, preparing them for cutting-edge careers in technology.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/ar_vr.jpg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">3</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">AR & VR</h5>
                    <p>Introduce students to immersive learning experiences with Augmented and Virtual Reality technologies.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/drone.jpg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">4</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Drone</h5>
                    <p>Teach students to build, operate, and program drones, opening up opportunities in industries like agriculture, logistics, and surveillance.</p>
                  </div>
                </div>
              </div>
              <div className="">
                <figure>
                  <img src="/Assets/public_assets/images/course/drone.jpg" className="img-fluid" draggable="false" />
                </figure>
                <div className="feature-widget-7 c_bg_color">
                  <div className="feature-widget-7__icon-wrapper my-auto">
                    <h5 className="color-pink fw-bold">5</h5>
                    <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
                  </div>
                  <div className="feature-widget-7__body">
                    <h5 className="feature-widget-7__title mb-0 color-pink">Internet of Things (IoT)</h5>
                    <p>Train students to connect and control devices through IoT, developing skills for smart home technology, industrial automation, and healthcare applications.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* // <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Home 2  : Integration Section
    //   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}


      <section id="whychoose">
        <div className="section-padding-120">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <h2 className="whychoosefocal text-center">
                  Why Choose <span className="linearGradient">
                    Focalyt?
                  </span>
                </h2>
              </div>
              <div className="col-md-12 " >
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="why_choose_sec ">
                      <div className="program-logo">
                        <img src="/Assets/public_assets/images/course/iit.png" alt="logo" />
                      </div>
                      <div className="program-about">
                        <p className="program-description text-center">
                          Program &nbsp;&amp;&nbsp;Curriculum made by
                          IIT Alumni
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="why_choose_sec">
                      <div className="program-logo">
                        <img src="/Assets/public_assets/images/course/course.png" alt="logo" />
                      </div>
                      <div className="program-about">
                        <p className="program-description text-center">
                          Training from Basics to
                          <br />Advance to Professional
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="why_choose_sec">
                      <div className="program-logo">
                        <img src="/Assets/public_assets/images/course/certificate.png" alt="logo" />
                      </div>
                      <div className="program-about">
                        <p className="program-description text-center">
                          Govt. of India
                          <br /> Skill Certification
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="why_choose_sec">
                      <div className="program-logo">
                        <img src="/Assets/public_assets/images/course/intern.png" alt="logo" />
                      </div>
                      <div className="program-about">
                        <p className="program-description text-center">
                          Projects &amp; Internships
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="why_choose_sec">
                      <div className="program-logo">
                        <img src="/Assets/public_assets/images/course/scholarship.png" alt="logo" />
                      </div>
                      <div className="program-about">
                        <p className="program-description text-center">
                          Practical Training

                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="why_choose_sec">
                      <div className="program-logo">
                        <img src="/Assets/public_assets/images/course/learn.png" alt="logo" />
                      </div>
                      <div className="program-about">
                        <p className="program-description text-center">
                          50000+ Learners trained
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* our partners */}
      <section id="partners">
        
        <div className="">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                
                <CompanyPartners />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <section id="candidateReview">
        
        <div className="">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                
                <CandidateReview />
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* reach us  */}

      <section id="reach">
        <div className="section-padding-120">
          <div className="container">
            <div className="row g-5 align-items-center justify-content-center">
              <div className="col-md-12 aos-animation aos-init" data-aos="fade-down" data-aos-duration="1000" data-aos-once="false">
                <h2 className="text--heading text-center primary-gradient1">
                  Our Reach
                </h2>
              </div>
              <div className="col-md-12">
                <div className="row g-5 position-relative">
                  <div className="globe-background"></div>
                  <div className="col-md-4 col-6 ">
                    <div className="inner_reach_section">
                      <h4 className="reach_header">
                        Community of
                        <br />
                        10,00,000+ Students
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4 col-6 position-relative">
                    <div className="inner_reach_section inner_reach_section1">
                      <h4 className="reach_header">
                        Availability <br />
                        <span className="stu_across">Pan India</span>
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4 col-6">
                    <div className="inner_reach_section">
                      <h4 className="reach_header">
                        Partners <br /> 10,000+
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4 col-6">
                    {/* <!-- <div className="inner--socialicon inner_reach_section">
                    <ul>
                      <li>
                        <a href="#">
                          <img src="public_assets/images/social/facebook.png" alt="">
                        </a>
                      </li>
                      <li>
                        <a href="#"> 
                          <img src="public_assets/images/social/instagram.avif" className="insta" alt="">
                        </a>
                      </li>
                      <li>
                          <a href="#">
                            <img src="public_assets/images/social/youtube.avif" alt="">
                          </a>
                      </li>
                    </ul>
                  </div> --> */}
                  </div>
                  <div className="col-md-4 col-6">
                    <div className="inner_reach_section">
                      <h4 className="reach_header">
                        Around the World
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4 col-6">
                    <div className="inner_reach_section text-center">
                      {/* <!-- <h4 className="reach_header">
                      Google Review
                    </h4> --> */}
                      <a href="#"><figure> <img src="/Assets/public_assets/images/icons/google.avif" style={{ width: "100%" }} /></figure></a>
                      <div className="review-box">
                        <p> <span id="rating"></span> out of 5 stars from <sapn id="reviews"></sapn> reviews</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style>
        {
          `
    .images a{
    color : transparent;
    }
    `
        }
      </style>
      <style>
        {
          `
    
/* Hero section  */

.home-2_hero-section .row--custom {
    --bs-gutter-x: 24px;
    --bs-gutter-y: 35px;
    justify-content: center;
    align-items: center;
  }
  
  /* .home-2_hero-image-block {
    position: relative;
    margin-left: 27px;
  } */
  .home-2_hero-image img {
    width: 100%;
  }
  .home-2_hero-image-shape {
    position: absolute;
    right: -9%;
    top: -14%;
    width: 17%;
  }
  .home-2_hero-image-man-1 {
    position: absolute;
    left: -7%;
    top: 30%;
    width: 13.3%;
  }
  .home-2_hero-image-man-1 img {
    width: 100%;
  }
  .home-2_hero-image-man-2 {
    position: absolute;
    right: -7%;
    bottom: 8%;
    width: 15%;
  }
  .home-2_hero-image-man-2 img {
    width: 100%;
  }
  .home-2_hero-content {
    max-width: 681px;
  }
  .home-2_hero-content-text {
    text-align: center;
    margin-bottom: 30px;
  }

  .home-2_hero-content-text p {
    max-width: 590px;
  }

  
  .home-2_hero-button-group {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    column-gap: 20px;
    row-gap: 20px;
    margin-bottom: 20px;
  }

  .home-2_hero-button-group .btn-outline {
    width: 239px;
  }
  
  .home-2_hero-content-button__bottom-text span {
    display: flex;
    justify-content: center;
    column-gap: 10px;
    font-weight: 600;
    font-size: 16px;
    line-height: 1.5;
    color: #0A102F;
  }

  .home-2_hero-content-text h4 {
    color: #FFD542;
    font-size: 30px;
    font-weight: 300;
    word-wrap: break-word;
    word-spacing: 5px;
    text-align: start;
    margin: 0;
    
}
.home-2_hero-content-text h1 {
   background: -webkit-linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%);
   background: -o-linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%);
   background: -moz-linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%);
   background: linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%); 
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: .4s ease-in;
}
.home-2_hero-content-text h1:hover {
    background: -webkit-linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);
    background: -o-linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);;
    background: -moz-linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);;
    background: linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);; 
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
   transition: .8s ease-out;
 }
.last_cta h3 {
    word-spacing: 4px;
}
div#features_cta img {
    width: 100px;
    height: auto;
    text-align: center;
    margin: 0 auto
}
div#features_cta h4 {
    font-size: 14px;
    color: #fff;
    text-align: center;
    font-weight: 300;
    word-wrap: break-word;
    transition: .3s;
}
.cta_cols:hover h4.head {
    transition: .5s!important;
    color: #FFD542!important;
}
.figure {
    position: relative;
    /* width: 360px; */
    /* max-width: 100%; */
  }
  .figure img.Sirv.image-hover {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    object-fit: contain;
    opacity: 0;
    transition: opacity .2s;
  }
  .figure:hover img.Sirv.image-hover {
    opacity: 1;
  }
div#features_cta figure {
    margin: 0;
}
.primary-gradient {
    background-image: linear-gradient(to right, rgba(255,42,86,1) 30%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 47%, rgba(255,255,255,1) 100%);
    -webkit-background-clip: text; /* For older versions of Safari/Chrome */
    background-clip: text;
    color: transparent; /* Make text transparent */
    /* font-size: 60px; */
}
.color-pink {
    color: #FC2B5A !important;
}
.border_cta {
    padding: 10px 25px;
    border-width: 3px !important;
    border-style: solid !important;
    background: linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 1)) padding-box, linear-gradient(to right, rgba(151, 71, 255, 1), rgba(252, 43, 90, 1)) border-box;
    border-radius: 15px !important;
    border: 2px solid transparent !important;
    width: fit-content;
}

  
  /* hero end section  */

  /* HomePage specific styles */

.home-2_hero-section {
  padding-top: 100px;
  padding-bottom: 60px;
  background-color: #121212;
  overflow: hidden;
  position: relative;
}



.home-2_hero-content {
  display: flex;
  /* flex-direction: column; */
  /* align-items: center; */
  row-gap: 30px;
  text-align: center;
}

.hero-content__title {
  color: #fff;
  margin-bottom: 24px;
  font-style: normal;
  line-height: 1.04;
}

.tagline {
  font-size: 60px;
  font-weight: 700;
  padding-bottom: 20px;
  color: #FFD542;
  transform: translateY(20px);
  animation: slideUp 0.8s ease-out forwards 0.3s;
}

.images {
  display: flex;
  gap: 20px;
  transform: translateY(20px);
  justify-content: space-between;
}

.images img {
  width: 70px;
  height: 70px;
  transition: transform 0.3s ease;
}

.images img:hover {
  transform: scale(1.1);
}

.partner_col.tech_area_img {
  height: 100%;
  padding-block: 14px;
  /* width: 299px; */
}

.tech_area_img img {
  width: 25%;
}

.color-pink {
  color: #FC2B5A;
}

/* CTA Styles */
#features_cta .cta_cols {
  text-align: center;
}

#features_cta .figure {
  margin-bottom: 15px;
}

#features_cta .head {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.hidden {
  display: none;
}

.tech_area_img {
  padding: 1rem;
  text-align: center;
}

.tech_area_img img {
  max-width: 100%;
  height: auto;
  margin-bottom: 1rem;
}

.mobile-tech-area {
  text-decoration: none;
  color: inherit;
  display: block;
}
#about .feature-widget-7 {
  transition: .4s ease;
}
#about .active .feature-widget-7 {
  z-index: 1;
  background-color: #fff;
  box-shadow: 0 12px 40px rgba(105,131,160,.2);
  border-radius: 20px;
  width: 100%;
  padding: 10px 20px;
  transition: .3s ease;
}
#about .feature-widget-7:hover {
  z-index: 1;
  background-color: #fff;
  box-shadow: 0 12px 40px rgba(105,131,160,.2);
  border-radius: 20px;
  width: 100%;
  padding: 10px 20px;
  transition: .3s ease;
}
.active .feature-widget-7__icon-wrapper h5 {
  /* width: 2.175rem;
  height: 2.175rem; */
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
  /* color: #fff!important; */
  margin: 0 auto!important;
  /* border: 1px solid #fc2b5a!important; */
  transition: .3s ease!important;
  /* border-radius: 50%;
  background: #fc2b5a; */
  transition: .3s ease;
}
#about .feature-widget-7{
  padding: 10px 20px;
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
.accordion-style-7-wrapper {
  display: flex
;
  flex-direction: column;
}
.robo_img figure img {
  border-radius: 20px;
  box-shadow: 10px -10px 10px rgba(128, 128, 128, 0.5);
}
.accordion-style-7-wrapper img {
  width: 80%;
}
#how, #earning-option {
   background-image: url(../../Assets/public_assets/images/newpage/index/bg-stipes.jpg); 
  // background-image: url(../../../../public/Assets/public_assets/images/newpage/index/bg-stipes.jpg);
  background-color: #FFFFFF;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
}
#skills, #whychoose, .earning-option, #team {
  background-image: url(/Assets/public_assets/images/newpage/index/bg_texture.png);
  // background-image: url(../../../../public/Assets/public_assets/images/newpage/index/bg_texture.png);
  background-color: rgb(244, 250, 250);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
}

/* skills section  */
#skills .role {
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
  /* opacity: 0; */
  transform: translateY(50px);
  border-radius: 12px;
  overflow: hidden;
  transition: 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
#student.role {
  background: rgb(225, 240, 238);
  transition: 0.3s;
}
#student.role:hover {
  box-shadow: rgb(165, 214, 208) 5px 5px;
  border-radius: 10px;
}
/* #skills .role:hover {
  transform: scale(1.05);
} */
/* #skills .role:hover {
  transform: scale(1.05) rotateX(5deg) rotateY(5deg);
} */
.role {
  text-align: center;
  height: 100%;
  border-radius: 20px;
  margin: 0px auto;
  padding: 20px 0px;
}
.role {
  position: relative;
}
#skills .role::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  transition: opacity 0.3s;
}
.role p {
  height: 50px;
}
.role h5 {
  font-size: 16px;
}
.color-pink {
  color: rgb(252, 43, 90) !important;
}
#employer.role {
  background: rgb(191, 206, 255);
  transition: 0.3s;
}
#employer.role:hover {
  box-shadow: rgb(134, 145, 181) 5px 5px;
  border-radius: 10px;
}
#employee.role {
  background: rgb(240, 234, 234);
  transition: 0.3s;
}
#employee.role:hover {
  box-shadow: rgb(184, 158, 158) 5px 5px;
  border-radius: 10px;
}
#institute.role:hover {
  box-shadow: rgb(171, 157, 157) 5px 5px;
  border-radius: 10px;
}
#institute.role {
  background: rgb(221, 221, 221);
  transition: 0.3s;
}
#educator.role {
  background: rgb(241, 221, 221);
  transition: 0.3s;
}
#educator.role:hover {
  box-shadow: rgb(174, 141, 141) 5px 5px;
  border-radius: 10px;
}
.new_link {
  width: 50%;
  margin: auto;
  background: #FC2B5A;
  border-radius: 10px;
  padding: 10px 20px;
  border: 1px solid #fc2b5a;
  color: #fff;
}
.new_link a {
  color: #fff;
  font-weight: 500;
  /* font-family: 'Inter", sans-serif'; */
  transition: .8s ease;
}
.new_link:hover {
  border: 1px solid #fc2b5a;
  color: #000;
  transition: 0.5s ease;
  background: transparent;
}
.new_link:hover a{
  color: #000;
}

/* why choose focalyt  */


#whychoose .whychoosefocal {
  /* opacity: 0;
  transform: scale(0); */
  transition: 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.whychoosefocal {
  margin-bottom: 40px;
  font-weight: 700;
}
.why_choose_sec {
  /* box-shadow: 0px 0px 36px 8px rgba(0, 0, 0, 0.37); */
  border-radius: 22px;
  padding:20px;
  min-height: 205px;
  transition: .5s;
  /* height: 200px; */
}
.why_choose_sec p.text-white {
  font-size: 16px;
  font-weight: 300;
}
#whychoose .why_choose_sec p.text-white{
  font-size: 20px;
  font-weight: 300;
}
#whychoose .program-description{
  /* color: #fc2b5a; */
  font-weight: 600;
}
.why_choose_sec:hover {
  box-shadow: 5px 5px rgb(188, 197, 196);
  transition: .3s ease;
}
#whychoose .col-md-4:nth-child(1) .why_choose_sec {
  background-color: #E1F0EE;
}
#whychoose .col-md-4:nth-child(2) .why_choose_sec {
  background-color: #BFCEFE;
}
#whychoose .col-md-4:nth-child(3) .why_choose_sec {
  background-color: #ded9ff;
}
#whychoose .col-md-4:nth-child(4) .why_choose_sec {
  background-color: #F0EAEA;
}
#whychoose .col-md-4:nth-child(5) .why_choose_sec {
  background-color: #DDDDDD;
}
#whychoose .col-md-4:nth-child(6) .why_choose_sec {
  background-color: #F1DDDD;
}
#whychoose .col-md-4:nth-child(1) .why_choose_sec:hover {
  box-shadow: 0px 5px 15px #E1F0EE;
  transition: all 0.3s ease;
}
#whychoose .col-md-4:nth-child(2) .why_choose_sec:hover {
  box-shadow: 0px 5px 15px #BFCEFE;
  transition: all 0.3s ease;
}
#whychoose .col-md-4:nth-child(3) .why_choose_sec:hover {
  /* box-shadow: 0px 5px 15px #ded9ff; */
  box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
  transition: all 0.3s ease;
}
#whychoose .col-md-4:nth-child(4) .why_choose_sec:hover {
  /* box-shadow: 0px 5px 15px #F0EAEA; */
  box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
  transition: all 0.3s ease;
}
#whychoose .col-md-4:nth-child(5) .why_choose_sec:hover {
  box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
  /* box-shadow: 0px 5px 15px #DDDDDD; */
  transition: all 0.3s ease;
}
#whychoose .col-md-4:nth-child(6) .why_choose_sec:hover {
  box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
  /* box-shadow: 0px 5px 15px #F1DDDD; */
  transition: all 0.3s ease;
}

/* reach us  */
.content h2 {
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.globe-background {
  /* background-image: url(../../../../Assets/public_assets/images/globe.avif); */
  background-image: url(/Assets/public_assets/images/globe.avif);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 150%;
  z-index: 10;
  opacity: 0.2;
}
.tabs--menu{
  display: flex;
  align-items: center;
  gap: 5px;
}
section#hero_sm .home-2_hero-content-text h1 {
  font-size: 55px;
  background: -webkit-linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 30%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
  background: -o-linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 30%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
  background: -moz-linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 30%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
  background: linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 20%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: .4sease-in;
  margin-top: 10px;
}

/* gallery  */
.lab-gallery {
  background-color: #f4f7f6;
  padding: 60px 0;
}

.lab-gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.lab-gallery-item:hover {
  transform: scale(1.03);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.lab-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.lab-gallery-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.6));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lab-gallery-item:hover::before {
  opacity: 1;
}

.large-images .lab-gallery-item {
  height: 100%;
}

.small-images .lab-gallery-item {
  height: 100%;
  /* height: 395px; */
}


@media screen and (max-width: 1440px) {
  .role p {
      font-size: 13px;
  }
}
@media screen and (max-width: 1366px) {
  .role p {
      font-size: 13px;
  }
}
@media screen and (max-width: 1199px) {
  .role p {
      font-size: 11px;
  }
}
@media(max-width:992px){
  .tagline{
    font-size: 45px;
  }
  .home-2_hero-content-text h4 {
    font-size: 55px;
    text-align: center;
  }
  .home-2_hero-content-text h1:hover{
    font-size: 60px;
  }
  .border_cta{
    display: flex
    ;
        align-items: center;
        text-align: center;
        justify-content: center;
        margin-left: 25%;
        margin-right: 25%;
  }
  .last_cta{
    text-align: center;
  }
  #features_cta{
    justify-content: center!important;
  }
  .home-2_hero-content-text {
    text-align: initial;
  }
.home-2_hero-content-text {
    margin-bottom: 20px;
  }
.home-2_hero-button-group {
    justify-content: initial;
    margin-bottom: 20px;
  }
.home-2_hero-content-button__bottom-text span {
  justify-content: initial;
}
.home-2_hero-section .row--custom {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .home-2_hero-section {
    padding-top: 90px;
    padding-bottom: 40px;
  }
   .home-2_hero-content-text h1 {
    font-size: 60px;
    text-align: center;
  }

  .images .home_images {
    width: 50px;
    margin: 8px;
  }

  #features_cta img {
    width: 80px;
  }

  .cta_cols {
    padding: 15px;
  }

  .cta_cols h4 {
    font-size: 13px;
  }

  .border_cta {
    padding: 10px 20px;
  }

  .border_cta p {
    font-size: 15px;
  }

  .last_cta h3 {
    font-size: 22px;
  }
  .home-2_hero-content{
    flex-direction: column;
  }
}
@media  (max-width: 992px) {
  
}
@media (min-width: 992px) {
  .home-2_hero-section .row--custom {
      flex-direction: row-reverse;
      justify-content: space-between;
  }
}
/* Mobile Styles */
@media (max-width: 768px) {
  .home-2_hero-content-text h4 {
    font-size: 40px;
    text-align: center;
  }
  section#hero_sm .home-2_hero-content-text h1 {
    font-size: 40px;
  }
  .home-2_hero-content{
    justify-content: center;
  }
  .home-2_hero-section .row--custom{
    justify-content: start;
    flex-direction: column-reverse;
  }
    .tagline {
    font-size: 25px;
    padding-block: 20px;
  }
  .tech_area_img img {
    width: 100%;
  }
  .slider_images {
    width: 90%;
    margin: 0 auto;
  }

  .slider_images img {
    width: 100%;
  }
  .border_cta{
    margin-left: auto;
    margin-right: auto;
  }
}
@media (max-width: 768px) {
  .large-images .lab-gallery-item,
  .small-images .lab-gallery-item {
      /* height: auto; */
      margin-bottom: 20px;
  }
}
@media (max-width: 576px) {
  .home-2_hero-button-group .btn-outline {
    width: initial;
  }
  .home-2_hero-content-text h4 {
    font-size: 24px;
  }

  .home-2_hero-content-text h1 {
    font-size: 36px;
  }

  .images .home_images {
    width: 40px;
    margin: 5px;
  }

  #features_cta img {
    width: 60px;
  }

  .cta_cols {
    padding: 10px;
  }

  .cta_cols h4 {
    font-size: 12px;
  }

  .border_cta {
    padding: 8px 15px;
  }

  .border_cta p {
    font-size: 14px;
  }

  .last_cta h3 {
    font-size: 20px;
  }

  
  /* Show mobile view */
 .home-2_hero-section {
    padding-top: 120px;
    padding-bottom: 80px;
  }
}
@media screen and (max-width: 480px) {
  .slider_images {
    width: 100%;
  }
}

    `
        }
      </style>
    </FrontLayout>
  );
};

export default HomePage