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
          <div className="forlrgscreen pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
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
                              <div className="job-overview mt-1">
                                <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                                  <li>
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
                                  <li>
                                    <i className="la la-shield"></i>
                                    <h3 className="jobDetails-wrap">
                                      {course?.courseLevel || "N/A"}
                                    </h3>
                                    <span className="jobDetails-wrap">Course Level</span>
                                  </li>
                                  <li>
                                    <i className="la la-graduation-cap"></i>
                                    <h3 className="jobDetails-wrap">
                                      {course?.certifyingAgency || "N/A"}
                                    </h3>
                                    <span className="jobDetails-wrap">Course Agency</span>
                                  </li>
                                  <li>
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
    
    </>
  );
};

export default AppliedCourses;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import moment from "moment";
// import { Link } from "react-router-dom";
// import "./AppliedCourses.css";
// const AppliedCourses = () => {
//   const [courses, setCourses] = useState([]);

//   useEffect(() => {
//     fetchAppliedCourses();
//   }, []);

//   const fetchAppliedCourses = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get("/candidate/appliedCourses", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       setCourses(res.data?.courses || []);
//     } catch (err) {
//       console.error("Error fetching applied courses:", err);
//     }
//   };

//   return (
//     <>
//       <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
//         <div className="content-header-left col-md-9 col-12 mb-2">
//           <div className="row breadcrumbs-top">
//             <div className="col-12 my-auto">
//               <h3 className="content-header-title float-left mb-0">Applied Courses</h3>
//               <div className="breadcrumb-wrapper col-12">
//                 <ol className="breadcrumb">
//                   <li className="breadcrumb-item">
//                     <Link to="/candidate/dashboard">Home</Link>
//                   </li>
//                   <li className="breadcrumb-item active">Applied Courses</li>
//                 </ol>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <section id="searchCourses" className="mb-2">
//         <div className="container">
//           <ul className="nav nav-tabs justify-content-center d-md-none d-sm-block" role="tablist">
//             <li className="nav-item" role="presentation">
//               <Link className="nav-link" to="/candidate/searchcourses">Search Courses</Link>
//             </li>
//             <li className="nav-item" role="presentation">
//               <Link className="nav-link" to="/candidate/pendingFee">Pending for Fee</Link>
//             </li>
//             <li className="nav-item" role="presentation">
//               <Link className="nav-link active" to="/candidate/appliedCourses">Applied Courses</Link>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <section className="searchjobspage">
//         <div className="forlrgscreen pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">

//           {/* 
//           {courses && courses.length > 0 ? (
//             courses.map((appliedCourse, index) => {
//               const course = appliedCourse._course;
//               return (
//                 // repeatable UI block here
//               );
//             })
//           ) : (
//             <h4 className="text-center">No Course found</h4>
//           )}
//           */}

//           {/* Static Dummy Card for Preview */}
//           <div className="card">
//             <div className="card-body">
//               <div className="row pointer">
//                 <div className="col-lg-8 col-md-7 column">
//                   <div className="job-single-sec mt-xl-0">
//                     <div className="job-single-head border-0 pb-0">
//                       <div>
//                         <h6 className="text-capitalize font-weight-bolder">Akash</h6>
//                         <span className="text-capitalize set-lineh">Aviation</span>
//                       </div>
//                     </div>
//                     {/* <Link to="#">
//                       <div className="job-overview mt-1">
//                         <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
//                           <li>
//                             <i className="la la-money"></i>
//                             <h3 className="jobDetails-wrap">Free</h3>
//                             <span className="jobDetails-wrap">Course Fee</span>
//                           </li>
//                           <li>
//                             <i className="la la-shield"></i>
//                             <h3 className="jobDetails-wrap">Beginner</h3>
//                             <span className="jobDetails-wrap">Course Level</span>
//                           </li>
//                           <li>
//                             <i className="la la-graduation-cap"></i>
//                             <h3 className="jobDetails-wrap">NSDC</h3>
//                             <span className="jobDetails-wrap">Course Agency</span>
//                           </li>
//                           <li>
//                             <i className="la la-money"></i>
//                             <h3 className="jobDetails-wrap">Paid</h3>
//                             <span className="jobDetails-wrap">Registration Status</span>
//                           </li>
//                         </ul>
//                       </div>
//                     </Link> */}

//                     <div class="job-overview mt-1">
//                                       <ul class="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
//                                         <li><i class="la la-money"></i>
//                                           <h3 class="jobDetails-wrap">
//                                             N/A
//                                           </h3>

//                                           <span class="text-capitalize jobDetails-wrap">
//                                             Course Fee
//                                           </span>
//                                         </li>
//                                         <li><i class="la la-shield"></i>
//                                           <h3 class="jobDetails-wrap">
//                                             Certificate
//                                           </h3>

//                                           <span class="jobDetails-wrap">
//                                             Course Level
//                                           </span>
//                                         </li>
//                                         <li><i class="la la-graduation-cap"></i>
//                                           <h3 class="jobDetails-wrap">
//                                             N/A
//                                               <span class="jobDetails-wrap">
//                                                 Course Agency
//                                               </span>
//                                         </h3></li>
//                                         <li><i class="la la-money"></i>
//                                           <h3 class="jobDetails-wrap">
//                                             Unpaid
//                                               <span class="jobDetails-wrap">
//                                                 Registration Status
//                                               </span>
//                                         </h3></li>
//                                       </ul>
//                                     </div>
//                   </div>
//                 </div>
//                 <div className="col-lg-4 col-md-5 column mt-xl-1 mt-lg-1 mt-md-1 mt-sm-3 mt-0">
//                   <div className="extra-job-info mt-1">
//                     <span className="px-0">
//                       <i className="la la-map"></i>
//                       <strong>Last Date</strong> {moment().add(5, 'days').format("DD MMM YYYY")}
//                     </span>
//                   </div>
//                   <div className="add--documents mt-1">
//                     <Link to="#" className="btn btn-success text-white waves-effect waves-light">
//                       Upload Documents
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//         </div>
//       </section>
//     </>
//   );
// };

// export default AppliedCourses;