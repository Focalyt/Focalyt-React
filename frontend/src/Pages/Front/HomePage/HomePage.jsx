import React, { useState, useEffect } from 'react'
import FrontLayout from '../../../Component/Layouts/Front/index'
import "./HomePage.css";
import $ from 'jquery';
import 'slick-carousel';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import TechnologySlider from '../../../Component/Layouts/Front/TechnologySlider/TechnologySlider';


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
      if ($(".how_sliderdual").slick) {
        $(".how_sliderdual").slick('unslick');
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
                  <img src="/Assets/public_assets/images/icons/drone.png" alt="drone" className="img1" />
                  <img src="/Assets/public_assets/images/icons/ai.png" alt="ai" className="img1" />
                  <img src="/Assets/public_assets/images/icons/robotic.png" alt="robotic" className="img1" />
                  <img src="/Assets/public_assets/images/icons/iot.png" alt="iot" className="img1" />
                  <img src="/Assets/public_assets/images/icons/ar_vr.png" alt="ar vr" className="img1" />
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
                  <img src="/Assets/public_assets/images/icons/drone.png" alt="drone" className="img1" />
                  <img src="/Assets/public_assets/images/icons/ai.png" alt="ai" className="img1" />
                  <img src="/Assets/public_assets/images/icons/robotic.png" alt="robotic" className="img1" />
                  <img src="/Assets/public_assets/images/icons/iot.png" alt="iot" className="img1" />
                  <img src="/Assets/public_assets/images/icons/ar_vr.png" alt="ar vr" className="img1" />
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
                            <h2 className="content-title text-capitalize heading-md how_focal">
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
              <div className="col-lg-2 col-md-2 col-sm-12 col-12" >
                <div id="student" className="role text-center">
                  <h5 className="text-black fw-bold">STUDENT</h5>
                  <p className="text-black fw-normal pt-1 px-2">Aspiring to launch your career</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="https://app.focalyt.com/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/student.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12" >
                <div id="employer" className="role text-center">
                  <h5 className="text-black fw-bold">JOB SEEKER</h5>
                  <p className="text-black fw-normal pt-1 px-2">Find jobs and Internships</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="https://app.focalyt.com/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/employee.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12" >
                <div id="employee" className="role text-center">
                  <h5 className="text-black fw-bold">EMPLOYER</h5>
                  <p className="text-black fw-normal pt-1 px-2">Seeking skilled talent</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="https://app.focalyt.com/candidate/login" className="color-pink pt-2">Get Started &gt;</a>

                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/employer.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12">
                <div id="institute" className="role text-center">
                  <h5 className="text-black fw-bold">INSTITUTE</h5>
                  <p className="text-black fw-normal pt-1 px-2">Schools and Colleges</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="https://app.focalyt.com/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
                  {/* <!-- <figure>
                  <img src="public_assets/images/newpage/index/employee.svg" className="img-fluid" draggable="false">
                </figure> --> */}
                </div>
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-12">
                <div id="educator" className="role text-center">
                  <h5 className="text-black fw-bold">SKILL-EDUCATOR</h5>
                  <p className="text-black fw-normal pt-1 px-2">Passionate for Training</p>
                  {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
                  <a href="https://app.focalyt.com/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
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


    <section class="">
        <div class="container">
            <h2 class="section-title pt-md-0 pt-0 text-center">Our Tech Learning Journey</h2>
            <div class="row g-4">
              
                <div class="col-md-5 large-images">
                    <div class="row g-4">
                        <div class="col-12">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home1.jpg" alt="Robotics Workshop" class="img-fluid"/>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home2.jpg" alt="Coding Session" class="img-fluid"/>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-7 small-images">
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home3.jpg" alt="AI Research" class="img-fluid"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home4.jpg" alt="Machine Learning" class="img-fluid"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home5.jpg" alt="Coding Challenge" class="img-fluid"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home6.jpg" alt="Tech Seminar" class="img-fluid"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home7.jpg" alt="Team Project" class="img-fluid"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="lab-gallery-item">
                                <img src="/Assets/images/homepage/home8.jpg" alt="Innovation Lab" class="img-fluid"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
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
                      <a href="#"><figure> <img src="/Assets/public_assets/images/icons/google.avif" style={{width:"100%"}}/></figure></a>
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

    </FrontLayout>
  );
};

export default HomePage
