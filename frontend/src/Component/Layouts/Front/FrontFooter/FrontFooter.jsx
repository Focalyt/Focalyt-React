import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Link } from 'react-router-dom';
import { faFacebookF, faLinkedinIn, faYoutube ,faInstagram} from '@fortawesome/free-brands-svg-icons';
import "./FrontFooter.css";
import axios from 'axios'
function Footer() {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    email: "",
    location: "",
    position: "",
    experience: "",
    cv: null, // CV as a file
    info: "",
    termsAccepted: false,
  });

  // ✅ Fix: Properly update input fields when user types
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Fix: Handle form submission properly
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.cv) {
      alert("Please upload your CV before submitting the form.");
      return;
    }
  
    if (!formData.termsAccepted) {
      alert("Please agree to the terms and conditions.");
      return;
    }
  
    try {
      const submissionData = new FormData();
      submissionData.append("name", formData.name);
      submissionData.append("email", formData.email);
      submissionData.append("number", formData.number);
      submissionData.append("location", formData.location);
      submissionData.append("position", formData.position);
      submissionData.append("experience", formData.experience);
      submissionData.append("cv", formData.cv); // File
      submissionData.append("info", formData.info);
      submissionData.append("termsAccepted", formData.termsAccepted);
  
      // const response = await axios.post("/career", submissionData, {
        const response = await axios.post(`${backendUrl}/career`, submissionData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("response from carrer" , response)
  
        alert("Application submitted successfully!");
        window.location.reload(); 
    } catch (error) {
      console.error("Career form error:", error);
      alert("Something went wrong while submitting.");
    }
  };
  return (
    <>
      <section>
        <div id="mobile-footer-nav"
          className="d-xxl-none d-xl-none d-lg-none d-md-none d-sm-block d-block mt-xxl-0 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-4">
          <div className="container">
            <div className="footer-nav position-relative">
              <ul className="h-100 d-flex align-items-center justify-content-between mb-0">
                {/* <!----> */}
                <li>
                  <a href="/">
                    <figure>
                      <img src="/Assets/public_assets/images/icons/home.png" draggable="false"
                        className="img-fluid footer-skill-course m-0" />
                    </figure>
                    <span className="text-white pt-1">Home</span>
                  </a>
                </li>
                {/* <!----> */}
                {/* <!----> */}
                <li>
                  <a href="/courses">
                    <figure>
                      <img src="/Assets/public_assets/images/icons/learn.png" draggable="false"
                        className="footer-skill-course img-fluid m-0" />
                    </figure>
                    <span className="text-white pt-1">Courses</span>
                  </a>
                </li>
                {/* <!----> */}
                <li className="login_col">
                  <a href="/candidate/login">
                    <span className="text-white login_ty bg-transparent" style={{ backgroundColor: "transparent;" }}>Login</span>
                  </a>
                </li>
                <li>
                  <a href="/joblisting">
                    <figure>
                      <img src="/Assets/public_assets/images/icons/jobs.png" draggable="false"
                        className="footer-skill-course img-fluid m-0" /></figure>
                    <span className="text-white pt-1">Jobs</span>
                  </a>
                </li>
                <li>
                  <a href="https://api.whatsapp.com/send?text=Check%20out%20Focalyt's%20courses%20and%20job%20opportunities%20at%20https://focalyt.com.%20Enhance%20your%20skills%20and%20secure%20a%20great%20job%20now">
                    <figure>
                      <img src="/Assets/public_assets/images/icons/share.png" draggable="false"
                        className="footer-skill-course img-fluid m-0" /></figure>
                    <span className="text-white pt-1">Share</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-v2 footer-padding-default footer-l02">
          <div className="container">
            <div className="row row--footer-main">
              <div className="col-xl-auto col-lg-auto col-md-6">
                <div className="footer-v2__content-block">
                  <div className="footer-v2__content-text">
                    <div className="footer-brand">
                      <img src="/Assets/public_assets/images/newpage/logo-ft.svg" alt="image alt" />
                    </div>
                    {/* <!-- <p>
                Focal Skill Development Pvt. Ltd.
                SCF 3,4, 2nd floor, Shiva Complex, Patiala Zirakpur Road, opposite Hyundai Showroom, Zirakpur, Punjab
                140603
              </p> --> */}
                  </div>
                  <ul className="list-social list-social--hvr-black">
                    <li>
                      <a href="https://www.facebook.com/focalyt.learn/" target="_blank">
                       
                        <FontAwesomeIcon icon={faFacebookF} size="2x" />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.instagram.com/p/CX3iTqQFHQF/" target="_blank">
                     
                        <FontAwesomeIcon icon={faInstagram} size="2x" />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.linkedin.com/company/focalytlearn?originalSubdomain=in" target="_blank">
                      
                        <FontAwesomeIcon icon={faLinkedinIn} size="2x" />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.youtube.com/@focalyt" target="_blank">
                
                        <FontAwesomeIcon icon={faYoutube} size="2x" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-auto col-lg-auto col-md-6 col-auto">
                <h4 className="color-pink fw-bold pb-xxl-4 pb-xp-4 pb-lg-3 pb-md-2 sm-1 pb-1">About Us</h4>
                <ul className="footer-list p-0">
                  <li>
                  <Link to="/about#focalytTeam">Our Team</Link>
                  </li>
                  <li>
                  <Link to="/about#vision">Mission</Link>
                  </li>
                  <li>
                  <Link to="/about#vision">Vision</Link>
                  </li>
                  {/* <!-- <li>
              <a href="#">Blog &amp; Articles</a>
            </li> --> */}
                  <li>
                    <a href="/community">community</a>
                  </li>
                </ul>
              </div>
              <div className="col-xl-auto col-lg-auto col-md-6 col-auto">
                <h4 className="color-pink fw-bold pb-xxl-4 pb-xp-4 pb-lg-3 pb-md-2 sm-1 pb-1">Useful Links</h4>
                <ul className="footer-list p-0">
                  <li>
                    <a href="#" data-bs-toggle="modal" data-bs-target="#careerModal">Career</a>
                  </li>
                  <li>
                    <a href="https://result.focalyt.com/">Results</a>
                  </li>
                  <li>
                    <a href="/contact">Partner With Us</a>
                  </li>
                  {/* <!-- <li>
              <a href="#">How to Register?</a>
            </li> --> */}
                  <li>
                    <a href="/contact">Contact Us</a>
                  </li>
                </ul>
                <div className="modal fade" id="careerModal" tabindex="-1" aria-labelledby="careerModalLabel" aria-hidden="true">
                  <div className="modal-dialog modal-xl modal-dialog-scrollable">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title" id="careerModalLabel">Career Opportunities</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body p-0">

                        {/* <section id="current-openings"  className="py-4">
                          <form className="career-form" id="careerForm">
                              <div className="row g-4">
                                  <div className="col-12">
                                      <h4 className="mb-4">Personal Information</h4>
                                  </div>
  
                                  <div className="col-md-6">
                                      <label for="fullName" className="form-label required-field">Full Name</label>
                                      <input type="text" className="form-control" value={formData.name} id="fullName" required/>
                                  </div>
  
                                  <div className="col-md-6">
                                      <label for="email" className="form-label required-field">Email Address</label>
                                      <input type="email" className="form-control" value={formData.email} id="email" required/>
                                  </div>
  
                                  <div className="col-md-6">
                                      <label for="phone" className="form-label required-field">Phone Number</label>
                                      <input type="tel" className="form-control" value={formData.number} id="phone" required/>
                                  </div>
  
                                  <div className="col-md-6">
                                      <label for="location" className="form-label required-field">Current Location</label>
                                      <input type="text" className="form-control" value={formData.location} id="location" required/>
                                  </div>
  
                                  <div className="col-12">
                                      <label for="position" className="form-label required-field">Position Applied For</label>
                                      <select className="form-select" id="position" value={formData.position} required>
                                          <option value="">Select Position</option>
                                          <option value="software-engineer">Software Engineer</option>
                                          <option value="product-designer">Product Designer</option>
                                          <option value="marketing-specialist">Marketing Specialist</option>
                                          <option value="other">Other</option>
                                      </select>
                                  </div>
  
                                  <div className="col-12">
                                      <label for="experience" className="form-label required-field">Years of Experience</label>
                                      <select className="form-select" id="experience" value={formData.experience} required>
                                          <option value="">Select Experience</option>
                                          <option value="fresher">Fresher</option>
                                          <option value="1-3">1-3 years</option>
                                          <option value="3-5">3-5 years</option>
                                          <option value="5+">5+ years</option>
                                      </select>
                                  </div>
  
                                  <div className="col-12">
                                      <label for="cv" className="form-label required-field">Upload CV</label>
                                      <input type="file" value={formData.cv} className="form-control" id="cv" accept=".pdf,.doc,.docx" required/>
                                      <div className="form-text">Accepted formats: PDF, DOC, DOCX (Max size: 5MB)</div>
                                  </div>
  
                                  <div className="col-12">
                                      <label for="message" className="form-label">Additional Information</label>
                                      <textarea className="form-control" value={formData.info} id="message" rows="4" placeholder="Tell us about yourself and why you'd be a great fit for this position"></textarea>
                                  </div>
  
                                  <div className="col-12">
                                      <div className="form-check">
                                          <input className="form-check-input" type="checkbox" id="terms" required/>
                                          <label className="form-check-label" for="terms">
                                              I agree to the processing of my personal data according to the privacy policy
                                          </label>
                                      </div>
                                  </div>
  
                                  <div className="col-12">
                                      <a type="submit" className="new_link text-center">Submit Application</a>
                                  </div>
                              </div>
                          </form>
                      </section> */}

                        <section id="current-openings" className="">
                          <form method='post' className="career-form" id="careerForm" onSubmit={handleSubmit}>
                            <div className="row g-4">
                              <div className="col-12">
                                <h4 className="mb-4">Personal Information</h4>
                              </div>


                              <div className="col-md-6">
                                <label htmlFor="name" className="form-label required-field">Full Name</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  required
                                />
                              </div>


                              <div className="col-md-6">
                                <label htmlFor="email" className="form-label required-field">Email Address</label>
                                <input
                                  type="email"
                                  className="form-control"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  required
                                />
                              </div>


                              <div className="col-md-6">
                                <label htmlFor="number" className="form-label required-field">Phone Number</label>
                                <input
                                  type="tel"
                                  className="form-control"
                                  name="number"
                                  value={formData.number}
                                  onChange={handleChange}
                                  required
                                />
                              </div>


                              <div className="col-md-6">
                                <label htmlFor="location" className="form-label required-field">Current Location</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="location"
                                  value={formData.location}
                                  onChange={handleChange}
                                  required
                                />
                              </div>


                              <div className="col-12">
                                <label htmlFor="position" className="form-label required-field">Position Applied For</label>
                                <input type="text" className="form-control" name="position" value={formData.position} onChange={handleChange} required/>
                                {/* <select className="form-select" name="position" value={formData.position} onChange={handleChange} required>
                                  <option value="">Select Position</option>
                                  <option value="software-engineer">Software Engineer</option>
                                  <option value="product-designer">Product Designer</option>
                                  <option value="marketing-specialist">Marketing Specialist</option>
                                  <option value="other">Other</option>
                                </select> */}
                              </div>


                              <div className="col-12">
                                <label htmlFor="experience" className="form-label required-field">Years of Experience</label>
                                <select className="form-select" name="experience" value={formData.experience} onChange={handleChange} required>
                                  <option value="">Select Experience</option>
                                  <option value="fresher">Fresher</option>
                                  <option value="1-3">1-3 years</option>
                                  <option value="3-5">3-5 years</option>
                                  <option value="5+">5+ years</option>
                                </select>
                              </div>


                              <div className="col-12">
                                <label htmlFor="cv" className="form-label required-field">Upload CV</label>
                                <input
                                  type="file"
                                  className="form-control"
                                  name="cv"
                                  onChange={handleChange}
                                  accept=".pdf,.doc,.docx"
                                  required
                                />
                                <div className="form-text">Accepted formats: PDF, DOC, DOCX (Max size: 5MB)</div>
                                {formData.cv && <p>Selected File: {formData.cv.name}</p>}
                              </div>


                              <div className="col-12">
                                <label htmlFor="info" className="form-label">Additional Information</label>
                                <textarea
                                  className="form-control"
                                  name="info"
                                  value={formData.info}
                                  onChange={handleChange}
                                  rows="4"
                                  placeholder="Tell us about yourself and why you'd be a great fit for this position"
                                ></textarea>
                              </div>

                              <div className="col-12">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="termsAccepted"
                                    checked={formData.termsAccepted}
                                    onChange={handleChange}
                                    required
                                  />
                                  <label className="form-check-label" htmlFor="terms">
                                    I agree to the processing of my personal data according to the privacy policy
                                  </label>
                                </div>
                              </div>


                              <div className="col-12">
                                <button type="submit" className="new_link text-center">Submit Application</button>
                              </div>
                            </div>
                          </form>
                        </section>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
               {/* <div className="col-xl-auto col-lg-auto col-md-6 col-auto">
          <h4 className="color-pink fw-bold pb-xxl-4 pb-xp-4 pb-lg-3 pb-md-2 sm-1 pb-1">Download Now</h4>
          <div className="footer-store-buttons">
            <a href="#">
              <img src="/Assets/public_assets/images/newpage/common/app-store.png" alt="image alt"/>
            </a>
            <a href="#">
              <img src="/Assets/public_assets/images/newpage/common/play-store.png" alt="image alt"/>
            </a>
          </div>
        </div>  */}
              <div className="copyright-block">
                <div className="container">
                  <div className="copyright-inner text-center  copyright-border">
                    <p>© Copyright 2025, All Rights Reserved by </p>
                    <h4 className="color-pink fw-bold PT-2">FOCALYT</h4>
                    <p></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Footer
