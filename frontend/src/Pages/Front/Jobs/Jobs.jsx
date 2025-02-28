import React from 'react'
import "./Jobs.css"
import FrontLayout from '../../../Component/Layouts/Front'
function Jobs() {
  return (

    <>
    <FrontLayout>
  {/* <section class="pattern py-5 section-padding-120 margin-top-120" >
    <div class="container">
      <form method="get" id="myForm">
      <div class="row">
        <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mx-auto mt-3">
          <div class="row" id="two_slect">
            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 px-0">
              <div class="input-group mb-xl-3 mb-lg-3 mb-md-1 mb-sm-0 mb-0">
                <button class="btn btn-outline-secondary" type="button"><img
                    src="/Assets/public_assets/images/icons/exchange.png" class="img-fluid" draggable="false"/>
                </button>
                <select class="form-select city_form" name="salary" id="salary"
                  aria-label="Example select with button addon">
                  <option selected="" value="">Choose...</option>
                  <option value="5000" >5000</option>
                  <option value="10000">10000</option>
                  <option value="15000">15000</option>
                  <option value="20000">20000</option>
                  <option value="30000">30000</option>
                  <option value="40000">40000</option>
                  <option value="50000">50000</option>
                  <option value="60000">60000</option>
                  <option value="70000">70000</option>
                  <option value="80000">80000+</option>
                </select>
              </div>
            </div>
            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 px-0">
              <div class="input-group mb-xl-3 mb-lg-3 mb-md-1 mb-sm-0 mb-0">
                <button class="btn btn-outline-secondary exp" type="button"><span class="year">EXP (Years)</span></button>
                <select class="form-select last_select" name="experience" id="experience"
                  aria-label="Example select with button addon">
                  <option selected="" value="">Choose...</option>
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
                  <option value="12">13</option>
                  <option value="14">14</option>
                  <option value="15" >15</option>
                </select>
              </div>
            </div>
          </div>

        </div>
        <div class="col-xxl-8 col-xl-8 col-md-8 col-sm-12 col-12 mx-auto">
          <div class="row justify-content-around overflow-x-auto feature_cta_row" id="features_cta">
     
          </div>
        </div>
      </div>
    </form>
    </div>
    
  </section> */}
  <section className='mt-5 section-padding-120'>
    <div class="container">
      <div class="row">
        <div class="col-md-8 mx-auto">
          <div class="row">
            <div class="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto my-4">
              <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">
                  <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0"
                    class="active activeclass" aria-current="true" aria-label="Slide 1"></button>
                  <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1"
                    aria-label="Slide 2" class="activeclass"></button>
                  <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2"
                    aria-label="Slide 3" class="activeclass"></button>
                  <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="3"
                    aria-label="Slide 4" class="activeclass"></button>
                  <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="4"
                    aria-label="Slide 5" class="activeclass"></button>
                  <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="5"
                    aria-label="Slide 6" class="activeclass"></button>
                </div>
                <div class="carousel-inner ">
                  <div class="carousel-item active">
                    <img src="/Assets/public_assets/images/newjoblisting/banner1.jpg" class="d-block w-100 rounded shadow" alt="..."/>
                  </div>
                  <div class="carousel-item">
                    <img src="/Assets/public_assets/images/newjoblisting/banner2.jpg" class="d-block w-100 rounded shadow" alt="..."/>
                  </div>
                  <div class="carousel-item">
                    <img src="/Assets/public_assets/images/newjoblisting/banner3.jpg" class="d-block w-100 rounded shadow" alt="..."/>
                  </div>
                  <div class="carousel-item">
                    <img src="/Assets/public_assets/images/newjoblisting/banner5.jpg" class="d-block w-100 rounded shadow" alt="..."/>
                  </div>
                  <div class="carousel-item">
                    <img src="/Assets/public_assets/images/newjoblisting/banner6.jpg" class="d-block w-100 rounded shadow" alt="..."/>
                  </div>
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators"
                  data-bs-slide="prev">
                  <span class="carousel-control-prev-icon pree" aria-hidden="true"></span>
                  <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators"
                  data-bs-slide="next">
                  <span class="carousel-control-next-icon pree" aria-hidden="true"></span>
                  <span class="visually-hidden">Next</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* <!-- start --> */}
  <section class="jobs" id="job_theme">
    <div class="container">
      <div class="row mt-5">
        <div
          class="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3 ">
          <div class="row">
            <h1 class="text-center text-uppercase my-5 jobs-heading">Jobs For You</h1>
         
              <div class="col-lg-4 col-md-6 col-sm-12 col-12 pb-4 card-padd d-none">
                <div class="card bg-dark">
                  <div class="bg-img">
                    {/* <!-- Tag added but data is static, need to make dynamic --> */}
                    {/* <!-- <div id="base">
                      <p class="text-center p-0 match_card fw-bolder">Now At</p>
                      <p class="text-center p-0 match_del fw-bold"><del class="text">1000</del></p>
                      <p class="text-center p-0 match_final fw-bold"><%=recentJob.cutprice%></p>
                    </div> --> */}
                      
                 
                        <a href="#"  data-bs-target="#videoModal" data-bs-toggle="modal" data-bs-link=""target="_blank">
                          <img src="https://img.youtube.com/vi/<%=vid%>/maxresdefault.jpg" alt="YouTube Video" class="youtube-thumbnail"/>
                          <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="" class="group1"/>
                        </a>
                          <img src="/Assets/public_assets/images/newjoblisting/job_course.jpg" class="digi" alt=""/>
                          <img src="/Assets/public_assets/images/newjoblisting/playy.svg" alt="" class="group1"/>
                  </div>
                  <div class="card-body alter-card-body px-0 pb-0">
                    <h4 class="card-title text-center text-truncate mx-auto"></h4>
                    <h5 class="mx-auto"></h5>
                    <p class="text-center digi-price mb-3 mt-3">
                      <span class="rupee">₹</span>
                      <span class="r-price"> </span>
                    </p>
                    <div class="row">
                      <div class="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                        <div class="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto">
                          <div class="row">
                            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-3">
                              <div class="row">
                                <div class="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                  <figure class="text-end">
                                    <img src="/Assets/public_assets/images/newjoblisting/qualification.png" class="img-fluid jobFigImg p-0"
                                      draggable="false"/>
                                  </figure>
                                </div>
                                <div
                                  class="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_feature p-0 my-auto">
                                  <p class="mb-0 text-white ">              </p>
                                  {/* <!-- <p class="mb-0 text-white"><small class="sub_head">(12th Pass)</small></p> --> */}
                                </div>
                              </div>
                            </div>
                            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-3">
                              <div class="row">
                                <div class="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                  <figure class="text-end">
                                    <img src="/Assets/public_assets/images/newjoblisting/fresher.png" class="img-fluid jobFigImg p-0"
                                      draggable="false"/>
                                  </figure>
                                </div>
                                <div
                                  class="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_feature px-0 my-auto">
                                  <p class="mb-0 text-white">   </p>
                                
                                </div>
                              </div>
                            </div>
                            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-3">
                              <div class="row">
                                <div class="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                  <figure class="text-end">
                                    <img src="/Assets/public_assets/images/newjoblisting/location.png" class="img-fluid jobFigImg p-0"
                                      draggable="false"/>
                                  </figure>
                                </div>
                                <div
                                  class="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_feature px-0 my-auto">
                                  <p class="mb-0 text-white">
                                    {/* <%=recentJob.city?.name%>, <%=recentJob.state?.name%> */}
                                  </p>
                                  {/* <!-- <p class="mb-0 text-white"><small class="sub_head">(Focalyt App)</small></p> --> */}
                                </div>
                              </div>
                            </div>
                            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-3">
                              <div class="row">
                                <div class="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5">
                                  <figure class="text-end">
                                    <img src="/Assets/public_assets/images/newjoblisting/onsite.png" class="img-fluid jobFigImg p-0"
                                      draggable="false"/>
                                  </figure>
                                </div>
                                <div
                                  class="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_feature px-0 my-auto">
                                  <p class="mb-0 text-white">On-site</p>
                                  {/* <!-- <p class="mb-0 text-white"><small class="sub_head">(Online+Offline)</small></p> --> */}
                                </div>
                              </div>
                            </div>
                            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-3 text-center">
                              <a class="btn cta-callnow btn-bg-color"
                                href="/candidate/login?returnUrl=/candidate/job">Apply Now</a>
                            </div>
                            <div class="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-3 text-center">
                              <a class="btn cta-callnow"
                                href="/candidate/login?returnUrl=/candidate/job">Call Now</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-xxl-12 col-12 col-lg-12 col-md-12 col-sm-12 col-12 course_card_footer">
                      <div class="row py-2">
                        <div
                          class="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 justify-content-center align-items-center text-center">
                          <a href="/jobdetailsmore"><span class="learnn pt-1 text-white">Learn
                              More</span> <img src="/Assets/public_assets/images/link.png" class="align-text-top"/></a>
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

  {/* <!-- end --> */}
  <section id="why">
  <div class="home-2_testimonial-section section-padding-120 bg-primary-opacity-l2">
    <div class="container">
      <div class="row justify-content-center text-center">
        <div class="col-xxl-12">
          <div class="section-heading">
            <h1 class="text-uppercase primary-gradient fw-bolder">Still Confused</h1>
            <h1 class="text-uppercase primary-gradient fw-bolder">why Choose Focalyt ?</h1>
            <h3 class="color-yellow fw-lighter mt-4">Here are the 4 Reasons which make us special:</h3>
          </div>
        </div>
      </div>
      <div class="col-xxl-10 mx-auto justify-content-between">
        <div class="row row--testimonial-widget">
          <div class="col-lg-6 col-md-6 aos-init aos-animate" data-aos="fade-up" data-aos-duration="4000"
            data-aos-delay="300">
            <div class="why_choose_sec">
              <h4 class="text-white pb-3">Practical Learning:</h4>
              <p class="text-white">We offer On-job integrated training programs
                that provide hands-on, real-world experience,
                helping students and employees gain practical
                skills that are immediately applicable in their
                careers.</p>
            </div>
          </div>
          <div class="col-lg-6 col-md-6 aos-init aos-animate" data-aos="fade-up" data-aos-duration="4000"
            data-aos-delay="300">
            <div class="why_choose_sec">
              <h4 class="text-white pb-3">Flexibility:</h4>
              <p class="text-white">Our blended learning courses and flexible sche-
                dules enable you to pursue further education or
                skill enhancement without disrupting your job or
                daily routines, making lifelong learning
                accessible.</p>
            </div>
          </div>
          <div class="col-lg-6 col-md-6 aos-init aos-animate" data-aos="fade-up" data-aos-duration="4000"
            data-aos-delay="300">
            <div class="why_choose_sec">
              <h4 class="text-white pb-3">Global Impact:</h4>
              <p class="text-white">For Skill-Educators, Focalyt offers a platform to
                train online/blended learning worldwide,
                allowing you to connect with a diverse global
                audience and expand your reach.</p>
            </div>
          </div>
          <div class="col-lg-6 col-md-6 aos-init aos-animate" data-aos="fade-up" data-aos-duration="4000"
            data-aos-delay="300">
            <div class="why_choose_sec">
              <h4 class="text-white pb-3">Tailored Solutions:</h4>
              <p class="text-white">At Focalyt, we believe in personalized support.
                We tailor our services to your unique needs,
                whether you're a student, employer, employee,
                or skill-educator, ensuring a perfect fit for your
                goals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
{/* <!-- footer  class=" text-center"  --> */}

{/* <!-- Modal --> */}
<div class="modal fade" id="videoModal" tabindex="-1" role="dialog" aria-labelledby="videoModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <div class="modal-body p-0 text-center embed-responsive">
        <iframe id="jobVid" width="100%" height="400px" src="https://www.youtube.com/embed/voT-0vvfdE0?si=410zFGqJcnBWrJIl" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
       
      </div>
    </div>
  </div>
</div>      
</FrontLayout>
    </>
  )
}

export default Jobs
