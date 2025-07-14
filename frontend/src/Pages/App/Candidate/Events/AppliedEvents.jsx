import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';

const CandidatesEvents = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [events, setEvents] = useState([]);
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    // Initialize carousel when component mounts
    initCarousel();

    // Fetch events data
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backendUrl}/candidate/applied-events`, {
          headers: {
            'x-auth': token
          }
        });
        console.log("events", response.data.events);
        setEvents(response.data.events);
      } catch (error) {
        console.error("Error fetching events data:", error);
      }
    };
    
    fetchEvents();
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

  // Function to check if registration is closed
  const checkRegistrationStatus = (eventDate) => {
    const today = moment();
    const eventEndDate = moment(eventDate);
    return eventEndDate.isBefore(today);
  };

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => {
        setVideoSrc(""); // Resets video when modal is fully closed
      });
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);

  const handleApplyClick = async (eventId) => {
    const confirmApply = window.confirm("Do you really want to apply for this event?");
    if (!confirmApply) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${backendUrl}/candidate/apply-event`, {
        // or however you store it
        eventId,
        // assume admin/manager is logged in
      }, {
        headers: {
          'x-auth': token
        }
      });

      if (res.data.status) {
        setShowCongratsModal(true);
        setSelectedEventId(eventId);
      } else {
        alert(res.data.message || "Could not apply. Please try again.");
      }
    } catch (error) {
      console.error("Error applying:", error);
      alert("An error occurred while applying.");
    }
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
                      {events.length > 0 ? (
                        events.map((event) => {
                          const isRegistrationClosed = checkRegistrationStatus(event.timing.to);

                          return (
                            <div key={event._id} className="col-xl-6 col-lg-6 col-md-6 col-sm-10 mx-auto mb-4">
                              <div className="cr_nw_in">
                                <div className={`right_obj shadow `} >
                                  <span>
                                    Applied
                                  </span>
                                </div>


                                {/* Video Button */}
                                <a href="#" data-bs-target="#videoModal" data-bs-toggle="modal"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setVideoSrc(event.video);
                                    console.log('event video ', event.video)
                                  }}
                                  className="video-bttn position-relative d-block">
                                  <img
                                    id="videoPlay"
                                    src={event.thumbnail}
                                    className="video_thum img-fluid"
                                    alt={event.name}
                                  />

                                </a>

                                {/* Event Information */}
                                <div className="course_inf pt-0">
                                  <h5>{event.eventTitle}</h5>
                                  <span className="job_cate">{event.eventType}</span>


                                  {/* Event Date and Time */}
                                  <div className="event-timing mb-2">
                                    <p className="mb-1 text-center">
                                      <strong>Event Date:</strong> {moment(event.timing.from).format("DD-MM-YYYY")}
                                      To: {moment(event.timing.to).format("DD-MM-YYYY")}
                                    </p>
                                    <p className="mb-1  text-center">
                                      <strong>Event Time:</strong> {moment(event.timing.from).format("hh:mm A")}
                                      To: {moment(event.timing.to).format("hh:mm A")}
                                    </p>
                                  </div>

                                  <div className="row">
                                    {/* Location Info */}
                                    <div className="col-md-6 col-sm-6 col-6">
                                      <div className="course_spec">
                                        <div className="spe_icon">
                                          <figure className="text-end">
                                            <img
                                              src="/Assets/public_assets/images/newicons/location.png"
                                              className="img-fluid p-0 width"
                                              draggable="false"
                                              alt="Location Icon"
                                            />
                                          </figure>
                                        </div>
                                        <div className="spe_detail">
                                          <p className="mb-0 text-black">Location</p>
                                          <div className="ellipsis-wrapper">
                                            <p className="mb-0 text-black para_ellipsis"
                                              title={event.location.city ? `${event.location.city}, ${event.location.state}` : 'NA'}>
                                              <small className="sub_head">
                                                {event.location.city ? `(${event.location.city}, ${event.location.state})` : 'NA'}
                                              </small>
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
                                              src="/Assets/public_assets/images/newicons/job-mode.png"
                                              className="img-fluid p-0 width"
                                              draggable="false"
                                              alt="Mode Icon"
                                            />
                                          </figure>
                                        </div>
                                        <div className="spe_detail">
                                          <p className="mb-0 text-black">Mode</p>
                                          <p className="mb-0 text-black">
                                            <small className="sub_head">({event.eventMode})</small>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className={`row mt-1 ${!event.guidelines ? 'justify-content-center' : ''}`}>
                                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                      <Link
                                        className={`apply-thisjob text-left px-1 apply-padding mb-0 mt-0 disabled-btn`}
                                        to="#"
                                        title="Apply Now"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (!isRegistrationClosed) {
                                            handleApplyClick(event._id);
                                          }
                                        }}
                                      >
                                        <i className="la la-paper-plane"></i> Already Applied
                                      </Link>
                                    </div>

                                    {event.guidelines && (
                                      <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                                        <a
                                          className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0"
                                          href="#"
                                          title="Guidelines"
                                        >
                                          <i className="la la-info-circle"></i> Guidelines
                                        </a>
                                      </div>
                                    )}
                                  </div>


                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-12 text-center py-5">
                          <h3 className="text-muted">No Events found</h3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

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

        <div className="modal fade show" tabIndex="-1" style={{ display: showCongratsModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 text-center">
              <h4 className="mb-3 text-success">🎉 Congratulations!</h4>
              <p>You have successfully applied for the event.</p>
              <p>To increase your chances, strengthen your profile now!</p>
              <Link to="/candidate/myProfile" className="btn btn-primary mt-3">Update My Profile</Link>
            </div>
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

          /* Disabled button styles */
          .disabled-btn {
            color: #fc2e5a !important;
            background: white !important;
            border: 1px solid #fc2e5a !important;
            cursor: not-allowed !important;
            opacity: 0.7 !important;
          }

          .disabled-btn:hover {
            color: #fc2e5a !important;
            background: white !important;
          }

          .registration-status {
            margin-top: 10px;
          }

          .badges {
            padding: 5px 10px;
            font-size: 14px;
            border-radius: 4px;
          }

          .bg-danger {
            background-color: #dc3545;
            color: white;
          }

          .bg-success {
            background-color: #28a745;
            color: white;
          }

          .event-timing {
            margin-bottom: 15px;
          }

          .video_thum {
            width: 100%;
            height: auto;
            object-fit: cover;
          }

          .group1 {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
          }

          .cr_nw_in {
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
.right_obj{
  right : 0!important;
   
  }

  .breadcrumb-item a {
    color: #FC2B5A;
        }    

      `}</style>
      </div>
    </>
  );
};

export default CandidatesEvents;