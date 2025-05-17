
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import "./SearchCourses.css";

const SearchCourses = () => {
  const [courses, setCourses] = useState([]);
  const [videoSrc, setVideoSrc] = useState(""); // ✅ Store the video URL
  const videoRef = useRef(null); // ✅ Reference to the video element
  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  useEffect(() => {
    fetchCourses();
  }, [location.search]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${backendUrl}/candidate/searchcourses`, {
        headers: { "x-auth": token },
      });
      console.log("✅ Courses Fetched:", response);
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // ✅ Get course thumbnail image
  const getCourseImageUrl = (course) => {
    return course.thumbnail
      ? `${bucketUrl}/${course.thumbnail}`
      : "/Assets/public_assets/images/newjoblisting/course_img.svg";
  };

  const handleVideoClick = (videoUrl) => {
    setVideoSrc(videoUrl);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  };

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => setVideoSrc(""));
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);

  const openChatbot = () => {
    console.log("On click start")
    const chatContainer = document.getElementById("iframe-box");
    if (chatContainer) {
      chatContainer.classList.toggle("active");
      console.log("class added")
    } else {
      console.error("Chat container (iframe-box) not found!");
    }

    // Trigger the bootm-box click event to initialize the chat
    const bootmBox = document.getElementById("bootm-box");
    if (bootmBox) {
      bootmBox.click();
    } else {
      console.error("Element with ID 'bootm-box' not found!");
    }
  }

  return (
    <div className="">
      <div className="container mt-3">
        {/* Breadcrumbs header for desktop */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12 my-auto">
                <h3 className="content-header-title float-left mb-0">Search Courses</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/candidate/dashboard">Home</Link>
                    </li>
                    <li className="breadcrumb-separator">
                      <i className="fas fa-angle-right mx-1 text-muted"></i>
                    </li>
                    <li className="breadcrumb-item active">Search Courses</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="nav nav-tabs justify-content-center d-md-none d-sm-none" id="courseTabs">
          <li className="nav-item">
            <Link className="nav-link active" to="/search-courses">
              Search Courses
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/candidate/pendingFee">
              Pending for Fee
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/candidate/appliedCourses">
              Applied Courses
            </Link>
          </li>
        </ul>

        <section className="searchjobspage mt-3">
          <div className="row justify-content-sm-center justify-content-md-start">
            {courses.length > 0 ? (
              courses.map((course) => (

                <div
                  className="col-xl-6 col-lg-6 col-md-6 col-sm-10 mx-auto"
                  key={course._id}
                >

                  <div className="cr_nw_in position-relative">
                    <div className="right_obj shadow">
                      {course.courseType === "coursejob" ? "Course + Job" : "Course"}
                    </div>

                    <a
                      href="#"
                      data-bs-toggle="modal"
                      data-bs-target="#videoModal"
                      onClick={(e) => {
                        e.preventDefault();
                        handleVideoClick(
                          course.videos && course.videos[0]
                            ? `${bucketUrl}/${course.videos[0]}`
                            : ""
                        );
                      }}
                      className="video-bttn position-relative d-block"
                    >
                      <img
                        src={getCourseImageUrl(course)}
                        className="video_thum img-fluid"
                        alt="Course Thumbnail"
                      />

                    </a>

                    <div className="course_inf pt-0">
                      <Link to={`/candidate/course/${course._id}`}>

                        <h5>{course.name || "N/A"}</h5>
                        <span className="job_cate">
                          {course.sectors?.length > 0 && course.sectors[0]?.name
                            ? course.sectors[0].name
                            : "N/A"}
                        </span>


                        <div className="row">
                          <div className="col-md-6 col-sm-6 col-6">
                            <div class="course_spec">
                              <div class="spe_icon">
                                <figure className="text-end">
                                  <img src="/Assets/public_assets/images/newicons/eligibility.png" className="img-fluid p-0 width" alt="Eligibility" />
                                </figure>
                              </div>
                              <div class="spe_detail">
                                <p className="mb-0 text-black">Eligibility</p>
                                <p className="mb-0 text-black">
                                  <small className="sub_head">({course.qualification || "N/A"})</small>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 col-sm-6 col-6">
                            <div class="course_spec">
                              <div class="spe_icon">
                                <figure className="text-end">
                                  <img src="/Assets/public_assets/images/newicons/duration.png" className="img-fluid p-0 width" alt="Duration" />
                                </figure>
                              </div>
                              <div class="spe_detail">
                                <p className="mb-0 text-black">Duration</p>
                                <p className="mb-0 text-black">
                                  <small className="sub_head">({course.duration || "N/A"})</small>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 col-sm-6 col-6">
                            <div class="course_spec">
                              <div class="spe_icon">
                                <figure className="text-end">
                                  <img src="/Assets/public_assets/images/newicons/location.png" className="img-fluid p-0 width" alt="Location" />
                                </figure>
                              </div>
                              <div class="spe_detail">
                                <p className="mb-0 text-black">Location</p>
                                <p className="mb-0 text-black">
                                  <small className="sub_head">({course.city ? `${course.city}, ${course.state}` : "N/A"})</small>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 col-sm-6 col-6">
                            <div class="course_spec">
                              <div class="spe_icon">
                                <figure className="text-end">
                                  <img src="/Assets/public_assets/images/newicons/job-mode.png" className="img-fluid p-0 width" alt="Mode" />
                                </figure>
                              </div>
                              <div class="spe_detail">
                                <p className="mb-0 text-black">Mode</p>
                                <p className="mb-0 text-black">
                                  <small className="sub_head">({course.trainingMode || "N/A"})</small>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="row mt-1">
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                          <Link
                            className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0"
                            to={`/candidate/course/${course._id}`}
                          >
                            <i className="la la-paper-plane ml-2"></i>
                            Apply Now
                          </Link>
                        </div>
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                          {/*
<a
  className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0"
  href="https://wa.me/918699017301?text=hi"
>
  <i className="la la-phone plane-font ml-2"></i>
  Chat Now
</a>
*/}
                          <button onClick={() => openChatbot()} className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0">
                            Chat Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <h4 className="text-center w-100">No Courses Found</h4>
            )}
          </div>
        </section>



        {/* ✅ Video Modal */}
        <div
          className="modal fade"
          id="videoModal"
          tabIndex="-1"
          aria-labelledby="videoModalTitle"
          aria-hidden="true"
          onClick={() => setVideoSrc("")}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0 text-center embed-responsive">
                <video key={videoSrc} id="courseVid" controls className="video-fluid text-center">
                  <source src={videoSrc} type="video/mp4" className="img-fluid video-fluid" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>


        <style>
          {`
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

          .video-bttn {
            position: relative;
            display: block;
          }

          .video-bttn img {
            width: 100%;
            height: auto;
          }
            .right_obj{
            right:0px;
            }
        `}
        </style>
      </div>
    </div>

  );
};

export default SearchCourses;
