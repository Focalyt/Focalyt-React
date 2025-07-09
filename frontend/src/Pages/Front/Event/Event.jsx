import React, { useState, useEffect, useRef } from 'react';

import moment from 'moment';
import axios from 'axios';
import ReCAPTCHA from "react-google-recaptcha";
import FrontLayout from '../../../Component/Layouts/Front';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import styles from './Event.module.css';

function Event() {
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    mobile: "",
    email: "",
    message: "",
  });
  const [captchaValue, setCaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recaptchaRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const statesList = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep",
    "Puducherry", "Ladakh", "Jammu and Kashmir"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/event`);
        console.log("events", response.data.events)

        response.data.events.forEach(event => {
          const fromDate = moment(event.timing.from).format('DD-MM-YYYY');
          const fromTime = moment(event.timing.from).format('hh:mm A');
          const toDate = moment(event.timing.to).format('DD-MM-YYYY');
          const toTime = moment(event.timing.to).format('hh:mm A');
        });
        setEvents(response.data.events);

      } catch (error) {
        console.error("Error fetching events data:", error);
      }
    };
    fetchData();
  }, []);


  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => {
        setVideoSrc(""); // ✅ Resets video when modal is fully closed
      });
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);

  // Function to check if registration is closed
  const checkRegistrationStatus = (eventDate) => {
    const today = moment();
    const eventEndDate = moment(eventDate);
    return eventEndDate.isBefore(today);
  };

  return (
    <>

      <FrontLayout>
        <section className="bg_pattern py-xl-5 py-lg-5 py-md-5 py-sm-2 py-2 d-none">
          {/* Background pattern section - hidden by default (d-none) */}
          <div className="container">
            {/* Category icons section */}
            <div className="row">
              <div className="col-xxl-8 col-xl-8 col-md-8 col-sm-8 col-11 mx-auto">
                <div className="row justify-content-around" id="features_cta">
                  <ul className="d-flex justify-content-between overflow-x-auto">
                    <li className="cta_cols cta_cols_list">
                      <figure className="figure">
                        <img className="Sirv image-main" src="/Assets/public_assets/images/newjobicons/agriculture.png" alt="Agriculture" />
                        <img className="Sirv image-hover" src="/Assets/public_assets/images/newjobicons/agriculture_v.png" alt="Agriculture hover" />
                      </figure>
                      <h4 className="head">Agriculture</h4>
                    </li>
                    {/* More category items */}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* events Section */}
        <section className="styles.jobs section-padding-60">
          <div className="container">
            <div className="row">
              <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
                <div className="row my-xl-5 my-lg-5 my-md-3 my-sm-3 my-5 eventMobile">
                  <h1 className="text-center text-uppercase jobs-heading pb-4">Events</h1>

                  {/* event Cards */}
                  <div className="row">
                    {events.length > 0 ? (
                      events.map((event) => {
                        const isRegistrationClosed = checkRegistrationStatus(event.timing.to);
                        
                        return (
                          <div key={event._id} className="col-lg-4 col-md-6 col-sm-12 col-12 pb-4 card-padd">
                            <div className="card bg-dark eventCard">
                              <div className="bg-img">
                                <a
                                  href="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#videoModal"
                                  onClick={(e) => {
                                    e.preventDefault(); // ✅ Prevents default link behavior
                                    setVideoSrc(event.video);
                                  }}
                                  className="pointer img-fluid" 
                                >
                                  <img
                                    src={event.thumbnail}
                                    className="digi"
                                    alt={event.name}
                                  />
                                  <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="Play" className="group1" />
                                </a>

                                <div className="flag">
                                  {/* <h4
                                    className="text-center text-black fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                    title={event.eventTitle}
                                  >
                                    {event.eventType}
                                  </h4> */}
                                </div>
                                <div className="share-Event">
                                  <div className="tooltip-container">
                                    <div className="button-content">
                                      <span className="text">Share</span>
                                      <svg
                                        className="share-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="20"
                                        height="20"
                                      >
                                        <path
                                          d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="tooltip-content">
                                      <div className="social-icons">
                                        <a href="#" className="social-icon twitter">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                                            ></path>
                                          </svg>
                                        </a>
                                        <a href="#" className="social-icon facebook">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                            ></path>
                                          </svg>
                                        </a>
                                        <a href="#" className="social-icon linkedin">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                            ></path>
                                          </svg>
                                        </a>
                                        <a href="" className="social-icon linkedin">
                                          <svg
                                            className="share-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 32 32"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16.003c0 2.693.704 5.273 2.032 7.567L2 30l6.611-2.673A13.27 13.27 0 0016.003 29.34C23.367 29.34 29.34 23.366 29.34 16.003 29.34 8.64 23.367 2.667 16.003 2.667zm0 24.027a11.58 11.58 0 01-5.893-1.609l-.423-.25-3.929 1.589.75-4.087-.27-.42a11.412 11.412 0 01-1.714-6.047c0-6.37 5.184-11.553 11.554-11.553 6.37 0 11.553 5.183 11.553 11.553 0 6.37-5.183 11.553-11.553 11.553zm6.308-8.518c-.348-.174-2.067-1.02-2.388-1.137-.32-.118-.553-.174-.785.174-.232.348-.898 1.137-1.103 1.372-.205.232-.38.26-.728.087-.347-.174-1.465-.54-2.79-1.72-1.03-.919-1.726-2.054-1.929-2.4-.2-.348-.022-.535.152-.71.156-.156.348-.406.522-.61.174-.2.232-.348.348-.58.116-.232.058-.435-.029-.609-.087-.174-.785-1.9-1.077-2.607-.285-.686-.576-.593-.785-.603l-.668-.012a1.297 1.297 0 00-.938.435c-.32.348-1.218 1.19-1.218 2.899 0 1.709 1.247 3.36 1.42 3.593.174.232 2.457 3.746 5.956 5.25.833.359 1.482.574 1.987.733.835.266 1.596.228 2.196.139.67-.1 2.067-.844 2.359-1.66.292-.814.292-1.51.204-1.66-.087-.145-.32-.232-.668-.406z"
                                              fill="#25D366"
                                            />
                                          </svg>

                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </div>

                              <div className="card-body px-0 pb-0">
                                <h4
                                  className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                  title={event.eventTitle}
                                >
                                  {event.name}
                                </h4>

                                <div className="row" id="event_height">
                                  <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto mb-2">
                                      <div className="row">
                                        <h4
                                          className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                          title={event.eventTitle}
                                        >
                                          {event.eventTitle}
                                        </h4>
                                        <h5 className={`op-Reg text-center ${isRegistrationClosed ? 'text-danger' : ''}`}>
                                          {isRegistrationClosed ? "Registration Closed" : "Registration Open"}
                                        </h5>
                                        <h6
                                          className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                          title={event.eventTitle}
                                        >
                                          Event Date:   {moment(event.timing.from).format("DD-MM-YYYY")} &nbsp;
                                          To: {moment(event.timing.to).format("DD-MM-YYYY")}
                                        </h6>

                                        <h6
                                          className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                          title={event.eventTitle}
                                        >
                                          Event Time  {moment(event.timing.from).format("hh:mm A")} &nbsp; To: {moment(event.timing.to).format("hh:mm A")}
                                        </h6>

                                        {/* Location */}
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                          <div className="row">
                                            <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                              <figure className="text-end">
                                                <img
                                                  src="/Assets/public_assets/images/icons/location-pin.png"
                                                  className="img-fluid new_img p-0"
                                                  draggable="false"
                                                />
                                              </figure>
                                            </div>
                                            <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white events_features ps-0">
                                              <p className="mb-0 text-white">Location</p>
                                              <div className="ellipsis-wrapper">
                                                <p
                                                  className="mb-0 text-white para_ellipsis"
                                                  title={event.location.city ? `${event.location.city}, ${event.location.state}` : 'NA'}
                                                >
                                                  <small className="sub_head">
                                                    {event.location.city
                                                      ? `(${event.location.city}, ${event.location.state})`
                                                      : 'NA'}
                                                  </small>
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Mode */}
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                          <div className="row">
                                            <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                              <figure className="text-end">
                                                <img
                                                  src="/Assets/public_assets/images/icons/job-mode.png"
                                                  className="img-fluid new_img p-0"
                                                  draggable="false"
                                                />
                                              </figure>
                                            </div>
                                            <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white events_features ps-0">
                                              <p className="mb-0 text-white">Mode</p>
                                              <p className="mb-0 text-white">
                                                <small className="sub_head">({event.eventMode})</small>
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2 text-center">
                                          <a
                                            className={`btn cta-callnow btn-bg-color shr--width w-100 ${isRegistrationClosed ? 'disabled opacity-50 cursor-not-allowed' : ''}`}
                                            href={`/candidate/login?returnUrl=/candidate/candidateevent`} 
                                            onClick={(e) => {
                                              if (isRegistrationClosed) e.preventDefault();
                                            }}
                                          >
                                            Apply Now
                                          </a>
                                        </div>
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2 text-center">
                                          <button className="btn cta-callnow shr--width w-100">
                                            Guidelines
                                          </button>
                                        </div>

                                      </div>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12 text-center py-5">
                        <h3 className="text-muted">No Events found </h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Video Modal */}
        <div className="modal fade" id="videoModal" tabIndex="-1" aria-labelledby="videoModalTitle" aria-hidden="true"
          onClick={() => setVideoSrc("")}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0 text-center embed-responsive">
                <video key={videoSrc} id="eventVid" controls className="video-fluid text-center">
                  <source src={videoSrc} type="video/mp4" className="img-fluid video-fluid" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>

        {/* Callback Modal */}
        <div className="modal fade" id="callbackModal" tabIndex="-1" aria-labelledby="callbackModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered newWidth">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-black" id="callbackModalLabel">
                  Request for Call Back
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form id="callbackForm" >
                  <div className="row mb-3">
                    <div className="col-md-6 col-6">
                      <label className="form-label">Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} required placeholder="Enter your name" />
                    </div>
                    <div className="col-md-6 col-6">
                      <label className="form-label">State</label>
                      <select className="form-control" name="state" value={formData.state} required>
                        <option value="" disabled>Select your State</option>
                        {statesList.map((state, index) => (
                          <option key={index} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6 col-6">
                      <label className="form-label">Contact Number</label>
                      <input type="tel" className="form-control" name="mobile" value={formData.mobile} required pattern="[0-9]{10}" placeholder="Enter 10-digit mobile number" />
                    </div>
                    <div className="col-md-6 col-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={formData.email} required placeholder="Enter your email" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" name="message" value={formData.message} required placeholder="Enter your message here..."></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
                  {successMessage && <p className="text-success">{successMessage}</p>}
                  {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </form>
                {successMessage && <p className="text-success">{successMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      </FrontLayout>
      <style>
        {`
          #eventVid {
            width: 100%;
            border-radius: 10px;
            outline: none;
          }
            .cursor-not-allowed {
  cursor: not-allowed;
}
.opacity-50 {
  opacity: 0.5;
}
  .btn.disabled {
  color: #fc2e5a !important;
  background: white !important;
  border: 1px solid #fc2e5a !important;
}
  .btn.disabled:hover {
  color: #fc2e5a !important;
  background: white !important;
}

        `}
      </style>
      <style>
        {
          `
          .op-Reg{
    color: #fff;
}
.flag{
    position: absolute;
    top: 2px;
    left: 10px;
}
.flag h4{
  font-size: 15px;
}
.share-Event{
    position: absolute;
    top: 5px;
    right: 10px;
}
.openRegistration{
    position: absolute;
    bottom: 20px;
    text-align: center;
    color: #fff;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
}
.op-Reg-p{
    color: #fff;
    font-weight: 500;
    font-size: 16px;
}

/* From Uiverse.io by Mohammad-Rahme-576 */ 
/* Container Styles */
.share-Event .tooltip-container {
    position: relative;
    display: inline-block;
    font-family: "Arial", sans-serif;
    overflow: visible;
  }
  
  /* Button Styles */
 .share-Event  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6e8efb, #a777e3);
    color: white;
    padding: 5px 10px;
    border-radius: 50px;
    cursor: pointer;
    transition:
      background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
      transform 0.3s ease,
      box-shadow 0.4s ease;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
    overflow: hidden;
  }
  
 .share-Event  .button-content::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      rgba(110, 142, 251, 0.4),
      rgba(167, 119, 227, 0.4)
    );
    filter: blur(15px);
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: -1;
  }
  
  .share-Event .button-content::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    transform: scale(0);
    transition: transform 0.6s ease-out;
    z-index: -1;
  }
  
  .share-Event .button-content:hover::before {
    opacity: 1;
  }
  
  .share-Event .button-content:hover::after {
    transform: scale(1);
  }
  
  .share-Event .button-content:hover {
    background: linear-gradient(135deg, #a777e3, #6e8efb);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    transform: translateY(-4px) scale(1.03);
  }
  
  .share-Event .button-content:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  }
  
  .share-Event .text {
    font-size: 13px;
    font-weight: 600;
    margin-right: 2px;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: letter-spacing 0.3s ease;
  }
  
  .share-Event .button-content:hover .text {
    letter-spacing: 1px;
  }
  
  .share-Event .share-icon {
    fill: white;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      fill 0.3s ease;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  .share-Event .button-content:hover .share-icon {
    transform: rotate(180deg) scale(1.1);
    fill: #ffffff;
  }
  
  /* Tooltip Styles */
  /* .share-Event .tooltip-content {
    position: absolute;
    top: 71%;
    left: 50%;
    transform: translateX(-50%) scale(0.8);
    background: white;
    border-radius: 15px;
    padding: 22px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      visibility 0.5s ease;
    z-index: 100;
    pointer-events: none;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
  } */
  
  .share-Event .tooltip-content {
    position: absolute;
    top: 71%;
    left: 50%;
    transform: translateX(-50%) scale(0.8);
    background: rgba(255, 255, 255, 0.9);
    border-radius: 15px;
    padding: 22px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    opacity: 0;
    visibility: hidden;
    transition: 
      opacity 0.4s ease,
      transform 0.4s ease,
      visibility 0.4s;
    pointer-events: none;
    z-index: 100;
  }
  
  .share-Event .tooltip-container:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
    left: 0;
    transform: translateX(-50%) scale(0.8);
    pointer-events: auto;
    transition-delay: 0s;
  }
  .share-Event .tooltip-content {
    transition:  opacity 0.4s ease,
    visibility 0.4s;
    transition-delay: 0s;
  }
  /* Social Icons Styles */
  .share-Event .social-icons {
    display: flex;
    justify-content: space-between;
    gap: 5px;
  }
  
  .share-Event .social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f0f0f0;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      background 0.3s ease,
      box-shadow 0.4s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }
  
  .share-Event .social-icon::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .share-Event .social-icon:hover::before {
    opacity: 1;
  }
  
  .share-Event .social-icon svg {
    width: 24px;
    height: 24px;
    fill: #333;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      fill 0.3s ease;
    z-index: 1;
  }
  
  .share-Event .social-icon:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
  
  .share-Event .social-icon:active {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
  
  .share-Event .social-icon:hover svg {
    transform: scale(1.2);
    fill: white;
  }
  
  .share-Event .social-icon.twitter:hover {
    background: linear-gradient(135deg, #1da1f2, #1a91da);
  }
  
  .share-Event .social-icon.facebook:hover {
    background: linear-gradient(135deg, #1877f2, #165ed0);
  }
  
  .share-Event .social-icon.linkedin:hover {
    background: linear-gradient(135deg, #0077b5, #005e94);
  }
  
  /* Animation for Pulse Effect */
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(110, 142, 251, 0.4);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(110, 142, 251, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(110, 142, 251, 0);
    }
  }
  
  .share-Event .button-content {
    animation: pulse 3s infinite;
  }
  
  /* Hover Ripple Effect */
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .share-Event .button-content::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: inherit;
    transform: scale(0);
    opacity: 0;
  }
  
  .share-Event .button-content:active::before {
    animation: ripple 0.6s linear;
  }
  
  /* Tooltip Arrow */
  .share-Event .tooltip-content::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 10px 10px 10px;
    border-style: solid;
    border-color: transparent transparent rgba(255, 255, 255, 0.9) transparent;
    filter: drop-shadow(0 -3px 3px rgba(0, 0, 0, 0.1));
  }
  
  /* Accessibility */
  .share-Event .button-content:focus {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(110, 142, 251, 0.5),
      0 8px 15px rgba(0, 0, 0, 0.1);
  }
  
  .share-Event .button-content:focus:not(:focus-visible) {
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .share-Event .button-content {
      padding: 12px 24px;
      border-radius: 40px;
    }
  
    .text {
      font-size: 16px;
    }
  
    .share-Event .tooltip-content {
      width: 240px;
      padding: 18px;
    }
  
    .share-Event .social-icon {
      width: 44px;
      height: 44px;
    }
  
    .share-Event .social-icon svg {
      width: 20px;
      height: 20px;
    }
  }
  
  @media (max-width: 480px) {
    .share-Event .button-content {
      padding: 10px 20px;
    }
  
    .share-Event .text {
      font-size: 14px;
    }
  
    .share-Event .tooltip-content {
      width: 200px;
      padding: 15px;
    }
  
    .share-Event .social-icon {
      width: 40px;
      height: 40px;
    }
  
    .share-Event .social-icon svg {
      width: 18px;
      height: 18px;
    }
  }
  
  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .share-Event .tooltip-content {
      background: rgba(30, 30, 30, 0.9);
      color: white;
    }
  
    .share-Event .tooltip-content::before {
      border-color: transparent transparent rgba(30, 30, 30, 0.9) transparent;
    }
  
    .share-Event .social-icon {
      background: #2a2a2a;
    }
  
    .share-Event .social-icon svg {
      fill: #e0e0e0;
    }
  }
  
  /* Print Styles */
  @media print {
    .share-Event .tooltip-container {
      display: none;
    }
  }
  
  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .share-Event .button-content,
    .share-Event .share-icon,
    .share-Event .social-icon,
    .share-Event .tooltip-content {
      transition: none;
    }
  
    .share-Event .button-content {
      animation: none;
    }
  }
  
  /* Custom Scrollbar for Tooltip Content */
  .share-Event .tooltip-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .share-Event .tooltip-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .share-Event .tooltip-content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  .share-Event .tooltip-content::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
          `
        }
      </style>

      <style>
        {
`

.bg-img {
  position: relative;
  border-radius: 11px;
  border: 1px solid #ffffff;
  box-shadow: rgb(227, 59, 22, 77%) 0px 0px 0.25em, rgba(24, 86, 201, 0.05) 0px 0.25em 1em;
}
img.group1 {
  width: 75px !important;
  height: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.course_card_footer img {
  width: 20px;
}
.courses_features p {
  line-height: normal;
  font-size: 12px;
}
.color-yellow {
  color: #FFD542;
}
.btn.shr--width{
width: 100%;
}
.btn.cta-callnow {
  background: #fff;
  color: #FC2B5A;
  font-family: inter;
  border-radius: 50px;
  font-weight: 500;
  padding: 10px 4px;
  width: 120%;
  font-size: 12px;
  letter-spacing: 1px;
  transition: .3s;
}
.btn.cta-callnow:hover {
  transition: .5s;
  background: #FC2B5A;
  color: #fff;
}
.learnn{
padding: 10px 14px;
}
.course_card_footer {
  background: #FC2B5A;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}
.jobs h1 {
  color: #FC2B5A;
  font-size: 45px;
  font-weight: 700;
  font-family: 'INTER', sans-serif;
}

.courseCard{
border-radius: 12px!important;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
video#courseVid {
  width: 100%;
  height: auto;
  border-radius: 6px;
}
.smallText{
color: #fff;
background-color: #FC2B5A!important;
}
button.close {
  z-index: 9;
  background: #fff;
  border: 2px solid #FC2B5A !important;
  font-size: 19px;
  border-radius: 100px;
  height: 38px;
  opacity: 1;
  padding: 0;
  position: absolute;
  /* right: -13px; */
  right: 0px;
  /* top: -12px; */
  top: 0px;
  width: 38px;
  -webkit-appearance: none;
  -moz-box-shadow: none;
  -webkit-box-shadow: none;
  box-shadow: none;
  font-weight: 400;
  transition: .3s;
  font-weight: 900;
  color:#000!important;
}
button.close span {
  font-size: 30px;
  line-height: 30px;
  color: #FC2B5A;
  font-weight: 400;
}
.sector--select{
display: flex;
align-items: center;

}

@media only screen and (max-width: 1199px) {
  .card {
      width: 100%;
  }
  .card-padd {
      display: flex
;
      justify-content: center;
      padding-left: 0 !important;
  }
}
@media only screen and (max-width: 768px) {
.sector--select{
display: none;
}
.jobs-heading {
      font-size: 30px !important;
  }
  .card {
      width: 95% !important;
  }
  
  .jobs-heading {
      font-size: 22px;
  }
}
@media only screen and (max-width: 700px) {
  .card {
      width: 95% !important;
  }
}
@media (max-width: 578px) {

  .jobs-heading {
      font-size: 27px !important;
  }
}
@media (max-width: 432px) {
  .jobs-heading {
      font-size: 25px !important;
  }
}
@media (max-width: 392px) {
 
  .courses_features p{
      font-size: 14px;
  }
}
@media (max-width: 375px) {
 
  
}


/* Course.css */

/* Filter Styles */
.filter-container {
  margin: auto;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #6b7280;
  font-weight: 500;
}

.filter-buttons {
  display: flex;
  overflow-y: hidden;
  overflow-x: auto;
  gap: 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 8px;
}

.filter-buttons::-webkit-scrollbar {
  display: none;
}

.filter-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-button:hover {
  border-color: #ec4899;
}

.filter-button.active {
  background: #ec4899;
  color: white;
  transform: scale(1.05);
}

.count {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #374151;
}

.filter-button.active .count {
  background: #db2777;
  color: white;
}

.active-indicator {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: #ec4899;
}

/* Course Card Styles */
.courseCard {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease;
  height: 100%;
}

.courseCard:hover {
  transform: translateY(-5px);
}

.bg-img {
  position: relative;
  overflow: hidden;
}

.bg-img img.digi {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.right_obj {
  position: absolute;
  top: 10px;
  background-color: #ec4899;
  color: white;
  padding: 5px 10px;
  /* border-radius: 20px; */
  /* font-size: 0.8rem; */
  font-weight: bold;
}

.group1 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  opacity: 0.8;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.bg-img:hover .group1 {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.para_ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.courses_features {
  font-size: 0.85rem;
}

.sub_head {
  opacity: 0.8;
  font-size: 0.75rem;
}

.color-yellow {
  color: #ffc107;
}


.btn-bg-color {
  background-color: #ec4899;
  color: white;
  border: none;
}

.btn-bg-color:hover {
  background-color: #db2777;
  color: white;
}

.cta-callnow {
  font-weight: 500;
  transition: all 0.3s ease;
}

.cta-callnow:hover {
  transform: translateY(-2px);
}

/* Section Styles */
.section-padding-60 {
  padding: 60px 0;
}

.jobs-heading {
  color: #333;
  font-weight: 700;
  position: relative;
}
.search-container{
  position: relative;
}
.search-icon {
  position: absolute;
  left: 5px;
  /* top: 15px; */
  font-size: 16px;
}
/* .jobs-heading:after {
  content: '';
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background-color: #ec4899;
  border-radius: 2px;
}
 */
/* Modal Styles */
.modal-content {
  border: none !important;
  border-radius: 12px;
  /* overflow: hidden; */
}

.modal-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.submit_btn {
  background-color: #ec4899;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.submit_btn:hover {
  background-color: #db2777;
}
.new_img{
  width: 20px!important;
}
.apply_date{
  font-size: 16px;
}

#callbackForm input , #callbackForm select{
background-color: transparent;
padding: 7px 12px;
border: 1px solid ;
height: 37px;
}
#callbackForm textarea{
margin-bottom: 20px;
border: 1px solid ;
}
#callbackForm button{
border: 1px solid #fc2b5a;
transition: 0.4s ease-in-out;
}
#callbackForm button:hover{
border: 1px solid #FC2B5A;
color: #FC2B5A;
font-weight: bold;
background: transparent!important;
scale: 1.1;
}
.newWidth{
width: 30%!important;
}

.companyname{
font-size: 12px;
}
@media (max-width:992px){
.newWidth{
  width: 100%!important;
}
}
@media(max-width:768px){
.mobileJobs{
  justify-content: center;
}
.eventMobile{
justify-content: center;
}
}
`

        }
      </style>
    </>
  );
}

export default Event;