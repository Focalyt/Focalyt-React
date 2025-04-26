import React, { useState, useEffect, useRef } from 'react';

import moment from 'moment';
import axios from 'axios';
import ReCAPTCHA from "react-google-recaptcha";
import FrontLayout from '../../../Component/Layouts/Front';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import "./Event.css"

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

          console.log(`🗓️ Event: ${event.eventTitle}`);
          console.log(`📅 From Date: ${fromDate} | ⏰ From Time: ${fromTime}`);
          console.log(`📅 To Date: ${toDate} | ⏰ To Time: ${toTime}`);
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
        <section className="jobs section-padding-60">
          <div className="container">
            <div className="row">
              <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
                <div className="row my-xl-5 my-lg-5 my-md-3 my-sm-3 my-5">
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
                                  <h4
                                    className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                    title={event.eventTitle}
                                  >
                                    {event.eventType}
                                  </h4>
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
                                            href={`/candidate/login?returnUrl=/candidate/event/${event._id}`} 
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
    </>
  );
}

export default Event;