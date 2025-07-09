import React, { useState } from 'react'
import FrontLayout from '../../../Component/Layouts/Front';
import axios from 'axios';
function Labs() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    message: "",
    designation: "",
    state: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: ""
  });
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");



    try {
      const response = await axios.post(`${backendUrl}/labs`, {
        ...formData
      }, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Form submitted successfully!"); // ✅ Alert दिखाएगा
        window.location.reload(); // ✅ Page Refresh करेगा


      }
    } catch (error) {
      setErrorMessage("Failed to submit the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <FrontLayout>
        <section className="section-padding-120 mt-5 bg-white">
          <div className="container">
            <div className="labs_section">
              <div className="row align-items-center">
                <div className="col-md-7">

                  <div className="home-2_hero-image-block">
                    <div className="new_font_edit">
                      <h2 className="new">Setup Future Technology Lab setup with Zero cost</h2>
                    </div>
                    <h2 className="tagline font-size">
                      #Building Future Ready Minds
                    </h2>
                  </div>
                  <div className="images new_images">
                    <div className="icon-container" data-target="drone-section">
                      <img className="home_images img1" src="/Assets/public_assets/images/icons/new_icon/drone.png" alt="drone" />
                      <div className="drone-path">
                        <svg id="svg-path" viewBox="0 0 1920 1080" preserveAspectRatio="none">
                          <path id="motionPath" fill="none" stroke="transparent" />
                        </svg>
                      </div>

                    </div>
                    <div className="icon-container" data-target="robotics-section">
                      <img className="home_images img1" src="/Assets/public_assets/images/icons/new_icon/robotic.png" alt="robotic" />
                      {/* <!-- <video className="home_images drone-video" autoplay loop muted playsinline>
                  <source src="public_assets/videos/drone.mp4" type="video/mp4">
                </video> --> */}
                      <div className="drone-path">
                        <svg id="svg-path" viewBox="0 0 1920 1080" preserveAspectRatio="none">
                          <path id="motionPath" fill="none" stroke="transparent" />
                        </svg>
                      </div>
                    </div>
                    <div className="icon-container" data-target="ai-section">
                      <img className="home_images img1" src="/Assets/public_assets/images/icons/new_icon/ai.png" alt="ai" />
                      {/* <!-- <video className="home_images drone-video" autoplay loop muted playsinline>
                  <source src="public_assets/videos/drone.mp4" type="video/mp4">
                </video> --> */}
                      <div className="drone-path">
                        <svg id="svg-path" viewBox="0 0 1920 1080" preserveAspectRatio="none">
                          <path id="motionPath" fill="none" stroke="transparent" />
                        </svg>
                      </div>
                    </div>
                    <div className="icon-container" data-target="iot-section">
                      <img className="home_images img1" src="/Assets/public_assets/images/icons/new_icon/iot.png" alt="iot" />
                      {/* <!-- <video className="home_images drone-video" autoplay loop muted playsinline>
                  <source src="public_assets/videos/drone.mp4" type="video/mp4">
                </video> --> */}
                      <div className="drone-path">
                        <svg id="svg-path" viewBox="0 0 1920 1080" preserveAspectRatio="none">
                          <path id="motionPath" fill="none" stroke="transparent" />
                        </svg>
                      </div>
                    </div>
                    <div className="icon-container" data-target="arvr-section">
                      <img className="home_images img1" src="/Assets/public_assets/images/icons/new_icon/ar_vr.png" alt="ar_vr" />
                      {/* <!-- <video className="home_images drone-video" autoplay loop muted playsinline>
                  <source src="public_assets/videos/drone.mp4" type="video/mp4">
                </video> --> */}
                      <div className="drone-path">
                        <svg id="svg-path" viewBox="0 0 1920 1080" preserveAspectRatio="none">
                          <path id="motionPath" fill="none" stroke="transparent" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="book_a_demo">
                      <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                        Book a free demo
                      </button>
                      <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                        <div className="modal-dialog new-model-dialog">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h5 className="modal-title text-white" id="staticBackdropLabel">Book your Free Demo Today!</h5>
                              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body new-modal-body">
                              <div className="container">
                                <div className="row">
                                  <div className="col-md-12">
                                    <div className="demo_table">
                                      {/* Add onSubmit handler to the form */}
                                      <form method="post" id="demoForm" className='demoForm' onSubmit={handleSubmit}>
                                        <div className="demo_form">
                                          {/* Add status message display */}
                                          {submitStatus.message && (
                                            <div className={`alert ${submitStatus.success ? 'alert-success' : 'alert-danger'}`} role="alert">
                                              {submitStatus.message}
                                            </div>
                                          )}

                                          <div className="form_name">
                                            <div className="first_name">
                                              <input
                                                name="name"
                                                type="text"
                                                className="form_input"
                                                placeholder=""
                                                id="fullName"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                              />
                                              <label className="label">Full Name <span className="imp">*</span></label>
                                            </div>
                                            <div className="email">
                                              <input
                                                name="email"
                                                type="email"
                                                className="form_input"
                                                placeholder=""
                                                id="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                              />
                                              <label className="label">Email <span className="imp">*</span></label>
                                            </div>
                                          </div>

                                          <div className="form_name">
                                            <div className="phone">
                                              <input
                                                name="mobile"
                                                className="form_input"
                                                type="text"
                                                placeholder=""
                                                id="phone"
                                                required
                                                maxLength="10"
                                                pattern="^\d{10}$"
                                                value={formData.mobile}
                                                onChange={handleInputChange}
                                                onInput={(e) => {
                                                  e.target.value = e.target.value.slice(0, 10).replace(/[^0-9]/g, '');
                                                }}
                                              />
                                              <label className="label">Phone <span className="imp">*</span></label>
                                            </div>
                                            <div className="Organisation">
                                              <input
                                                name="organisation"
                                                className="form_input"
                                                required
                                                placeholder=""
                                                type="text"
                                                id="organisation"
                                                value={formData.organisation}
                                                onChange={handleInputChange}
                                              />
                                              <label className="label">Name of Institute <span>*</span></label>
                                            </div>
                                          </div>

                                          <div className="form_name">
                                            <div className="designation select-container">
                                              <input
                                                name="designation"
                                                className="form_input"
                                                required
                                                placeholder=""
                                                type="text"
                                                id="designation"
                                                value={formData.designation}
                                                onChange={handleInputChange}
                                              />
                                              <label className="label" htmlFor="Designation">Designation <span className="imp">*</span></label>
                                            </div>
                                            <div className="state">
                                              <select
                                                name="state"
                                                className="form_designation_input"
                                                id="state"
                                                required
                                                value={formData.state}
                                                onChange={handleInputChange}
                                              >
                                                <option value="" disabled>Select your State</option>
                                                {/* Include all your state options here */}
                                                <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                <option value="Arunachal Pradesh">
                                                  Arunachal
                                                  Pradesh</option>
                                                <option value="Assam">Assam
                                                </option>
                                                <option value="Bihar">Bihar
                                                </option>
                                                <option value="Chhattisgarh">
                                                  Chhattisgarh</option>
                                                <option value="Goa">Goa</option>
                                                <option value="Gujarat">Gujarat
                                                </option>
                                                <option value="Haryana">Haryana
                                                </option>
                                                <option value="Himachal Pradesh">
                                                  Himachal
                                                  Pradesh</option>
                                                <option value="Jharkhand">
                                                  Jharkhand</option>
                                                <option value="Karnataka">
                                                  Karnataka</option>
                                                <option value="Kerala">Kerala
                                                </option>
                                                <option value="Madhya Pradesh">
                                                  Madhya
                                                  Pradesh</option>
                                                <option value="Maharashtra">
                                                  Maharashtra</option>
                                                <option value="Manipur">Manipur
                                                </option>
                                                <option value="Meghalaya">
                                                  Meghalaya</option>
                                                <option value="Mizoram">Mizoram
                                                </option>
                                                <option value="Nagaland">
                                                  Nagaland</option>
                                                <option value="Odisha">Odisha
                                                </option>
                                                <option value="Punjab">Punjab
                                                </option>
                                                <option value="Rajasthan">
                                                  Rajasthan</option>
                                                <option value="Sikkim">Sikkim
                                                </option>
                                                <option value="Tamil Nadu">Tamil
                                                  Nadu</option>
                                                <option value="Telangana">
                                                  Telangana</option>
                                                <option value="Tripura">Tripura
                                                </option>
                                                <option value="Uttar Pradesh">
                                                  Uttar
                                                  Pradesh</option>
                                                <option value="Uttarakhand">
                                                  Uttarakhand</option>
                                                <option value="West Bengal">West
                                                  Bengal</option>
                                                <option value="Andaman and Nicobar Islands">
                                                  Andaman
                                                  and
                                                  Nicobar
                                                  Islands
                                                </option>
                                                <option value="Chandigarh">
                                                  Chandigarh</option>
                                                <option value="Dadra and Nagar Haveli and Daman and Diu">
                                                  Dadra
                                                  and
                                                  Nagar
                                                  Haveli
                                                  and
                                                  Daman
                                                  and
                                                  Diu</option>
                                                <option value="Delhi">Delhi
                                                </option>
                                                <option value="Lakshadweep">
                                                  Lakshadweep</option>
                                                <option value="Puducherry">
                                                  Puducherry</option>
                                                <option value="Ladakh">Ladakh
                                                </option>
                                                <option value="Jammu and Kashmir">
                                                  Jammu
                                                  and
                                                  Kashmir</option>
                                              </select>
                                              <label className="label">State <span className="imp">*</span></label>
                                            </div>
                                          </div>

                                          <div className="textarea-container">
                                            <textarea
                                              id="message"
                                              name="message"
                                              placeholder=" "
                                              rows="2"
                                              required
                                              value={formData.message}
                                              onChange={handleInputChange}
                                            ></textarea>
                                            <label htmlFor="exampleTextarea">Your Message</label>
                                          </div>

                                          <button
                                            type="submit"
                                            className="submit_btnn g-recaptcha"
                                            disabled={isSubmitting}
                                            data-callback='onSubmit'
                                            data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v"
                                          >
                                            {isSubmitting ? "Submitting..." : "Book Demo"}
                                          </button>
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* <!-- Modal --> */}
                      {/* <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                    <div className="modal-dialog new-model-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title" id="staticBackdropLabel">Book your Free Demo Today!</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body new-modal-body">
                          <div className="container">
                            <div className="row">
                              
                              <div className="col-md-12">
                                <div className="demo_table">
                                  <form method="post" id="demoForm">
                                    <div className="demo_form">
                                     
                                      <div className="form_name">
                                        <div className="first_name">
                                          <input name="name" type="text" className="form_input" placeholder id="fullName" required/>
                                          <label className="label">Full
                                            Name
                                            <span className="imp">*</span></label>
                                        </div>
                                        <div className="email">
                                          <input name="email" type="text" className="form_input" placeholder id="email" required/>
                                          <label className="label">Email
                                            <span className="imp">*</span></label>
                                        </div>
                                      </div>
                                      <div className="form_name">
                                        <div className="phone">
                                          <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')"/>
                                          <label className="label">Phone
                                            <span className="imp">*</span></label>
                                        </div>
                                        <div className="Organisation">
                                          <input name="organisation" className="form_input" required placeholder type="text" id="organisation"/>
                                          <label className="label">Name
                                            of
                                            Institute
                                            <span>*</span></label>
                                        </div>
                                      </div>
                                      <div className="form_name">
                                        <div className="designation select-container">
                                          <select name="designation" className="form_designation_input" id="designation" required>
                                            <option value disabled selected>Select
                                              your
                                              designation</option>
                                            <option value="manager">Manager
                                            </option>
                                            <option value="developer">
                                              Developer</option>
                                            <option value="designer">
                                              Designer</option>
                                            <option value="tester">Tester
                                            </option>
                                          </select>
                                          <label className="label" for="Designation">
                                            Designation
                                            <span className="imp">*</span></label>
                                        </div>
                                        <div className="state">
                                          <select name="state" className="form_designation_input" id="state" required>
                                            <option value disabled selected>Select
                                              your
                                              State
                                            </option>
                                            <option value="Andhra Pradesh">
                                              Andhra
                                              Pradesh</option>
                                            <option value="Arunachal Pradesh">
                                              Arunachal
                                              Pradesh</option>
                                            <option value="Assam">Assam
                                            </option>
                                            <option value="Bihar">Bihar
                                            </option>
                                            <option value="Chhattisgarh">
                                              Chhattisgarh</option>
                                            <option value="Goa">Goa</option>
                                            <option value="Gujarat">Gujarat
                                            </option>
                                            <option value="Haryana">Haryana
                                            </option>
                                            <option value="Himachal Pradesh">
                                              Himachal
                                              Pradesh</option>
                                            <option value="Jharkhand">
                                              Jharkhand</option>
                                            <option value="Karnataka">
                                              Karnataka</option>
                                            <option value="Kerala">Kerala
                                            </option>
                                            <option value="Madhya Pradesh">
                                              Madhya
                                              Pradesh</option>
                                            <option value="Maharashtra">
                                              Maharashtra</option>
                                            <option value="Manipur">Manipur
                                            </option>
                                            <option value="Meghalaya">
                                              Meghalaya</option>
                                            <option value="Mizoram">Mizoram
                                            </option>
                                            <option value="Nagaland">
                                              Nagaland</option>
                                            <option value="Odisha">Odisha
                                            </option>
                                            <option value="Punjab">Punjab
                                            </option>
                                            <option value="Rajasthan">
                                              Rajasthan</option>
                                            <option value="Sikkim">Sikkim
                                            </option>
                                            <option value="Tamil Nadu">Tamil
                                              Nadu</option>
                                            <option value="Telangana">
                                              Telangana</option>
                                            <option value="Tripura">Tripura
                                            </option>
                                            <option value="Uttar Pradesh">
                                              Uttar
                                              Pradesh</option>
                                            <option value="Uttarakhand">
                                              Uttarakhand</option>
                                            <option value="West Bengal">West
                                              Bengal</option>
                                            <option value="Andaman and Nicobar Islands">
                                              Andaman
                                              and
                                              Nicobar
                                              Islands
                                            </option>
                                            <option value="Chandigarh">
                                              Chandigarh</option>
                                            <option value="Dadra and Nagar Haveli and Daman and Diu">
                                              Dadra
                                              and
                                              Nagar
                                              Haveli
                                              and
                                              Daman
                                              and
                                              Diu</option>
                                            <option value="Delhi">Delhi
                                            </option>
                                            <option value="Lakshadweep">
                                              Lakshadweep</option>
                                            <option value="Puducherry">
                                              Puducherry</option>
                                            <option value="Ladakh">Ladakh
                                            </option>
                                            <option value="Jammu and Kashmir">
                                              Jammu
                                              and
                                              Kashmir</option>
                                          </select>
                                          <label className="label">State
                                            <span className="imp">*</span></label>
                                        </div>
                                      </div>
  
                                    <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                                placeholder="Message us" rows="2" ></textarea> -->
                                      <div className="textarea-container">
                                        <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                        <label for="exampleTextarea">Your
                                          Message</label>
                                      </div>
  
                                      <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                        Demo</button>
                                    </div>
                                    
  
                                  </form>
  
                                </div>
  
                              </div>
  
                            </div>
                          </div>
                        </div>
  
                      </div>
                    </div>
                  </div> */}

                    </div>
                  </div>

                </div>
                <div className="col-md-5">

                  <div className="elementor-widget-right-side">
                    <div className="elementor_widget_image">
                      <figure>
                        <img src="/Assets/public_assets/images/labs/future-labs.png" alt="" />
                      </figure>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </section>
        <section className="hardware">
          <div className="container">
            <h1>Common Challenges Faced by Institutes</h1>
            <div className="challenges-grid">
              <div className="challenge-card">
                <div className="icon">💡</div>
                <h3 className="challenge-title">High Investment Barrier</h3>
                <p className="challenge-description">Want to Introduce Technology and Innovation in your Institute? HIGH INVESTMENT shouldn't hold you up</p>
                <div className="divider"></div>
                <p className="solution">Zero hardware investment required for setting up a Focalyt Future Technology Lab in your Institute: Student enrollments are the perfect solution for you.</p>
              </div>

              <div className="challenge-card">
                <div className="icon">🔄</div>
                <h3 className="challenge-title">Rapid Technological Changes</h3>
                <p className="challenge-description">Worried about Rapid Change in Technologies and hardware lab obsolescence?</p>
                <div className="divider"></div>
                <p className="solution">We are always up to date with the Technological Innovation & our team is always equipped with latest kits.</p>
              </div>

              <div className="challenge-card">
                <div className="icon">🎓</div>
                <h3 className="challenge-title">Career-Ready Certification</h3>
                <p className="challenge-description">Want your students and Faculty to be certified in ways that boost their future prospects?</p>
                <div className="divider"></div>
                <p className="solution">We provide industry-recognized certifications that directly enhance career opportunities.</p>
              </div>
            </div>

            <a href="/contact" className="cta-button">Get Started Today</a>
          </div>
        </section>
        <section className="solution">
          <div className="benefits-container">
            <h1 className="main-title">Revolutionizing Education Technology</h1>

            <div className="benefits-wrapper">
              <div className="benefit-item">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div className="content m-0">
                  <h2>Expert Support</h2>
                  <p>Our team of skilled trainers and engineers provides proper guidance and hands-on training to your students and faculty. You will receive continuous support at every step of the process.</p>
                </div>
              </div>

              <div className="benefit-item reverse">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="content m-0">
                  <h2>Reduced Costs</h2>
                  <p>No need for heavy investments in infrastructure and equipment. We offer modern technology & innovative training solutions that fit your budget without requiring significant capital expenditure.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </div>
                <div className="content m-0">
                  <h2>Enhanced Market Visibility</h2>
                  <p>Your institute will be recognized as a modern, innovative institution that provides cutting-edge technology and future-ready education, strengthening your reputation in the education sector.</p>
                </div>
              </div>

              <div className="benefit-item reverse">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <div className="content m-0">
                  <h2>Hands-On Practical Training</h2>
                  <p>Students gain not just theoretical knowledge but also practical, real-world experience. With advanced tools and technologies, they develop industry-ready skills that are highly in demand today.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div className="content m-0">
                  <h2>Access Emerging Technologies</h2>
                  <p>Stay ahead with access to the latest tools and kits for every new innovation. This ensures that your students are always in sync with global technological advancements.</p>
                </div>
              </div>

              <div className="benefit-item reverse">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
                </div>
                <div className="content m-0">
                  <h2>Focus on Learning Outcomes</h2>
                  <p>Free yourself from infrastructure and maintenance worries and focus solely on enhancing student learning and growth. All backend and hardware management is handled by us.</p>
                </div>
              </div>
            </div>
            <div className="book_a_demo text-center">
              <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                Book a free demo
              </button>
            </div>
          </div>
        </section>
        {/* <!-- <section className="hardware_prob">
  <div className="container">
   
  <div className="bottom-border">
    <h2 className="text-white text-center">Common Challenges Faced by Institute</h2>
    <p className="common_text">Want to Introduce Technology and Innovation in your Institue, HIGH INVESTMENT in the same is holding you up</p>
  
  <div className="zero_investment">
    <p className="zero text-center">
      Zero hardware Investent is required for setting up a Focalyt Future Technology Lab in your Institute: Student enrollments are the perfect solution for you.
    </p>
  </div>
  </div>
<div className="change_tech">
  <h2 className="change">Worried about Rapid Change in Technologies and the fear of hardware lab becoming obsolete after some time</h2>
  <div className="zero_investment">
    <p className="zero text-center">
      We are always up to date with the Technological Innovation &
      our team is always equipped with latest kits.
    </p>
  </div>
</div>
<div className="change_tech">
  <h2 className="new_change">Want your student and Faculty to be certified that is
    useful in their future prospect.</h2>
  <div className="zero_investment">
    <p className="zero text-center">
      Want your student and Faculty to be certified that is
useful in their future prospect.
    </p>
  </div>
</div>

  </div>
</section> --> */}
        <section id="bookDemo" className="bg-white">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-12">
                <div className="section-header">
                  <h2 className="book_demo_today text-black text-center">
                    Book your FREE Demo Today!
                  </h2>
                  <p className="header_underline"></p>

                  <p className="demoQuate text-black text-center">
                    Are you ready to experience the power of AI and Robotics? Request a free demo of our AI and Robotics
                    ecosystem today!
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="demo_table">
                  <form method="post" id="demo--Form" className='demoForm' onSubmit={handleSubmit}>
                    <div className="demo_form">
                      <h3 className="request_demo text-black pb-3">
                        Request your Demo Today
                      </h3>
                      {submitStatus.message && (
                        <div className={`alert ${submitStatus.success ? 'alert-success' : 'alert-danger'}`} role="alert">
                          {submitStatus.message}
                        </div>
                      )}

                      <div className="form_name">
                        <div className="first_name">
                          <input name="name" type="text" className="form_input" placeholder="" id="fullName" required value={formData.name}
                            onChange={handleInputChange} />
                          <label className="label">Full Name <span className="imp">*</span></label>
                        </div>
                        <div className="email">
                          <input name="email" type="text" className="form_input" placeholder="" id="email" required value={formData.email}
                            onChange={handleInputChange} />
                          <label className="label">Email <span className="imp">*</span></label>
                        </div>
                      </div>
                      <div className="form_name">
                        <div className="phone">
                          <input name="mobile" className="form_input" type="text" placeholder="" id="phone" required
                            maxLength="10"
                            pattern="^\d{10}$"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            onInput={(e) => {
                              e.target.value = e.target.value.slice(0, 10).replace(/[^0-9]/g, '');
                            }} />
                          <label className="label">Phone <span className="imp">*</span></label>
                        </div>
                        <div className="Organisation">
                          <input name="organisation" className="form_input" required placeholder="" type="text" id="organisation" value={formData.organisation}
                            onChange={handleInputChange} />
                          <label className="label">Name of Institute <span>*</span></label>
                        </div>
                      </div>
                      <div className="form_name">
                        <div className="designation select-container">
                          <input
                            name="designation"
                            className="form_input"
                            required
                            placeholder=""
                            type="text"
                            id="designation"
                            value={formData.designation}
                            onChange={handleInputChange}
                          />
                          <label className="label" for="Designation"> Designation <span className="imp">*</span></label>
                        </div>
                        <div className="state">
                          <select name="state" className="form_designation_input" id="state" required value={formData.state}
                            onChange={handleInputChange}>
                            <option value="" disabled selected>Select your State</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                            <option value="Chandigarh">Chandigarh</option>
                            <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Lakshadweep">Lakshadweep</option>
                            <option value="Puducherry">Puducherry</option>
                            <option value="Ladakh">Ladakh</option>
                            <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                          </select>
                          <label className="label">State <span className="imp">*</span></label>
                        </div>
                      </div>


                      {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                    placeholder="Message us" rows="2" ></textarea> --> */}
                      <div className="textarea-container">
                        <textarea id="message" name="message" placeholder=" " rows="2" required value={formData.message}
                          onChange={handleInputChange}></textarea>
                        <label for="exampleTextarea">Your Message</label>
                      </div>

                      <button type="submit" className="submit_btn g-recaptcha" disabled={isSubmitting} data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v" > {isSubmitting ? "Submitting..." : "Book Demo"}</button>
                    </div>


                  </form>

                </div>


              </div>
              <div className="col-md-6">
                <div className="demo_experience">
                  <h3 className="Robotics text-black">
                    Experience the power of Future Technology Labs with us!
                  </h3>
                  <div className="underline"></div>
                  <div className="robo_area">
                    <p>
                      Discover the power of Focalyt-Future Technology Labs – an innovative hub for Drone Technology, AI, Robotics, AR/VR, IoT, and Future Skills! Our state-of-the-art labs empower students with hands-on learning, industry-relevant skills, and real-world applications. Designed for schools, colleges, and skilling institutions, our expert-driven solutions bring cutting-edge technology to the classNameroom, preparing learners for the careers of tomorrow.</p>
                    <p>
                      In as little as one hour, we can assign the right resources to your specific educational requirements and help unlock the countless possibilities Focalyt provides.
                    </p>
                    <p>
                      Contact us today for a free demonstration tailored to your institution’s needs! Experience how Focalyt-Future Technology Labs can transform learning with Drone Technology, AI, Robotics, AR/VR, IoT, and more. Act now and bring cutting-edge innovation to your classNamerooms—preparing students for the future of technology-driven careers!
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="">
          <div className="container">
            <div className="row g-3">
              <h2 className="products text-center">
                Our Products
              </h2>
              <p className="pro_labs text-center text-capitalize"> explore Our future Technology Labs</p>

              <div className="col-md-12">
                <div className="row justify-content-evenly py-3 g-5">
                  <div className="col-md-3">
                    <div className="ar_labs">
                      <figure>
                        <img src="/Assets/public_assets/images/labs/ar_vr.jpg" alt="AR/VR" />
                      </figure>
                      <h4 className="h4 text-capitalize">Ar/Vr Labs</h4>

                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="ar_labs">
                      <figure>
                        <img src="/Assets/public_assets/images/labs/drone.jpg" alt="Drone" />
                      </figure>
                      <h4 className="h4 text-capitalize">Drone Labs</h4>

                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="ar_labs">
                      <figure>
                        <img src="/Assets/public_assets/images/course/robo.png" alt="Robotics" />
                      </figure>
                      <h4 className="h4 text-capitalize">Robotics Labs</h4>

                    </div>
                  </div>

                </div>
                <div className="row justify-content-evenly pt-3 pb-5 g-5">
                  <div className="col-md-3">
                    <div className="ar_labs">
                      <figure>
                        <img src="/Assets/public_assets/images/course/iot.png" alt="IOT" />
                      </figure>
                      <h4 className="h4 text-capitalize">IOT (Internet Of Things)</h4>

                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="ar_labs">
                      <figure>
                        <img src="/Assets/public_assets/images/labs/ai.png" alt="AI" />
                      </figure>
                      <h4 className="h4 text-capitalize">Artificial intelligence</h4>

                    </div>
                  </div>

                  <div className='col-md-12 m-0'>
                    <div className="book_a_demo text-center">
                      <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                        Book a free demo
                      </button>
                    </div>
                  </div>
                </div>
                <div className="row justify-content-center py-3">

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- labs description sectroin  --> */}
        <section className="bg-white">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="labs-desc" id="arvr-section">
                  <div className="desc_img">
                    <figure>
                      <img src="/Assets/public_assets/images/course/ar_vr.jpg" alt="" />
                    </figure>
                  </div>
                  <div className="desc_img_content">
                    <h2 className="desc_header text-uppercase">AR vr labs</h2>

                    <div>
                      <h5 className="desc_sub_header">What is an AR/VR Lab?</h5>
                      <p className="desc_para">
                        An Augmented Reality (AR) and Virtual Reality (VR) Lab is a cutting-edge facility designed to provide immersive, interactive, and experiential learning experiences. These labs leverage AR, VR, and Mixed Reality (MR) technologies to enhance education, research, and training across multiple industries, including education, healthcare, engineering, manufacturing, and defense.
                      </p>
                    </div>
                    <div>
                      <h5 className="desc_sub_header">Why AR/VR Labs?</h5>
                      <p className="desc_para">
                        Traditional learning methods rely on textbooks, videos, and simulations. AR/VR Labs take learning beyond the classNameroom by providing a real-time, interactive environment where students and professionals can visualize concepts, explore virtual environments, and gain hands-on experience with complex subjects.
                      </p>
                    </div>
                    <div className="book_a_demo text-center">
                      <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                        Book a free demo
                      </button>
                    </div>

                    <div>

                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="labs-desc" id="drone-section">
                  <div className="desc_img_content">
                    <h2 className="desc_header text-uppercase">Drone Labs</h2>

                    <div>
                      <h5 className="desc_sub_header">What is a Drone Lab?</h5>
                      <p className="desc_para">
                        A Drone Lab is an advanced learning space designed to provide hands-on experience with Unmanned Aerial Vehicles (UAVs). These labs are equipped with cutting-edge drone technology, flight simulators, and real-world training environments to help students learn about drone operation, maintenance, programming, and industry applications.
                      </p>
                    </div>
                    <div>
                      <h5 className="desc_sub_header">Why Learn in a Drone Lab?</h5>
                      <p className="desc_para">
                        Drones are transforming industries like agriculture, defense, construction, filmmaking, logistics, and disaster management. With the rise of drone technology, certified drone pilots and experts are in high demand. A Drone Lab gives students the skills, knowledge, and hands-on experience to excel in this futuristic career path.
                      </p>
                    </div>
                    <div className="book_a_demo text-center">
                      <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                        Book a free demo
                      </button>
                    </div>
                    <div>

                    </div>
                  </div>
                  <div className="desc_img">
                    <figure>
                      <img src="/Assets/public_assets/images/course/drone.jpg" alt="" />
                    </figure>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="labs-desc" id="robotics-section">
                  <div className="desc_img">
                    <figure>
                      <img src="/Assets/public_assets/images/course/robo.jpg" alt="" />
                    </figure>
                  </div>
                  <div className="desc_img_content">
                    <h2 className="desc_header text-uppercase">Robotics labs</h2>
                    <div>
                      <h5 className="desc_sub_header">What is a Robotics Lab?</h5>
                      <p className="desc_para">
                        A Robotics Lab is an advanced learning space designed to provide students with hands-on experience in robotics, automation, and AI-powered machines. Equipped with cutting-edge robotic kits, programming tools, and AI integration platforms, our lab enables students to design, build, and control robots for various real-world applications.
                      </p>
                    </div>
                    <div>
                      <h5 className="desc_sub_header">Why Learn Robotics?</h5>
                      <p className="desc_para">
                        The future belongs to automation, AI, and robotics, and industries like manufacturing, healthcare, defense, space exploration, and smart cities rely heavily on robotic technology. By learning robotics, students develop problem-solving skills, logical thinking, and hands-on experience with emerging technologies that are shaping the future.
                      </p>
                    </div>
                    <div>
                      <div className="book_a_demo text-center">
                        <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                          Book a free demo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="labs-desc" id="iot-section">
                  <div className="desc_img_content">
                    <h2 className="desc_header text-uppercase">Internet of things (IOT)</h2>
                    <div>
                      <h5 className="desc_sub_header">What is an IoT Lab?</h5>
                      <p className="desc_para">
                        An Internet of Things (IoT) Lab is an advanced learning space where students explore the world of connected devices, automation, and smart technology. Equipped with IoT development boards, sensors, cloud platforms, and AI integration tools, our IoT Lab helps students build real-world smart systems used in homes, industries, healthcare, agriculture, and more.
                      </p>
                    </div>
                    <div>
                      <h5 className="desc_sub_header">Why Learn IoT?</h5>
                      <p className="desc_para">
                        The Internet of Things (IoT) is revolutionizing industries by connecting devices, analyzing data, and automating tasks. From smart homes and wearable tech to industrial automation and smart cities, IoT is shaping the future. Learning IoT opens doors to high-demand careers in AI, robotics, data science, and cybersecurity.
                      </p>
                    </div>
                    <div>
                      <div>
                        <div className="book_a_demo text-center">
                          <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                            Book a free demo
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                  <div className="desc_img">
                    <figure>
                      <img src="/Assets/public_assets/images/course/iot.jpg" alt="" />
                    </figure>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="labs-desc" id="ai-section">
                    <div className="desc_img">
                      <figure>
                        <img src="/Assets/public_assets/images/course/ai.jpg" alt="" />
                      </figure>
                    </div>
                    <div className="desc_img_content">
                      <h2 className="desc_header text-uppercase">Artificial Intelligence (AI)</h2>
                      <div>
                        <h5 className="desc_sub_header">What is an AI Lab?</h5>
                        <p className="desc_para">
                          An Artificial Intelligence (AI) Lab is an advanced learning environment where students gain hands-on experience in Machine Learning (ML), Deep Learning, Natural Language Processing (NLP), Computer Vision, and AI-driven automation. Equipped with AI-powered tools, cloud computing platforms, and data analytics software, our AI Lab helps students build real-world AI solutions for industries like healthcare, finance, robotics, cybersecurity, and automation.
                        </p>
                      </div>
                      <div>
                        <h5 className="desc_sub_header">Why Learn AI?</h5>
                        <p className="desc_para">
                          Artificial Intelligence is reshaping the world by enabling machines to think, learn, and make decisions. AI is at the core of smart assistants, autonomous vehicles, robotics, fraud detection, and predictive analytics. Learning AI opens up exciting career opportunities in tech companies, research institutions, and industries looking for AI-powered innovation.
                        </p>
                      </div>
                      <div>
                        <div className="book_a_demo text-center">
                          <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                            Book a free demo
                          </button>
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
    .images{
    display: flex;
    gap: 20px;
      /* opacity: 0; */
      transform: translateY(20px);
      /* animation: fadeIn 0.8s ease-out forwards 0.6s; */
  }
  .images img{
    /* padding-left: 10px; */
    width: 70px;
    height: 70px;
    /* height: ; */
    transition: transform 0.3s ease;
  }
  .images img:hover {
    transform: scale(1.1);
  }
  .drone-path {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
  .elementor-widget-left-side{
    display: flex;
      flex-direction: column;
      gap: 80px;
  }
  .lobs_logo{
    margin-bottom: 40px;
  }
  .labs_logo figure img{
    width: 50%;
  }
  .elementor-widget-header h2{
    font-weight: 700;
      font-size: 50px;
      margin-bottom: 25px;
  }
  .elementor-widget-header h3{
    font-weight: 500;
      font-size: 22px;
      margin-bottom: 25px;
  }
  .book_a_demo a{
    font-weight: 800;
      font-size: 16px;
      background: #FC2B5A;
      border-radius: 30px;
      padding: 15px;
      color: #fff;
  }
  .plan--demo{
    margin-top: 40px;
  }
  .elementor_widget_image figure img{
    width: 100%;
  }
  #products{
    background: rgb(239, 239, 239);
    overflow-x: hidden;
  }
  .products{
    font-size: 45px;
    font-weight: 700;
    line-height: 50px;
  }
  .pro_labs{
  font-size: 20px;
  font-weight: 500;
  }
  .ar_labs{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 25px;
    background: rgb(255, 255, 255);
    border-radius: 40px;
    padding: 20px 20px;
    height: 100%;
    transition: transform 0.4s ease, filter 0.4s ease;
  }
  .ar_labs h4{
    font-size: 16px;
    font-weight: 800;
    text-align: center;
  }
  .ar_labs figure img{
    width: 100%;
  }
  .ar_labs:hover {
    transform: scale(1.1);
    z-index: 2;
  }
  .ar_labs:hover .ar_labs:not(:hover) {
    filter: blur(5px);
    opacity: 0.6;
  }
  .row:not(:hover) .ar_labs {
    filter: none;
    opacity: 1;
  }
  .labs-desc{
    display: flex;
    width: 100%;
    padding-block: 40px;
  }
  .desc_img{
    width: 80%;
    padding: 20px;
  }
  .desc_img_content{
    width: 100%;
    padding: 20px;
  }
  .desc_header{
    font-size: 35px;
      font-weight: 800;
      color: #FC2B5A;
      padding-bottom: 20px;
  }
  .desc_sub_header{
    font-size: 20px;
    font-weight: 800;
    color: #FC2B5A;
  }
  .desc_img figure img{
    width: 100%;
    border-radius: 40px;
  }
  .desc_img_content > div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .elementory-left-inner-heading{
    font-size: 35px;
    font-weight: 400;
  }
  .elementory-left-inner-sub-heading{
    font-size: 70px;
    font-weight: 400;
  }
  .gradient-left-section{
    font-size: 30px;
    font-weight: 400;
  }
  
  
  .flex-img figure {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .flex-img img {
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  }
  
  /* Text Content Styling */
  .flex-img-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }
  
  .felx-header {
    font-size: 32px;
    font-weight: bold;
    color: #121212;
    margin-bottom: 20px;
  }
  
  /* Inner Flex Blocks */
  .inner-flex {
    background: white;
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    text-align: left;
    width: 100%;
  }
  
  /* hardware  */
  .hardware{
    background-image: url(../../../../public/Assets/public_assets/images/newpage/index/bg-stipes.jpg);
      background-color: #FFFFFF;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
  }
  
  .hardware h1 {
    text-align: center;
    font-size: 2.5rem;
    padding-block: 3rem;
  color: #FC2B5A;
  font-weight: 700;
  }
  
  .challenges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 1rem;
  }
  
  .challenge-card {
    position: relative;
    padding: 1.5rem;
    border-radius: 1rem;
    background: rgba( 255, 255, 255, 0.4 );
  box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );
  backdrop-filter: blur( 10px );
  -webkit-backdrop-filter: blur( 10px );
    /* background: linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)) padding-box,
    linear-gradient(to right, rgb(151, 71, 255), rgb(252, 43, 90)) border-box; */
    transition: transform 0.3s ease, border-color 0.3s ease;
  border: 3px solid transparent;
  border-color: rgba(255, 255, 255, 0.4);
  }
  
  .challenge-card:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  
  
  .icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .challenge-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .challenge-description {
    color: #fc2b5a;
    margin-bottom: 1rem;
  }
  
  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);
    margin: 1rem 0;
  }
  
  .solution {
    color: #101010;
    font-size: 0.875rem;
  }
  
  .cta-button {
    display: block;
    width: fit-content;
    margin: 3rem auto 0;
    padding: 1rem 2rem;
    border-radius: 2rem;
    background: linear-gradient(45deg, #8b5cf6, #ec4899);
    color: white;
    text-decoration: none;
    font-weight: bold;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
  }
  
  .elementory-left-team-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
  }
  
/* Gradient Text */
.gradient-left-section {
    color: #FC2B5A;
      transition: .4s ease-in;
  }
  
  /* Right Image Section */
  .elementory-right-team-section {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .elementory-right-team-section figure {
    margin: 0;
  }
  
  .elementory-right-team-section img {
    width: 100%;
    max-width: 350px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  }
  
.benefits-container {
    margin: 0 auto;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }
  
  .main-title {
    text-align: center;
    color: #fc2b5a;
    margin-bottom: 4rem;
    font-size: 2.5rem;
    font-weight: 800;
    /* background: linear-gradient(45deg, #2c5282, #4299e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; */
  }
  
  .benefits-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }
  
  .benefit-item {
    display: flex;
    align-items: center;
    gap: 3rem;
    position: relative;
    padding: 2rem;
    transition: transform 0.3s ease;
  }
  
  .benefit-item:hover {
    transform: translateX(10px);
  }
  
  .benefit-item.reverse {
    flex-direction: row-reverse;
  }
  
  .benefit-item.reverse:hover {
    transform: translateX(-10px);
  }
  
  .icon-wrapper {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
   background: linear-gradient(135deg, #fc2b5a 0%, #feafc1 90%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .content {
    flex: 1;
  }
  
  .content h2 {
    color: #2d3748;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .content p {
    color: #4a5568;
    /* line-height: 1.7; */
    font-size: 1.1rem;
  }
  
  .icon-container {
    position: relative;
    cursor: pointer;
  }
  #careerForm .form-control,
#careerForm .form-select {
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    background: transparent;
}

/* Style focus state */
#careerForm .form-control:focus,
#careerForm .form-select:focus {
    border-color: #FC2B5A;
    box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.1);
    outline: none;
}

/* Style checkbox specifically */
#careerForm .form-check-input {
    border: 2px solid #FC2B5A;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

#careerForm .form-check-input:checked {
    background-color: #FC2B5A;
    border-color: #FC2B5A;
}
.bg-btn-color{
  background: #FC2B5A!important;
}
/* Style file input */
#careerForm input[type="file"].form-control::file-selector-button {
    padding: 8px 16px;
    margin-right: 16px;
    background-color: #f5f5f5;
    border: none;
    border-radius: 4px;
    color: #333;
}

/* Textarea specific styling to match other inputs */
#careerForm textarea.form-control {
    min-height: 120px;
    resize: vertical;
}
#careerModal .modal-xl {
max-width: 530px;
}

#careerModal .hero-section {
/* background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://source.unsplash.com/random/1200x600/?office'); */
background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080' preserveAspectRatio='none'><defs><linearGradient id='bgGradient' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230D47A1'/><stop offset='100%' stop-color='%2364B5F6'/></linearGradient></defs><rect width='1920' height='1080' fill='url(%23bgGradient)'/><g opacity='0.2'><line x1='100' y1='200' x2='400' y2='200' stroke='%23ffffff' stroke-width='2'/><line x1='400' y1='200' x2='400' y2='500' stroke='%23ffffff' stroke-width='2'/><circle cx='100' cy='200' r='5' fill='%23ffffff'/><circle cx='400' cy='200' r='5' fill='%23ffffff'/><circle cx='400' cy='500' r='5' fill='%23ffffff'/><circle cx='1600' cy='300' r='60' fill='%23ffffff' opacity='0.1'/><circle cx='1700' cy='700' r='80' fill='%23ffffff' opacity='0.1'/></g><g opacity='0.1'><polygon points='800,100 900,300 700,300' fill='%23ffffff'/><polygon points='1200,800 1300,1000 1100,1000' fill='%23ffffff'/></g></svg>") no-repeat center center/cover;
background-size: cover;
background-position: center;
color: white;
padding: 100px 0;
}

#careerModal .benefit-card {
transition: transform 0.3s ease;
}

#careerModal .benefit-card:hover {
transform: translateY(-5px);
}

#careerModal .icon-large {
font-size: 2.5rem;
color: #FC2B5A;
}

#careerModal .required-field::after {
content: "*";
color: red;
margin-left: 4px;
}

#careerModal .career-form {
max-width: 800px;
margin: 0 auto;
padding: 1.2rem;
}

#careerModal .form-label {
font-weight: 500;
}

#careerModal .form-control:focus,
#careerModal .form-select:focus {
border-color: #FC2B5A;
box-shadow: 0 0 0 0.25rem rgba(252, 43, 90, 0.25);
}

#careerModal .btn-primary {
padding: 0.8rem 2rem;
font-weight: 500;
}

#careerModal .form-check-input:checked {
background-color: #FC2B5A;
border-color: #FC2B5A;
}

/* Success Message Styles */
.form-success-message {
display: none;
position: fixed;
top: 20px;
right: 20px;
background-color: #28a745;
color: white;
padding: 1rem 2rem;
border-radius: 4px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
z-index: 1060;
animation: slideIn 0.3s ease-out, fadeOut 0.5s ease-out 2.5s forwards;
}
.submit_btnn {
    display: inline;
    padding-block: 10px;
    border-radius: 20px;
    border: none;
    width: 50%;
    text-align: center;
    align-content: center;
    margin: auto;
    background-color: #FC2B5A;
    color: #fff;
    transition: 0.5s ease;
    border: 1px solid #FC2B5A;
}
.submit_btnn:hover {
    border: 1px solid #FC2B5A;
    background-color: transparent;
    color: #000;
    transition: 0.5s ease-out;
}
.model_btn {
    display: inline;
    padding: 10px;
    border-radius: 20px;
    border: none;
    /* width: 50%; */
    text-align: center;
    align-content: center;
    margin: auto;
    background-color: #FC2B5A;
    color: #fff;
    transition: 0.5s ease;
    border: 1px solid #FC2B5A;
}
.plan--demo {
    margin-top: 40px;
}


/* form section in lab page  */
.form_name {
    display: flex
;
    width: 100%;
    gap: 30px;
}
.first_name, .email {
    width: 100%;
    display: flex
;
    flex-direction: column;
    position: relative;
}
.demoForm input[type="text"], .demoForm input[type="password"], .demoForm input[type="email"], .demoForm textarea {
    background: transparent;
    border: 1px solid black;
    padding: 18px 8px;
    border-radius: 10px;
    outline: none;
    width: 100%;
    position: relative;
}
input[type="text"], input[type="password"], input[type="email"], textarea {
    margin-bottom: 20px;    
}
.textarea-container textarea{
    margin-bottom: 20px;
}

@keyframes slideIn {
from {
transform: translateX(100%);
opacity: 0;
}
to {
transform: translateX(0);
opacity: 1;
}
}

@keyframes fadeOut {
from {
opacity: 1;
}
to {
opacity: 0;
}
}

/* Print Styles */
@media print {
#careerModal .modal-dialog {
max-width: 100%;
margin: 0;
}

#careerModal .btn-close,
#careerModal .modal-footer {
display: none;
}
}

@media (max-width: 768px) {
  .images {
    gap: 3px;
  }
    .ar_labs figure{
      display: flex;
      align-items: center;
      text-align: center;
      justify-content: center;
    }
    .ar_labs figure img{
      width: 55%;
    }
    a.mobile-tech-area.slick-slide{
      margin: 10px;
    }
    .new {
    font-size: 25px;
    }
    .font-size{
      font-size: 25px!important;
    }
    .hardware h1{
      font-size: 1.2rem;
    }
    #earning-option .container {
      flex-direction: column;
      text-align: center;
  }
  
  .flex-img img {
      max-width: 80%;
  }
  
  .flex-img-content {
      padding: 10px;
  }
    .benefit-item, 
    .benefit-item.reverse {
      flex-direction: column;
      text-align: center;
      gap: 1.5rem;
    }
  
    .benefits-container {
      padding: 2rem 1rem;
    }
  
    .main-title {
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    .labs-desc{
      flex-direction: column;
      padding: 0px;
    }
    .desc_img{
      width: 100%;
    }
    .desc_header{
      font-size: 22px;
    }
    .benefits-wrapper{
      gap: 0px;
    }
    .icon-wrapper {
      margin: 0 auto;
    }
  
    .benefit-item:hover,
    .benefit-item.reverse:hover {
      transform: translateY(-5px);
    }
    .section-padding-120 .container {
      flex-direction: column;
      text-align: center;
  }
  
  .elementory-left-team-section {
      padding: 10px;
  }
  
  .elementory-left-inner-sub-heading {
      /* font-size: 32px; */
      font-size:50px;
      padding-bottom: 20px;
  }
  
  .elementory-right-team-section img {
      max-width: 80%;
  }
  
    .leftSidebar {
      display: none;
    }
  
    .user__name {
      word-spacing: 1.1px;
    }
  
    .mainContent {
      height: 100vh;
      overflow-y: auto;
    }
  
    .card-header {
      padding: 5px 20px;
    }
  
    .card-content {
      padding: 0px 20px;
    }
  
    .blog--card {
      max-height: calc(100vh - 20px);
      overflow-y: auto;
    }
  
    .card-content {
      max-height: calc(100vh - 150px);
      overflow-y: auto;
    }
  
    #blog--images .happy_candidate_images img,
    .blog--images .happy_candidate_images img,
    .video_height {
      /* max-height: 200px;  */
      max-height: 154px;
      object-fit: contain;
    }
  
    .hidden-text {
      font-size: 16px;
      line-height: 1.4em;
      -webkit-line-clamp: 3;
      max-height: calc(3 * 1.4em);
    }
  
    .toggle-more {
      font-size: 12px;
    }
  
    #blog--images .slick-dots,
    .blog--images .slick-dots {
      bottom: -25px;
    }
    #careerModal .hero-section {
      padding: 60px 0;
      }
      
      #careerModal .career-form {
      padding: 1rem;
      }
  
  }
    .modal-header {
      background-color: #FC2B5A;
      border-bottom: none;
    }
  .modal-title {
    font-weight: 600;
}
    .select-container label {
  position: absolute;
  left: 15px;
  top: 10px; /* Initial position of the label */
  font-size: 14px;
  color: #000;
  background-color: transparent; /* Optional for better readability */
  padding: 0 5px;
  transition: transform 0.3s ease, font-size 0.3s ease, color 0.3s ease;
  pointer-events: none; /* Prevent label from blocking interaction */
}
    `
  }
</style>
      </FrontLayout>

    </>
  )
}

export default Labs
