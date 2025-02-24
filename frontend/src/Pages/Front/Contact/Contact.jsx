import React from 'react'
import "./Contact.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faYoutube, faLinkedin } from '@fortawesome/free-brands-svg-icons';
function Contact() {
  return (
    <>
      
      <script src="https://www.google.com/recaptcha/api.js"></script>
    <section className="section-padding-120 mt-5 bg-white">

        <div className="container">
          <div className="row">
            <div className="col-xl-6 ">
              <h2 className="mt-5 font-weight-bold">Get in touch with Us</h2>
              <h4 className="mt-5">Our Location</h4>
              <p className="mt-4 mb-0 contact-detail"> <FontAwesomeIcon icon={faHome} className="pe-2 pt-2 distance-color" style={{ fontSize: '23px' }} />SCF 3,4, 2nd floor, Shiva Complex, Patiala Rd, <br/>opposite Hyundai Showroom, Swastik Vihar, Utrathiya,<br/> Zirakpur, Punjab 140603</p>
              <p className="mt-2 mb-0 contact-detail contact"> <a href="tel:+8699011108"> <FontAwesomeIcon icon={faPhone} className="pe-2 pt-2 distance-color" style={{ fontSize: '23px' }} />8699011108</a></p>
              <p className="mt-2 mb-0 contact-detail"> <a href="mailto: info@focalyt.in"></a>      <FontAwesomeIcon icon={faEnvelope} className="pe-2 pt-2 distance-color" style={{ fontSize: '23px' }} />info@focalyt.com</p>
    
              <div className="contact-icon mt-4 mb-xxl-0 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0 mb-4">
                <h4 className="mb-3">Follow us on</h4>
                <a href="https://www.facebook.com/focalyt.learn/" target="_blank" title=""><FontAwesomeIcon icon={faFacebook} className="mt-3 distance-color ps-4" style={{ color: "#666762", fontSize: "33px" }} /></a>
                <a href="https://www.instagram.com/p/CX3iTqQFHQF/" target="_blank" title=""> <FontAwesomeIcon icon={faInstagram} className="mt-3 distance-color ps-4" style={{ color: "#666762", fontSize: "33px" }} /></a>
                <a href="https://www.youtube.com/@focalyt" target="_blank" title=""> <FontAwesomeIcon icon={faYoutube} className="mt-3 distance-color ps-4" style={{ color: "#666762", fontSize: "33px" }} /></a>
                <a href="https://www.linkedin.com/company/focalytlearn?originalSubdomain=in/" target="_blank" title=""> <FontAwesomeIcon icon={faLinkedin} className="mt-3 distance-color ps-4" style={{ color: "#666762", fontSize: "33px" }} /></a>
    
              </div>
    
            </div>
            <div className="col-xl-6 mt-xl-5 mt-lg-2 mt-md-2 mt-sm-0 mt-0">
              <form method="post" id="contactform">
              <div className="contact-form">
                <div className="form-group form-primary">
                  <input type="text" name="name"  color="#FC2B5A" className="form-contro  mt-xl-5 mt-lg-2 mt-md-2 mt-sm-0 mt-0"
                    placeholder="Name" id="Name"/>
                  <input type="text"  name="mobile" color="#FC2B5A" className="form-contro" placeholder="Phone no" id="Phone no"/>
                  <input type="email" name="email" color="#FC2B5A" className="form-contro" placeholder="Enter email" id="email"/>
                  <textarea className="form-contro mb-3 message-to pe-1" name="message" id="exampleFormControlTextarea1"
                    placeholder="Message us" rows="5" ></textarea>
                </div>  
              </div>
              <div className="submit-button text-end justify-content-center">
                <button type="submit" className="g-recaptcha btn distance-btn my-4 text-end px-5 font-weight-bold text-white" 
                data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v" 
                data-callback='onSubmit'>SUBMIT</button>
              </div>
            </form>
            </div>
          </div>
        </div>
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1757443.9613018557!2d76.809794!3d30.647828!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390feb1926579155%3A0x6704ed8197f6f017!2sFocal%20Skill%20Development%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1682307065688!5m2!1sen!2sin"
            width="100%" height="300" style={{border:"0;"}} allowfullscreen="" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
        </iframe>    
      </section>

    </>
  )
}

export default Contact
