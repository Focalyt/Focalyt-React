import React, { useState } from 'react'
import "./Labs.css";
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
                              <h5 className="modal-title" id="staticBackdropLabel">Book your Free Demo Today!</h5>
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
                                              <select
                                                name="designation"
                                                className="form_designation_input"
                                                id="designation"
                                                required
                                                value={formData.designation}
                                                onChange={handleInputChange}
                                              >
                                                <option value="" disabled>Select your designation</option>
                                                <option value="manager">Manager</option>
                                                <option value="developer">Developer</option>
                                                <option value="designer">Designer</option>
                                                <option value="tester">Tester</option>
                                              </select>
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

            <a href="#contact" className="cta-button">Get Started Today</a>
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
                          <select name="designation" className="form_designation_input" id="designation" required value={formData.designation}
                            onChange={handleInputChange}>
                            <option value="" disabled selected>Select your designation</option>
                            <option value="manager">Manager</option>
                            <option value="developer">Developer</option>
                            <option value="designer">Designer</option>
                            <option value="tester">Tester</option>
                          </select>
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
                  <div className="col-md-12 text-center">
                    {/* <!-- <div className="book_a_demo ">
              <a href="#" id="book_a_demo" className="a_btn text-uppercase">
                View Full Menu
              </a>
            </div> --> */}
                    <div>
                      <div className="book_a_demo">
                        <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                          Book a free demo
                        </button>
                        {/* <!-- Modal --> */}
                        <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                                                <input name="name" type="text" className="form_input" placeholder id="fullName" required />
                                                <label className="label">Full
                                                  Name
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="email">
                                                <input name="email" type="text" className="form_input" placeholder id="email" required />
                                                <label className="label">Email
                                                  <span className="imp">*</span></label>
                                              </div>
                                            </div>
                                            <div className="form_name">
                                              <div className="phone">
                                                <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')" />
                                                <label className="label">Phone
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="Organisation">
                                                <input name="organisation" className="form_input" required placeholder type="text" id="organisation" />
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

                                            {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                                  placeholder="Message us" rows="2" ></textarea> --> */}
                                            <div className="textarea-container">
                                              <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                              <label for="exampleTextarea">Your
                                                Message</label>
                                            </div>

                                            <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                              Demo</button>
                                          </div>

                                          <div className="alertLoginSuccess alert-success alert-dismissible error_login text-danger" role="alert">
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
                      </div>
                    </div>
                  </div>
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

                    <div>
                      <div className="book_a_demo">
                        <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                          Book a free demo
                        </button>
                        {/* <!-- Modal --> */}
                        <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                          <div className="modal-dialog new-model-dialog">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title" id="staticBackdropLabel">Book your FREE Demo Today!</h5>
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
                                                <input name="name" type="text" className="form_input" placeholder id="fullName" required />
                                                <label className="label">Full
                                                  Name
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="email">
                                                <input name="email" type="text" className="form_input" placeholder id="email" required />
                                                <label className="label">Email
                                                  <span className="imp">*</span></label>
                                              </div>
                                            </div>
                                            <div className="form_name">
                                              <div className="phone">
                                                <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')" />
                                                <label className="label">Phone
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="Organisation">
                                                <input name="organisation" className="form_input" required placeholder type="text" id="organisation" />
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

                                            {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                              placeholder="Message us" rows="2" ></textarea> --> */}
                                            <div className="textarea-container">
                                              <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                              <label for="exampleTextarea">Your
                                                Message</label>
                                            </div>

                                            <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                              Demo</button>
                                          </div>
                                          <div className="alertLoginSuccess alert-success alert-dismissible error_login text-danger" role="alert">

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
                      </div>
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

                    <div>
                      <div className="book_a_demo">
                        <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                          Book a free demo
                        </button>
                        {/* <!-- Modal --> */}
                        <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                                                <input name="name" type="text" className="form_input" placeholder id="fullName" required />
                                                <label className="label">Full
                                                  Name
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="email">
                                                <input name="email" type="text" className="form_input" placeholder id="email" required />
                                                <label className="label">Email
                                                  <span className="imp">*</span></label>
                                              </div>
                                            </div>
                                            <div className="form_name">
                                              <div className="phone">
                                                <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')" />
                                                <label className="label">Phone
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="Organisation">
                                                <input name="organisation" className="form_input" required placeholder type="text" id="organisation" />
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

                                            {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                                  placeholder="Message us" rows="2" ></textarea> --> */}
                                            <div className="textarea-container">
                                              <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                              <label for="exampleTextarea">Your
                                                Message</label>
                                            </div>

                                            <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                              Demo</button>
                                          </div>

                                          <div className="alertLoginSuccess alert-success alert-dismissible error_login text-danger" role="alert">

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
                      </div>
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
                      <div className="book_a_demo">
                        <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                          Book a free demo
                        </button>
                        {/* <!-- Modal --> */}
                        <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                                                <input name="name" type="text" className="form_input" placeholder id="fullName" required />
                                                <label className="label">Full
                                                  Name
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="email">
                                                <input name="email" type="text" className="form_input" placeholder id="email" required />
                                                <label className="label">Email
                                                  <span className="imp">*</span></label>
                                              </div>
                                            </div>
                                            <div className="form_name">
                                              <div className="phone">
                                                <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')" />
                                                <label className="label">Phone
                                                  <span className="imp">*</span></label>
                                              </div>
                                              <div className="Organisation">
                                                <input name="organisation" className="form_input" required placeholder type="text" id="organisation" />
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

                                            {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                                  placeholder="Message us" rows="2" ></textarea> --> */}
                                            <div className="textarea-container">
                                              <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                              <label for="exampleTextarea">Your
                                                Message</label>
                                            </div>

                                            <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                              Demo</button>
                                          </div>

                                          <div className="alertLoginSuccess alert-success alert-dismissible error_login text-danger" role="alert">

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
                        <div className="book_a_demo">
                          <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                            Book a free demo
                          </button>
                          {/* <!-- Modal --> */}
                          <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                                                  <input name="name" type="text" className="form_input" placeholder id="fullName" required />
                                                  <label className="label">Full
                                                    Name
                                                    <span className="imp">*</span></label>
                                                </div>
                                                <div className="email">
                                                  <input name="email" type="text" className="form_input" placeholder id="email" required />
                                                  <label className="label">Email
                                                    <span className="imp">*</span></label>
                                                </div>
                                              </div>
                                              <div className="form_name">
                                                <div className="phone">
                                                  <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')" />
                                                  <label className="label">Phone
                                                    <span className="imp">*</span></label>
                                                </div>
                                                <div className="Organisation">
                                                  <input name="organisation" className="form_input" required placeholder type="text" id="organisation" />
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

                                              {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                                  placeholder="Message us" rows="2" ></textarea> --> */}
                                              <div className="textarea-container">
                                                <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                                <label for="exampleTextarea">Your
                                                  Message</label>
                                              </div>

                                              <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                                Demo</button>
                                            </div>

                                            <div className="alertLoginSuccess alert-success alert-dismissible error_login text-danger" role="alert">

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
                        <div className="book_a_demo">
                          <button type="button" className="a_btn text-uppercase model_btn plan--demo" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                            Book a free demo
                          </button>
                          {/* <!-- Modal --> */}
                          <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                                                  <input name="name" type="text" className="form_input" placeholder id="fullName" required />
                                                  <label className="label">Full
                                                    Name
                                                    <span className="imp">*</span></label>
                                                </div>
                                                <div className="email">
                                                  <input name="email" type="text" className="form_input" placeholder id="email" required />
                                                  <label className="label">Email
                                                    <span className="imp">*</span></label>
                                                </div>
                                              </div>
                                              <div className="form_name">
                                                <div className="phone">
                                                  <input name="mobile" className="form_input" type="text" placeholder id="phone" required maxlength="10" pattern="^\d{10}$" oninput="this.value = this.value.slice(0, 10).replace(/[^0-9]/g, '')" />
                                                  <label className="label">Phone
                                                    <span className="imp">*</span></label>
                                                </div>
                                                <div className="Organisation">
                                                  <input name="organisation" className="form_input" required placeholder type="text" id="organisation" />
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

                                              {/* <!-- <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                                  placeholder="Message us" rows="2" ></textarea> --> */}
                                              <div className="textarea-container">
                                                <textarea id="message" name="message" placeholder=" " rows="2" required></textarea>
                                                <label for="exampleTextarea">Your
                                                  Message</label>
                                              </div>

                                              <button type="submit" className="submit_btn g-recaptcha" data-callback='onSubmit' data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v">Book
                                                Demo</button>
                                            </div>
                                            <div className="alertLoginSuccess alert-success alert-dismissible error_login text-danger" role="alert">

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

    </>
  )
}

export default Labs
