import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Link } from "react-router-dom";
import feather from 'feather-icons';
const AppliedCourses = () => {
  const [courses, setCourses] = useState([]);
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;


  useEffect(() => {
    feather.replace();
  }, []);
  useEffect(() => {
    fetchAppliedCourses();
  }, []);

  const fetchAppliedCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${backendUrl}/candidate/appliedCourses`, {
        headers: {
          'x-auth': localStorage.getItem('token'),
        },
      });
      setCourses(res.data?.courses || []);
    } catch (err) {
      console.error("Error fetching applied courses:", err);
    }
  };

  return (
    <>

      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12 my-auto">
              <h3 className="content-header-title float-left mb-0">Applied Courses</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Applied Courses</li>
                </ol>

              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="searchCourses" className="mb-2">
        <div className="container">
          <ul className="nav nav-tabs justify-content-center d-md-none d-sm-block" role="tablist">
            <li className="nav-item" role="presentation">
              <Link className="nav-link" to="/candidate/searchcourses">Search Courses</Link>
            </li>
            <li className="nav-item" role="presentation">
              <Link className="nav-link" to="/candidate/pendingFee">Pending for Fee</Link>
            </li>
            <li className="nav-item" role="presentation">
              <Link className="nav-link active" to="/candidate/appliedCourses">Applied Courses</Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="searchjobspage">
        <div className=" pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
          {courses && courses.length > 0 ? (
            courses.map((appliedCourse, index) => {
              const course = appliedCourse._course;
              return (
                <div className="card" key={index}>
                  <div className="card-body">
                    <div className="row pointer">
                      <div className="col-lg-8 col-md-7 column">
                        <div className="job-single-sec mt-xl-0">
                          <div className="job-single-head border-0 pb-0">
                            <div>
                              <h6 className="text-capitalize font-weight-bolder">
                                {course?.name || "NA"}
                              </h6>
                              <span className="text-capitalize set-lineh">
                                {course?.sectors?.length > 0 ? course.sectors[0].name : ""}
                              </span>
                            </div>
                          </div>
                          <Link to={`/candidate/course/${course?._id || "#"}`}>
                            <div className="job-overview mt-4">
                              <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                                <li style={{ display: "inline" }}>
                                  <i className="la la-money"></i>
                                  <h3 className="jobDetails-wrap">
                                    {course?.cutPrice
                                      ? course.cutPrice.toLowerCase() === "free"
                                        ? "Free"
                                        : `₹ ${course.cutPrice}`
                                      : "N/A"}
                                  </h3>
                                  <span className="jobDetails-wrap">Course Fee</span>
                                </li>
                                <li style={{ display: "inline" }}>
                                  <i className="la la-shield"></i>
                                  <h3 className="jobDetails-wrap">
                                    {course?.courseLevel || "N/A"}
                                  </h3>
                                  <span className="jobDetails-wrap">Course Level</span>
                                </li>
                                <li style={{ display: "inline" }}>
                                  <i className="la la-graduation-cap"></i>
                                  <h3 className="jobDetails-wrap">
                                    {course?.certifyingAgency || "N/A"}
                                  </h3>
                                  <span className="jobDetails-wrap">Course Agency</span>
                                </li>
                                <li style={{ display: "inline", float: "right", width: '35.334%' }}>
                                  <i className="la la-money"></i>
                                  <h3 className="jobDetails-wrap">
                                    {appliedCourse.registrationFee === "Paid" ? "Paid" : "Unpaid"}
                                  </h3>
                                  <span className="jobDetails-wrap">Registration Status</span>
                                </li>
                              </ul>
                            </div>
                          </Link>
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-5 column mt-xl-1 mt-lg-1 mt-md-1 mt-sm-3 mt-0">
                        <div className="extra-job-info mt-1">
                          <span className="px-0">
                            <i className="la la-map"></i>
                            <strong>Last Date</strong>{" "}
                            {moment(course?.lastDateForApply || course?.createdAt)
                              .utcOffset("+05:30")
                              .format("DD MMM YYYY")}
                          </span>
                        </div>
                        <div className="add--documents mt-1">
                          <Link
                            to={`/candidate/reqDocs/${course?._id}`}
                            className="btn btn-success text-white waves-effect waves-light"
                          >
                            Upload Documents
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <h4 className="text-center">No Course found</h4>
          )}
        </div>
      </section>
      <style>
        {`
      .job-overview h3{
      color:#2c2c2c;
      }
      .font-weight-bolder {
    font-weight: bolder !important;
}
     .btn{
  display: inline-block;
    font-weight: 400;
    color: #626262;
    text-align: center;
    vertical-align: middle;
    user-select: none;
    background-color: transparent;
    border: 0 solid transparent;
    padding: 0.9rem 2rem;
    font-size: 1rem;
    line-height: 1;
    border-radius: 0.4285rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
} 
    
.job-single-sec {
    float: left;
    width: 100%;
  }
  .job-single-head {
    float: left;
    width: 100%;
    display: table;
    display: block !important;
    width: 100% !important;
    overflow-wrap: break-word;
  }
  .job-overview {
    float: left;
    width: 100%;
  }
  .job-overview ul>li {
    position: relative;
    margin: 15px 0!important;
}
  .job-overview ul>li {
    float: left;
    width: 100%;
    margin: 0;
    position: relative;
    padding-left: 67px;
    margin: 15px 0;
}
  .job-overview ul {
    float: left;
    width: 100%;
    border: 2px solid #e8ecec;
    border-radius: 8px;
    margin: 0;
      margin-bottom: 0px;
    padding:15px !important;
    transition:.3s;
  }
  .job-single-sec .job-overview ul li {
    float: left;
    width: 32.334%;
    padding-left: 50px!important;
  }
  .job-single-sec .job-overview ul li i {
    left: 0;
  }
  .job-overview ul > li h3 {
    float: left;
    width: 100%;
    font-size: 13px;
    font-family: Open Sans;
    margin:
  0;
  }
  .job-overview ul > li span {
    float: left;
    width: 100%;
    font-size: 13px;
    color: #888888;
    margin-top: 7px;
  }
   .extra-job-info {
    float: left;
    width: calc(100% - 30px);
    margin-top: 30px;
  } 
.job-overview ul>li i {
  position: absolute;
  top: 5px;
  font-size: 30px;
  color: #FC2B5A;
}
.job-overview ul:hover {
  border-color: #FC2B5A;
  -webkit-box-shadow: 4px 4px 0px 0px rgba(241, 117, 37, 0.75);
  -moz-box-shadow: 4px 4px 0px 0px rgba(241, 117, 37, 0.75);
  box-shadow: 4px 4px 0px 0px rgba(241, 117, 37, 0.75);
  cursor: pointer;
}
.btn-success:hover {
  border-color: #24b263 !important;
  color: #fff !important;
  box-shadow: 0 8px 25px -8px #28c76f;
}
.set-lineh {
  overflow-wrap: break-word;
  /* white-space: inherit; */
  width: 100% !important;
  /* overflow: hidden !important; */
  /* text-overflow: clip; */
  padding: 2px !important;
}

@media(max-width:768px){
  .job-overview > ul{
display: flex;
flex-direction: column;
  }
  .job-single-sec .job-overview ul li{
    width: 100%!important;
  }
}

      `}
      </style>
    </>
  );
};

export default AppliedCourses;
