import React, { useState, useEffect, useRef } from 'react';

import moment from 'moment';
import axios from 'axios';
import ReCAPTCHA from "react-google-recaptcha";
import FrontLayout from '../../../Component/Layouts/Front';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import CompanyPartners from '../CompanyPartners/CompanyPartners';
function Jobs() {
  const [courses, setCourses] = useState([]);
  const [uniqueSectors, setUniqueSectors] = useState([]);
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
  const backendAppUrl = process.env.REACT_APP_MIPIE_APP_BACKEND_URL;
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
        const response = await axios.get(`${backendUrl}/joblisting`);
        setCourses(response.data.recentJobs,
        );
        setUniqueSectors(response.data.uniqueSectors);

        console.log("Response", response.data.recentJobs)
      } catch (error) {
        console.error("Error fetching course data:", error);
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


  const handleFilterClick = (selectedId) => {
    setActiveFilter(selectedId);
  };

  const handleFeeFilterClick = (feeType) => {
    setFeeFilter(feeType); // ✅ Update the selected fee filter (All, Paid, Free)
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");



    try {
      const response = await axios.post(`${backendUrl}/callback`, {
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


  // useEffect(() => {
  //   // Fetch courses data from API
  //   const fetchData = async () => {
  //     try {

  //       const response = await axios.get(`${backendUrl}/courses`);
  //       console.log("Courses data received:", response);
  //       setCourses(response.data.courses);
  //       setUniqueSectors(response.data.uniqueSectors);
  //     } catch (error) {
  //       console.error("Error fetching course data:", error);
  //     }
  //   };

  //   fetchData();
  // }, []);


  // Filter courses based on selected sector and search term
  const getFilteredCourses = () => {



    // Start with all courses
    let filtered = Array.isArray(courses) ? [...courses] : [];

    console.log("filter jobs", filtered)

    // Then filter by sector if not "all"
    if (activeFilter !== "all") {
      const sectorId = activeFilter.replace("id_", "");
      console.log("Filtering by sector ID:", sectorId);

      filtered = filtered.filter(course => {
        if (!course._industry || !course._industry._id) {
          return false;
        }

        const hasMatchingSector = course._industry._id.toString() === sectorId;

        console.log(`Checking course ${course._id}: Industry ID = ${course._industry._id}, Matching? ${hasMatchingSector}`);

        // const hasMatchingSector = course._industry._id.some(s => s && s.toString() === sectorId);

        return hasMatchingSector;
      });

      console.log("After sector filter, courses count:", filtered.length);
    }

    // Then filter by search term if it exists
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      console.log("Filtering by search term:", term);

      filtered = filtered.filter(course => {
        // Check multiple fields
        const nameMatch = course.name && course.name.toLowerCase().includes(term);
        const qualificationMatch = course.qualification && course.qualification.toLowerCase().includes(term);
        const durationMatch = course.duration && course.duration.toLowerCase().includes(term);
        const cityMatch = course.city && course.city.toLowerCase().includes(term);
        const stateMatch = course.state && course.state.toLowerCase().includes(term);
        const modeMatch = course.trainingMode && course.trainingMode.toLowerCase().includes(term);
        const typeMatch = course.courseType && course.courseType.toLowerCase().includes(term);
        const sectorMatch = course.sectorNames && course.sectorNames.some(name =>
          name.toLowerCase().includes(term)
        );

        return nameMatch || qualificationMatch || durationMatch || cityMatch ||
          stateMatch || modeMatch || typeMatch || sectorMatch;
      });

      console.log("After search filter, courses count:", filtered.length);
    }
    // ✅ Filter by Fee Type (Paid/Free)
    if (feeFilter !== "all") {
      filtered = filtered.filter(course => course.courseFeeType?.toLowerCase() === feeFilter);
    }

    console.log("Final filtered courses count:", filtered.length);
    return filtered;
  };
  const handleShare = async (courseId, courseName, courseThumbnail) => {
    const courseUrl = `${window.location.origin}${window.location.pathname}#${courseId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: courseName,
          text: `Check out this course: ${courseName}`,
          url: courseUrl,
        });
        console.log("Shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
        fallbackCopyText(courseName, courseUrl);
      }
    } else {
      fallbackCopyText(courseName, courseUrl);
    }
  }

  function fallbackCopyText(courseName, courseUrl) {
    const shareText = `Check out this course: ${courseName} - ${courseUrl}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Course link copied! You can paste it anywhere.");
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  }





  const filteredCourses = getFilteredCourses();
  console.log("filteredCourses", filteredCourses)



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

        {/* Courses Section */}
        <section className="jobs section-padding-60">
          <div className="container">
            <div className="row">
              <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
                <div className="row my-xl-5 my-lg-5 my-md-3 my-sm-3 my-5 mobileJobs">
                  <h1 className="text-center text-uppercase jobs-heading pb-4">Select jobs for your career</h1>



                  {/* Filter Container */}
                  <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                    <div className="filter-container">
                      <div className="filter-headerss">
                        <div className='row align-items-center justify-content-between'>
                          <div className='col-md-6 col-12'>
                            <div className='filter-header'>
                              <span>▶</span>
                              <h2 className='fill--sec'>Filter by Sector</h2>
                            </div>

                          </div>

                          {/* Search Bar */}

                          {/* <div className="col-md-3 col-12">
                            <div className="search-container">
                              <input
                                type="text"
                                className="form-control search-input"
                                placeholder="Search courses by Name, Location, Duration, etc."
                                value={searchTerm}
                                onChange={handleSearchChange} style={{ background: "transparent", border: "1px solid" }}
                              />
                              <span className="search-icon">
                                <FontAwesomeIcon icon={faSearch} />
                              </span>
                            </div>
                          </div> */}
                        </div>

                      </div>

                      <div className="filter-buttonss">
                        <button
                          id="all"
                          className={`filter-button text-uppercase ${activeFilter === "all" ? "active" : ""}`}
                          onClick={() => handleFilterClick("all")}
                        >
                          All
                          <span className="count">{Array.isArray(courses) ? courses.length : 0}</span>

                          {activeFilter === "all" && <div className="active-indicator"></div>}
                        </button>

                        {Array.isArray(uniqueSectors) && uniqueSectors.map((sector) => (

                          <button
                            key={sector._id}
                            id={`id_${sector._id}`}
                            className={`filter-button text-uppercase ${activeFilter === `id_${sector._id}` ? "active" : ""}`}
                            onClick={() => handleFilterClick(`id_${sector._id}`)}
                          >
                            {sector.name}
                            <span className="count">
                              {courses.filter(course =>
                                course._industry &&
                                course._industry._id.toString() === sector._id.toString()
                              ).length}
                            </span>
                            {activeFilter === `id_${sector._id}` && <div className="active-indicator"></div>}
                          </button>
                        ))}
                      </div>
                      <div className='d-flex align-items-center d-md-none d-sm-block'>
                        <span className="font-medium text-uppercase me-2">Selected Sector:</span>
                        <span className="filter-button active text-uppercase">
                          {activeFilter === "all"
                            ? "ALL"
                            : uniqueSectors.find(s => `id_${s._id}` === activeFilter)?.name || "ALL"}
                        </span>
                      </div>
                    </div>
                  </div>

{/* <CompanyPartners/> */}
                  {/* Selected Sector Display */}
                  <div className="d-flex justify-content-between gap-3 text-gray-600 mb-4 mt-3">
                    <div className='sector--select'>
                      <span className="font-medium text-uppercase me-2">Selected Sector:</span>
                      <span className="filter-button active text-uppercase">
                        {activeFilter === "all"
                          ? "ALL"
                          : uniqueSectors.find(s => `id_${s._id}` === activeFilter)?.name || "ALL"}
                      </span>
                    </div>
                    {/* <div className='d-flex gap-1' ><span className="font-medium text-uppercase align-content-center me-2">Select Job Type:</span>
                      <button
                        className={`filter-button text-uppercase ${feeFilter === "all" ? "active" : ""}`}
                        onClick={() => handleFeeFilterClick("all")}
                      >

                        ALL
                      </button>
                      <button
                        className={`filter-button text-uppercase ${feeFilter === "paid" ? "active" : ""}`}
                        onClick={() => handleFeeFilterClick("paid")}
                      >
                        Paid
                      </button>
                      <button
                        className={`filter-button text-uppercase ${feeFilter === "free" ? "active" : ""}`}
                        onClick={() => handleFeeFilterClick("free")}
                      >
                        Free
                      </button>

                    </div> */}
                  </div>

                  {/* Course Cards */}
                  <div className="row">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <div key={course._id} className="col-lg-4 col-md-6 col-sm-12 col-12 pb-4 card-padd">
                          <div className="card bg-dark courseCard">
                            <div className="bg-img">
                              {/* <a
                              href="#"
                              data-bs-target="#videoModal"
                              data-bs-toggle="modal"
                              data-bs-link={course.videos && course.videos[0] ? `${bucketUrl}/${course.videos[0]}` : ""}
                              className="pointer img-fluid"
                            >
                              <img
                                src={course.thumbnail
                                  ? `${bucketUrl}/${course.thumbnail}`
                                  : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                className="digi"
                                alt={course.name}
                              />
                              <img
                                src="/Assets/public_assets/images/newjoblisting/play.svg"
                                alt="Play"
                                className="group1"
                              />
                            </a> */}
                              <a
                                href="#"
                                data-bs-toggle="modal"
                                data-bs-target="#videoModal"
                                onClick={(e) => {
                                  e.preventDefault(); // ✅ Prevents default link behavior
                                  // setVideoSrc(course.videos && course.jobVideo ? `${bucketUrl}/${course.jobVideo}` : "");
                                  // setVideoSrc(course.jobVideo);
                                  if (course.jobVideo) {
                                    console.log("Opening video:", course.jobVideo);
                                    setVideoSrc(course.jobVideo);
                                  } else {
                                    console.warn("No video found for this job");
                                    setVideoSrc("");
                                  }
                                }}
                                className="pointer img-fluid"
                              >
                                <img
                                  src={course.jobVideoThumbnail ? `${course.jobVideoThumbnail}` : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                  className="digi"
                                  alt={course.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/Assets/public_assets/images/newjoblisting/course_img.svg";
                                  }}
                                />


                                <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="Play" className="group1" />
                              </a>


                              <div className="flag"></div>
                              <div className="right_obj shadow shadow-new">
                                {course.courseType === 'coursejob' ? 'Course + Jobs' : 'Jobs'}
                              </div>
                            </div>

                            <div className="card-body px-0 pb-0">
                              <h4 class=" text-center course-title text-white fw-bolder text-truncate text-capitalize ellipsis mx-auto" style={{ fontSize: "25px!important", fontWeight: "700!important" }}>
                                {course.title}
                              </h4>
                              <h5
                                className="text-center text-white companyname mb-2 mx-auto text-capitalize ellipsis"
                                title={course.name}
                              >
                                ({course.displayCompanyName})
                              </h5>
                              {(
                                (course.isFixed && course.amount) ||
                                (!course.isFixed && course.min && course.max)
                              ) ? (
                                <p className="text-center digi-price mb-3 mt-3">
                                  <span className="rupee text-white">₹ &nbsp;</span>
                                  <span className="r-price text-white">
                                    {course.isFixed
                                      ? (course.amount || "--")
                                      : ((course.min && course.max) ? `${course.min}-${course.max}` : "--")}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-center digi-price mb-3 mt-3">
                                  <span className="r-price text-white">--</span>
                                </p>
                              )}


                              <div className="row" id="course_height">
                                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                  <div className="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto mb-2">
                                    <div className="row">
                                      {/* Eligibility */}
                                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                        <div className="row">
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                            <figure className="text-end">
                                              <img
                                                src="/Assets/public_assets/images/newjoblisting/qualification.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">

                                            <p className="mb-0 text-white" title={course._qualification?.name || 'N/A'}>
                                              {course._qualification?.name || 'N/A'}
                                            </p>

                                          </div>
                                        </div>
                                      </div>

                                      {/* Duration */}
                                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                        <div className="row">
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                            <figure className="text-end">
                                              <img
                                                src="/Assets/public_assets/images/newjoblisting/fresher.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                            <p className="mb-0 text-white" title={((course.experience == 0 && course.experienceMonths == 0) || (course.experience == 0 && !course.experienceMonths)
                                                ? "Fresher"
                                                : `${course.experience > 0 ? `${course.experience} ${course.experience === 1 ? 'Year' : 'Years'}` : ''} ${course.experienceMonths > 0 ? `${course.experienceMonths} ${course.experienceMonths === 1 ? 'Month' : 'Months'}` : ''}`.trim())}>
                                              {(course.experience == 0 && course.experienceMonths == 0) || (course.experience == 0 && !course.experienceMonths)
                                                ? "Fresher"
                                                : `${course.experience > 0 ? `${course.experience} ${course.experience === 1 ? 'Year' : 'Years'}` : ''} ${course.experienceMonths > 0 ? `${course.experienceMonths} ${course.experienceMonths === 1 ? 'Month' : 'Months'}` : ''}`.trim()}
                                            </p>

                                          </div>
                                        </div>
                                      </div>

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
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">

                                            <div className="ellipsis-wrapper">
                                              <p
                                                className="mb-0 text-white"
                                                title={course.city ? `${course.city.name}, ${course.state.name}` : 'NA'}
                                              >
                                                {course.city
                                                  ? `(${course.city.name}, ${course.state.name})`
                                                  : 'NA'}

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
                                                src="/Assets/public_assets/images/newjoblisting/onsite.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>

                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">

                                            <p className="mb-0 text-white" title={course.work || 'N/A'}>
                                              {course.work}

                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Last Date */}
                                      <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-2 text-center">
                                        <div className="row">
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 my-auto">
                                            <p className="text-white apply_date">Last Date for apply</p>
                                          </div>
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 text-white courses_features ps-0">
                                            <p className="color-yellow fw-bold">
                                              {course.validity
                                                ? moment(course.validity).utcOffset("+05:30").format('DD MMM YYYY')
                                                : 'NA'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>


                                      {/* Action Buttons */}
                                      <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 text-center me-2">
                                        <a
                                          className="btn cta-callnow btn-bg-color shr--width"
                                          href={`/candidate/login?returnUrl=/candidate/job/${course._id}`}
                                        >
                                          Apply Now
                                        </a>
                                      </div>
                                      {/* <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 mb-2 text-center">
                                        <button onClick={() => openChatbot()} className="btn cta-callnow shr--width">
                                          Chat Now
                                        </button>
                                      </div> */}
                                      <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 text-center ms-2">
                                        <button
                                          onClick={() => handleShare(course._id, course.name, course.thumbnail)} className="btn cta-callnow shr--width">
                                          {/* <Share2 size={16} className="mr-1" /> */}
                                          Share
                                        </button>
                                      </div>

                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="col-xxl-12 col-12 col-lg-12 col-md-12 col-sm-12 col-12 course_card_footer">
                                <div className="row py-2">
                                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 justify-content-center align-items-center text-center">
                                    <a href={`/candidate/login?returnUrl=/candidate/job/${course._id}`}>
                                      <span className="learnn pt-1 text-white">Learn More</span>
                                      <img src="/Assets/public_assets/images/link.png" className="align-text-top" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center py-5">
                        <h3 className="text-muted">No Jobs found matching your criteria</h3>
                        <p>Try adjusting your search or filters to find more Jobs</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Video Modal */}
        {/* <div className="modal fade" id="videoModal" tabIndex="-1" role="dialog" aria-labelledby="videoModalTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0 text-center embed-responsive">
                <video id="courseVid" controls autoPlay className="video-fluid text-center">
                  <source id="videoElement" src="" type="video/mp4" className="img-fluid video-fluid" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div> */}
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
                <video key={videoSrc} id="courseVid" controls className="video-fluid text-center">
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
                <form id="callbackForm" onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6 col-6">
                      <label className="form-label">Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your name" />
                    </div>
                    <div className="col-md-6 col-6">
                      <label className="form-label">State</label>
                      <select className="form-control" name="state" value={formData.state} onChange={handleChange} required>
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
                      <input type="tel" className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} required pattern="[0-9]{10}" placeholder="Enter 10-digit mobile number" />
                    </div>
                    <div className="col-md-6 col-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your email" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" name="message" value={formData.message} onChange={handleChange} required placeholder="Enter your message here..."></textarea>
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
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
.bg-img img.digi {
    object-fit: fill;
  }
  .mobileJobs{
    justify-content: center;
  }
}
            `
          }
        </style>


        <style>
          {

            `
.filter-buttonss {
    display: flex;
    overflow-y: hidden;
    overflow-x: auto;
    gap: 12px;
    /* scrollbar-width: none; */
    /* -ms-overflow-style: none; */
    padding-bottom: 8px;
  } 
  /* .filter-buttons{
    
    scrollbar-width: 1px;
    -ms-overflow-style: none;
    padding-bottom: 8px;

    
  } */
  
 
  /* .filter-buttons::-webkit-scrollbar {
    display: none;
  } */
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
`

          }
        </style>
      </FrontLayout>

    </>
  );
}

export default Jobs;