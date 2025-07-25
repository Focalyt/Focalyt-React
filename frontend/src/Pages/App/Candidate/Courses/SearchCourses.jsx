
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";

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
    if (!course.thumbnail) return "/Assets/public_assets/images/newjoblisting/course_img.svg";
    if (course.thumbnail.includes(bucketUrl)) return course.thumbnail;
    return `${bucketUrl}/${course.thumbnail}`;
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
            <div className="modal-content p-0">
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

            .video-bttn:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    margin-left: -20px;
    margin-top: -20px;
    background-image: url(../../../../../public/Assets/images/icon-play.png);
    background-size: contain;
    display: block;
    width: 44px;
    height: 44px;
    box-shadow: 0 .5rem 1rem rgb(252 43 90 / 39%) !important;
    border-radius: 50px;
}
.apply-thisjob {
    background-color: #FC2B5A;
    width: calc(100% - 30px);
    border: 2px solid #FC2B5A;
    // text-align: center;
    float: left;
    color: #fff!important;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 12px;
    font-family: Open Sans;
    font-weight: bold;
    text-align: left;
}
.apply-thisjob i {
    font-size: 28px;
    margin-right: 8px;
    line-height: 11px;
    position: relative;
    top: 5px;
}
.extra-job-info {
    float: left;
    width: calc(100% - 30px);
    margin-top: 30px;
}
.extra-job-info>span {
    float: left;
    width: 100%;
    border: 2px solid #e8ecec;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 10px 20px;
    margin-bottom: 10px;
    font-family: Open Sans;
    font-size: 13px;
    color: #888888;
}
.extra-job-info>span i {
    margin-left: 8px;
    float: left;
    font-size: 30px;
    color: #FC2B5A;
    width: 30px;
    margin-right: 12px;
}
.extra-job-info>span strong {
    font-family: Open Sans;
    font-size: 13px;
    font-weight: normal;
    color: #202020;
    line-height: 28px;
    display: inline;
    margin-right: 7px;
}
.job-single-sec {
    float: left;
    width: 100%;
}
.cr_detail_in .course_dt {
    background: #eeeeee54;
    padding: 8px;
    border-radius: 6px;
    border: solid 1px #dddddda8;
}
.cr_detail_in .course_dt h6 {
    font-size: 13px;
    font-weight: 600;
}
.cr_detail_in .course_dt p {
    color: #6d6d6d;
}
#candi_login-faq {
    background: rgba(217, 217, 217, 0.3);
    border: 1px solid #9e9e9e;
    border-radius: 25px;
    padding: 30px 15px;
}
.course_dt h6 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
}
.single-footer .contact-info {
    margin-top: 15px;
}
.single-footer .contact-info li {
    margin-bottom: 10px;
    color: #000;
    font-weight: 500;
    position: relative;
    padding-left: 20px;
}
.single-footer .contact-info li img {
    position: absolute;
    left: 0;
    top: 3px;
    height: auto;
    width: 12px;
}
li#que p {
    margin-bottom: 0px !important;
    line-height: normal;
}
div#floating-apply {
    position: fixed;
    bottom: 100px;
    right: 10px;
    z-index: 999;
}


@media(max-width:1024px){
    .card{
        width: 100%!important;
    }
    .extra-job-info{
        width: 100%;
    }

}
@media(max-width:768px){
    .course_details_col {
        background: rgba(217, 217, 217, 0.3);
        border: 1px solid #9e9e9e;
        border-radius: 25px;
        padding: 10px 10px;
    }
}
        `}
        </style>

        <style>
          {

            `
            .cr_nw_in {
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
    transition: all .3sease-in-out;
    margin: 15px 0px;
    position: relative;
}
.right_obj {
    color: #FC2B5A;
    background: #fff;
    width: fit-content;
    padding: 2px 10px;
    position: absolute;
    top: 30px;
    right: 17px;
    box-shadow: 0.5px 0px 2px rgba(0, 0, 0, 0.30);
    font-weight: 700;
    font-family: inter;
    border-bottom-left-radius: 15px;
    border: 1px dashed #FFD542;
    outline: 3px solid #FFF;
    border-right: 0px;
    z-index: 1;
}
.cr_nw_in img.video_thum {
    border-radius: 8px 8px 0px 0px;
    width: 100%;
}
.video-bttn:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    margin-left: -20px;
    margin-top: -20px;
    background-image: url(/Assets/images/icon-play.png); 
    background-size: contain;
    display: block;
    width: 44px;
    height: 44px;
    box-shadow: 0 .5rem 1rem rgb(252 43 90 / 39%) !important;
    border-radius: 50px;
}
.course_inf {
    padding: 15px;
}
.course_inf h5 {
    font-size: 17px;
    text-transform: capitalize;
    font-weight: 600;
    line-height: 24px;
    color: #000;
}
.course_inf span.job_cate {
    background: #1b95391a;
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 4px;
    color: #1b9539;
    border: solid 1px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.2px;
    display: inline-table;
    width: fit-content;
    overflow: auto;
    word-wrap: break-word;
}
.course_spec {
    display: flex
;
    margin-top: 20px;
    color: #000;
}
.course_spec .spe_icon {
    margin-right: 10px;
}
.width {
    width: 30px;
}
.apply-thisjob {
    background-color: #FC2B5A;
    float: left;
    width: calc(100% - 30px);
    border: 2px solid #FC2B5A;
    text-align: center;
    color: #fff;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 12px;
    font-family: Open Sans;
    font-weight: bold;
    text-align: left;
}
.apply-thisjob:hover {
    border: 2px solid #FC2B5A;
    background: #fff;
    color: #FC2B5A!important;
    text-decoration: none;
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

  .course_spec .spe_icon {
    margin-right: 10px;
}
.video-fluid{
    width: 100%;
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
    right: -13px;
    top: -12px;
    width: 38px;
    -webkit-appearance: none;
    -moz-box-shadow: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    font-weight: 400;
    transition: .3s;
    font-weight: 900;
}

@media screen and (max-width: 1261px) {
    .apply-thisjob {
        width: 100% !important;
    }
}
@media screen and (max-width: 992px) {
    .apply-thisjob {
        width: 100% !important;
    }
}
    .breadcrumb-item a {
    color: #FC2B5A;
        }
            `
          }
        </style>
      </div>
    </div>

  );
};

export default SearchCourses;
