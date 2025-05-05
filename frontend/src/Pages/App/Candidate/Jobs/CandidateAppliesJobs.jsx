// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";
// import moment from "moment";
// // import "./AppliedJobs.css";

// const CandidateAppliedJobs = () => {
//   const [jobs, setJobs] = useState([]);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

//   useEffect(() => {
//     fetchAppliedJobs();
//   }, [page]);

//   const fetchAppliedJobs = async () => {
//     try {
//       const response = await axios.get(`${backendUrl}/candidate/appliedJobs`, {
//         params: { page },
//         headers: {
//           'x-auth': localStorage.getItem('token') // या जो भी auth token हो
//         }
//       });

//       setJobs(response.data.jobs || []);
//       setTotalPages(response.data.totalPages || 1);
//     } catch (error) {
//       console.error("Error fetching applied jobs:", error);
//     }
//   };

//   return (
//     <div className="container mt-3">
//       <h3 className="text-center">Applied Jobs</h3>

//       <section className="applied-jobs mt-3">
//         <div className="row">
//           {jobs.length > 0 ? (
//             jobs.map((job, index) => {
//               const vacancy = job.vacancy?.[0] || {};
//               const company = job._company?.[0] || {};
//               const industry = job.industry?.[0] || {};
//               const city = job.city?.[0] || {};
//               const state = job.state?.[0] || {};
//               const qualification = job.qualifications?.[0] || {};

//               return (
//                 <div className="col-md-6" key={index}>
//                   <div className="card job-card mb-3">
//                     <div className="card-body">
//                       <div className="d-flex align-items-center">
//                         <img
//                           src={
//                             company.logo
//                               ? `${process.env.REACT_APP_MIPIE_BUCKET_URL}/${company.logo}`
//                         : "/images/logo90.png"
//                           }
//                         alt="Company Logo"
//                         className="job-logo"
//                         />
//                         <div className="ml-3">
//                           <h6 className="font-weight-bold">{vacancy.title || "NA"}</h6>
//                           <span className="text-muted">{company.name || "NA"}</span>
//                         </div>
//                       </div>

//                       <Link to={`/candidate/job/${vacancy._id}`}>
//                       <div className="job-details mt-2">
//                         <ul className="list-unstyled">
//                           <li>
//                             <i className="la la-thumb-tack"></i> {qualification.name || "NA"}
//                             <span> Qualification</span>
//                           </li>
//                           <li>
//                             <i className="la la-university"></i> {company.name || "NA"}
//                             <span> Company Name</span>
//                           </li>
//                           <li>
//                             <i className="la la-puzzle-piece"></i> {vacancy.jobType || "NA"}
//                             <span> Job Type</span>
//                           </li>
//                           <li>
//                             <i className="la la-building-o"></i> {industry.name || "NA"}
//                             <span> Industry</span>
//                           </li>
//                           <li>
//                             <i className="la la-map"></i> {city.name || "NA"}, {state.name || "NA"}
//                             <span> Location</span>
//                           </li>
//                           <li>
//                             <i className="la la-clock-o"></i>{" "}
//                             {moment(vacancy.createdAt).utcOffset("+05:30").format("DD MMM YYYY")}
//                             <span> Posted On</span>
//                           </li>
//                         </ul>
//                       </div>
//                     </Link>

//                     {vacancy.isContact === true && vacancy.phoneNumberof && (
//                       <div className="mt-2">
//                         <a href={`tel:${vacancy.phoneNumberof}`} className="btn btn-primary">
//                         <i className="la la-phone"></i> Call Now
//                       </a>
//                         </div>
//                       )}
//                 </div>
//                   </div>
//     </div>
//   );
// })
//           ) : (
//   <h4 className="text-center w-100">No Applied Jobs Found</h4>
// )}
//         </div >
//       </section >

//   {/* Pagination */ }
// {
//   totalPages > 1 && (
//     <nav className="mt-4">
//       <ul className="pagination justify-content-center">
//         {Array.from({ length: totalPages }).map((_, index) => (
//           <li key={index} className={`page-item  ${page === index + 1 ? "active" : ""}`}>
//         <button className="page-link" onClick={() => setPage(index + 1)}>
//           {index + 1}
//         </button>
//       </li>
//             ))}
//     </ul>
//         </nav >
//       )
// }
//     </div >
//   );
// };

// export default CandidateAppliedJobs;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import moment from 'moment';


const AppliedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  useEffect(() => {
    fetchAppliedJobs();
  }, [page]);

  const fetchAppliedJobs = async () => {
    try {
      const response = await axios.get(`${backendUrl}/candidate/appliedJobs`, {
        params: { page },
        headers: {
          'x-auth': localStorage.getItem('token')
        }
      });
      console.log('response', response)

      setJobs(response.data.jobs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
  };

  // Generate pagination items
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && page >= 2) {
      first = page - 1;
      last = page + 1;
      if (last > totalPages) last = totalPages;
    }

    const paginationItems = [];

    if (first > 1) {
      paginationItems.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>First</button>
        </li>
      );
    }

    for (let i = first; i <= last; i++) {
      paginationItems.push(
        <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
          <button
            className={`page-link ${i === page ? 'pagi_custom' : 'pagi_customtwo'}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }

    if (totalPages > last) {
      paginationItems.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(last + 1)}>...</button>
        </li>
      );
      paginationItems.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2 text-right">
        {paginationItems}
      </ul>
    );
  };

  return (
    <>

      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Applied Jobs</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Applied Jobs</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-body">
        <div className="row">
          <div className="col-12">
            {/* For large screens */}
            <section className="forlrgscreen">
              <div className="container-fluid pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                {jobs && jobs.length > 0 ? (
                  jobs.map((job, index) => {
                    const vacancy = job.vacancy || {};
                    const company = job._company || {};
                    const industry = job.industry?.[0] || {};
                    const city = job.city?.[0] || {};
                    const state = job.state?.[0] || {};
                    const qualification = job.qualifications?.[0] || {};

                    return (
                      <React.Fragment key={index}>
                        <div className="row pointer">
                          <div className="col-lg-8 col-md-7 column">
                            <div className="job-single-sec" style={{backgroundColor: 'transparent!important'}}>
                              <div className="job-single-head border-0 pb-0">
                                <div className="job-thumb my-auto">
                                  <img
                                    src={company.logo ? `${process.env.REACT_APP_MIPIE_BUCKET_URL}/${company.logo}` : '/Assets/images/logo90.png'}
                                    className="p-1"
                                    alt="Company Logo"
                                  />
                                </div>
                                <div>
                                  <h6 className="text-capitalize font-weight-bolder">
                                    {!vacancy.title ? "NA" : vacancy.title}
                                  </h6>
                                  <span className="text-capitalize set-lineh">
                                    {!company.name ? "NA" : company.name}
                                  </span>
                                </div>
                              </div>
                              <Link to={`/candidate/job/${vacancy._id}`} className='smallScreen'>
                                <div className="job-overview mt-1">
                                  <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                                    <li className="jobdetails-li">
                                      <i className="la la-thumb-tack"></i>
                                      <h3 className="text-capitalize jobDetails-wrap">
                                        {!qualification.name ? "NA" : qualification.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Qualification / योग्यता
                                      </span>
                                    </li>
                                    <li className="jobdetails-li">
                                      <i className="la la-university"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!company.name ? "NA" : company.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Company Name / कंपनी का नाम
                                      </span>
                                    </li>
                                    <li className="jobdetails-li">
                                      <i className="la la-puzzle-piece"></i>
                                      <h3 className="text-capitalize jobDetails-wrap">
                                        {!vacancy.jobType ? "NA" : vacancy.jobType}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Job Type / नौकरी का प्रकार
                                      </span>
                                    </li>
                                    <li className="jobdetails-li">
                                      <i className="la la-building-o"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!industry.name ? "NA" : industry.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Industry Name / उद्योग का नाम
                                      </span>
                                    </li>
                                    <li className="jobdetails-li">
                                      <i className="la la-shield"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!city.name ? "NA" : city.name}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        City / शहर
                                      </span>
                                    </li>
                                    <li className="jobdetails-li">
                                      <i className="la la-line-chart"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!state.name ? "NA" : state.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        State / राज्य
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </Link>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-5 column mt-xl-4 mt-lg-5 mt-md-5 mt-sm-3 pt-xl-1 pt-lg-1 pt-md-1 pt-sm-0 pt-0">
                            <div className="extra-job-info mt-1">
                              <span>
                                <i className="la la-clock-o"></i>
                                <strong>Posted On</strong>{" "}
                                {moment(vacancy.createdAt).utcOffset('+05:30').format('DD MMM YYYY')}
                              </span>
                              <span>
                                <i className="la la-map"></i>
                                <strong>Location</strong>{" "}
                                {city.name}, {state.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <hr />
                      </React.Fragment>
                    );
                  })
                ) : (
                  <h4 className="text-center">No Results found</h4>
                )}
              </div>
            </section>

            {/* For small screens */}
            <section className="forsmallscrn d-xl-none d-lg-none d-md-none d-sm-block d-block">
              <div className="container-fluid pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                {jobs && jobs.length > 0 ? (
                  jobs.map((job, index) => {
                    const vacancy = job.vacancy || {};
                    const company = job._company || {};
                    const industry = job.industry?.[0] || {};
                    const city = job.city?.[0] || {};
                    const state = job.state?.[0] || {};
                    const qualification = job.qualifications?.[0] || {};

                    return (
                      <React.Fragment key={`mobile-${index}`}>
                        <div className="row pointer">
                          <div className="col-lg-8 col-md-7 column">
                            <div className="job-single-sec new-job-single-sec" style={{background: 'transparent'}}>
                              <div className="job-single-head border-0 pb-0">
                                <div className="job-thumb my-auto">
                                  <img
                                    src={company.logo ? `${process.env.REACT_APP_MIPIE_BUCKET_URL}/${company.logo}` : '/Assets/images/logo90.png'}
                                    className="p-1"
                                    alt="Company Logo"
                                  />
                                </div>
                                <div className="">
                                  <h6 className="text-capitalize font-weight-bolder">
                                  {!vacancy.title ? "NA" : vacancy.title}
                                  </h6>
                                  <span className="text-capitalize set-lineh">
                                  {!company.name ? "NA" : company.name}
                                  </span>
                                </div>
                              </div>
                              <Link to={`/candidate/job/${vacancy._id}`}>
                                <div className="job-overview mt-1">
                                  <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                                    <li className="">
                                      <i className="la la-thumb-tack"></i>
                                      <h3 className="text-capitalize jobDetails-wrap">
                                        {!qualification.name ? "NA" : qualification.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Qualification / योग्यता
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-university"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!company.name ? "NA" : company.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Company Name / कंपनी का नाम
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-puzzle-piece"></i>
                                      <h3 className="text-capitalize jobDetails-wrap">
                                        {!vacancy.jobType ? "NA" : vacancy.jobType}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Job Type / नौकरी का प्रकार
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-building-o"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!industry.name ? "NA" : industry.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Industry Name / उद्योग का नाम
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-shield"></i>
                                      <h3 className="jobDetails-wrap">
                                        {!city.name ? "NA" : city.name}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        City / शहर
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-line-chart"></i>
                                      <h3 className="jobDetails-wrap text-black">
                                        {!state.name ? "NA" : state.name}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        State / राज्य
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </Link>
                            </div>
                          </div>

                          {vacancy.isContact === true && vacancy.phoneNumberof && (
                            <div className="col-lg-4 col-md-5 column mt-xl-1 mt-lg-1 mt-md-1 mt-sm-1 mt-0">
                              <div className="row">
                                <div className="col-12 same-plane pr-0 pr-md-1 pr-sm-1">
                                  <a
                                    href={`tel:${vacancy.phoneNumberof}`}
                                    className="apply-thisjob text-center py-1 px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100 same-plane call-btn"
                                    title=""
                                  >
                                    <i className="la la-phone ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl plane-font"></i>
                                    Call / कॉल
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="extra-job-info mt-1">
                            <span>
                              <i className="la la-clock-o"></i>
                              <strong>Posted On</strong>{" "}
                              {moment(vacancy.createdAt).utcOffset('+05:30').format('DD MMM YYYY')}
                            </span>
                            <span>
                              <i className="la la-map"></i>
                              <strong>Location</strong>{" "}
                              {city.name}, {state.name}
                            </span>
                          </div>
                        </div>
                        <hr />
                      </React.Fragment>
                    );
                  })
                ) : (
                  <h4 className="text-center">No Results found</h4>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {renderPagination()}


      <style>
        {
          `
          .jobdetails-li{
          display: inline!important;
          color:#000;
          }
          .job-thumb{   display: table-cell;
    vertical-align: top;
    width: 107px;
}
    .job-thumb img {
    float: left;
    width: 100%;
    border: 2px solid #e8ecec;
    border-radius: 8px;
}
    .job-single-sec{
    background-color:transparent;
    }
@media(max-width:768px){
.smallScreen{
width:100%;
}
}

          `
        }
      </style>




    </>
  );
};

export default AppliedJobs;