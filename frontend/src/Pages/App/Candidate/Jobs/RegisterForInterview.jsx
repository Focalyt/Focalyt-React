import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';


const RegisterForInterview = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  useEffect(() => {
    // Parse the URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const page = searchParams.get('page') || 1;

    // Fetch jobs data
    fetchInterviewJobs(page);
  }, [location.search]);

  const fetchInterviewJobs = async (page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // const response = await axios.get(`/candidate/registerInterview?page=${page}`, {
        const response = await axios.get(`${backendUrl}/candidate/registerInterviewsList?page=${page}`, {
        headers: { 'x-auth': token }
      });

      if (response.data) {
        setJobs(response.data.jobs || []);
        setPagination({
          page: parseInt(page),
          totalPages: response.data.totalPages || 0
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interview jobs:', error);
      setLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', pageNumber);

    // Update URL with new page number while preserving other query params
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  // Generate pagination links
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    let first = 1;
    let last = pagination.totalPages > 4 ? 4 : pagination.totalPages;

    if (pagination.totalPages > 4 && pagination.page >= 2) {
      first = pagination.page - 1;
      last = pagination.page + 1;
      if (last > pagination.totalPages) last = pagination.totalPages;
    }

    const pageLinks = [];

    // "First" link if needed
    if (first > 1) {
      pageLinks.push(
        <li key="first" className="page-item">
          <button
            className="page-link"
            onClick={() => handlePageChange(1)}
          >
            First
          </button>
        </li>
      );
    }

    // Page number links
    for (let i = first; i <= last; i++) {
      pageLinks.push(
        <li key={i} className={`page-item ${i === pagination.page ? 'active' : ''}`}>
          <button
            className={`page-link ${i === pagination.page ? 'pagi_custom' : 'pagi_customtwo'}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }

    // "..." and "Last" link if needed
    if (pagination.totalPages > last) {
      pageLinks.push(
        <li key="ellipsis" className="page-item">
          <button
            className="page-link"
            onClick={() => handlePageChange(last + 1)}
          >
            ...
          </button>
        </li>
      );
      pageLinks.push(
        <li key="last" className="page-item">
          <button
            className="page-link"
            onClick={() => handlePageChange(pagination.totalPages)}
          >
            Last
          </button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2 text-right">
        {pageLinks}
      </ul>
    );
  };

  // Helper function to get image URL
  const getCompanyLogoUrl = (job) => {
    if (job._company &&
      Array.isArray(job._company) &&
      job._company[0]?.logo) {
      return `${process.env.REACT_APP_BUCKET_URL}/${job._company[0].logo}`;
    }
    return '/Assets/images/logo90.png';
  };

  // Helper function to get company name
  const getCompanyName = (job) => {
    if (job._company &&
      Array.isArray(job._company) &&
      job._company[0]?.name) {
      return job._company[0].name;
    }
    return "NA";
  };

  // Helper function to get qualification name
  const getQualificationName = (job) => {
    if (job.qualifications &&
      Array.isArray(job.qualifications) &&
      job.qualifications[0]?.name) {
      return job.qualifications[0].name;
    }
    return "NA";
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "NA";
    return moment(dateString).utcOffset('+05:30').format('DD MMM YYYY');
  };

  // Helper function to get location string
  const getLocation = (job) => {
    if (job.city &&
      Array.isArray(job.city) &&
      job.city[0]?.name &&
      job.state &&
      Array.isArray(job.state) &&
      job.state[0]?.name) {
      return `${job.city[0].name}, ${job.state[0].name}`;
    }
    return "NA";
  };

  // Render job list
  const renderJobList = (isLargeScreen = true) => {
    if (loading) {
      return <div className="text-center">Loading jobs...</div>;
    }

    if (!jobs || jobs.length === 0) {
      return <h4 className="text-center">No Results found</h4>;
    }

    return jobs.map((job, index) => {
      if (!job.isRegisterInterview) return null;

      return (
        <React.Fragment key={job._id || index}>
          <div className="row pointer">
            <div className="col-lg-8 col-md-7 column">
              <div className="job-single-sec">
                <div className="job-single-head border-0 pb-0">
                  <div className="job-thumb my-auto">
                    <img src={getCompanyLogoUrl(job)} className="p-1" alt="Company Logo" />
                  </div>
                  <div className="job-head-info">
                    <h6 className="text-capitalize font-weight-bolder">
                      {job.vacancy && job.vacancy[0]?.title ? job.vacancy[0].title : "NA"}
                    </h6>
                    <span className="text-capitalize set-lineh">
                      {getCompanyName(job)}
                    </span>
                  </div>
                </div>
                <Link to={`/candidate/job/${job.vacancy && job.vacancy[0]?._id}`}>
                  <div className="job-overview mt-1">
                    <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                      <li className="jobdetails-li">
                        <i className="la la-thumb-tack"></i>
                        <h3 className="text-capitalize jobDetails-wrap">
                          {getQualificationName(job)}
                        </h3>
                        <span className="text-capitalize jobDetails-wrap">
                          Qualification / योग्यता
                        </span>
                      </li>
                      <li className="jobdetails-li">
                        <i className="la la-university"></i>
                        <h3 className="jobDetails-wrap">
                          {getCompanyName(job)}
                        </h3>
                        <span className="text-capitalize jobDetails-wrap">
                          Company Name / कंपनी का नाम
                        </span>
                      </li>
                      <li className="jobdetails-li">
                        <i className="la la-puzzle-piece"></i>
                        <h3 className="text-capitalize jobDetails-wrap">
                          {job.vacancy && job.vacancy[0] && job.vacancy[0].jobType ? job.vacancy[0].jobType : "NA"}
                        </h3>
                        <span className="text-capitalize jobDetails-wrap">
                          Job Type / नौकरी का प्रकार
                        </span>
                      </li>
                      <li className="jobdetails-li">
                        <i className="la la-building-o"></i>
                        <h3 className="jobDetails-wrap">
                          {job.industry && job.industry[0]?.name ? job.industry[0].name : "NA"}
                        </h3>
                        <span className="text-capitalize jobDetails-wrap">
                          Industry Name / उद्योग का नाम
                        </span>
                      </li>
                      <li className="jobdetails-li">
                        <i className="la la-shield"></i>
                        <h3 className="jobDetails-wrap">
                          {job.city && job.city[0]?.name ? job.city[0].name : "NA"}
                        </h3>
                        <span className="jobDetails-wrap">
                          City / शहर
                        </span>
                      </li>
                      <li className="jobdetails-li">
                        <i className="la la-line-chart"></i>
                        <h3 className="jobDetails-wrap">
                          {job.state && job.state[0]?.name ? job.state[0].name : "NA"}
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
            <div className={`col-lg-4 col-md-5 column ${isLargeScreen ? "mt-xl-4 mt-lg-5 mt-md-5 mt-sm-3 pt-xl-1 pt-lg-1 pt-md-1 pt-sm-0 pt-0" : "mt-xl-4 mt-lg-5 mt-md-5 mt-sm-3 mt-2"}`}>
              {/* Contact button for small screens */}
              {!isLargeScreen && job.vacancy && job.vacancy[0] && job.vacancy[0].isContact && job.vacancy[0].isContact.toString() === "true" && (
                <div className="row">
                  <div className="col-12 same-plane pr-0 pr-md-1 pr-sm-1">
                    <a
                      href={`tel:${job.vacancy[0].phoneNumberof}`}
                      className="apply-thisjob text-center py-1 px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100 same-plane call-btn"
                    >
                      <i className="la la-phone ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl plane-font"></i>
                      Call / कॉल
                    </a>
                  </div>
                </div>
              )}

              {/* Job Overview */}
              <div className="extra-job-info mt-1">
                <span>
                  <i className="la la-clock-o"></i><strong>Posted On</strong>
                  {job.vacancy && Array.isArray(job.vacancy) && job.vacancy[0]?.createdAt ?
                    formatDate(job.vacancy[0].createdAt) : "NA"}
                </span>
                <span>
                  <i className="la la-map"></i><strong>Location</strong>
                  {getLocation(job)}
                </span>
                <span>
                  <i className="fa fa-user text-primary"></i><strong>Status</strong>
                  {job.isRegisterInterview ? 'Register for Interview' : 'Not Registered'}
                </span>
              </div>
            </div>
          </div>
          <hr />
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Register for Interview</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Register for Interview</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-body">
        <div className="row">
          <div className="col-12">
            {/* Large screen view */}
            <section className="forlrgscreen d-xl-block d-lg-block d-md-block d-sm-none d-none">
              <div className="container-fluid pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                {renderJobList(true)}
              </div>
            </section>

            {/* Small screen view */}
            <section className="forsmallscrn d-xl-none d-lg-none d-md-none d-sm-block d-block">
              <div className="container-fluid pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                {renderJobList(false)}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {renderPagination()}



      <div className="sidenav-overlay"></div>
      <div className="drag-target"></div>

<style>
  {
    `
    .jobdetails-li {
    display: inline !important;
    color: #000;
}
    .job-single-sec {
    background-color: transparent;
}
    .text-primary {
color :#FC2B5A!important
  }
    `
  }
</style>
<style>
        {
          `
          .card .card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  border-bottom: none;
  padding: 1.5rem 1.5rem 0;
  background-color: transparent;
}

.card-header {
  padding: 1.5rem 1.5rem;
  margin-bottom: 0;
  background-color: rgba(34, 41, 47, 0.03);
  border-bottom: 1px solid rgba(34, 41, 47, 0.125);
}

.card-header:first-child {
  border-radius: calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0;
}

.fliter-block {
  display: block !important;
}

form #debt-amount-slider {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  position: relative;
  width: 100%;
  height: 50px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form #debt-amount-slider::before {
  content: " ";
  position: absolute;
  height: 2px;
  width: 100%;
  width: calc(100%*(4 / 5));
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #a39a9a;
}

form #debt-amount-slider input {
  display: none;
}

form #debt-amount-slider input,
form #debt-amount-slider label {
  box-sizing: border-box;
  flex: 1;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: pointer;
}

form #debt-amount-slider label {
  display: inline-block;
  position: relative;
  width: 20%;
  height: 100%;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form:valid #debt-amount-slider input+label::before {
  transform: translate(-50%, 40px) scale(0.8);
  transition: all 0.15s linear;
}

form #debt-amount-slider label::before {
  content: attr(data-debt-amount);
  position: absolute;
  left: 50%;
  padding-top: 10px;
  transform: translate(-50%, 40px);
  font-size: 14px;
  letter-spacing: 0.4px;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0.85;
  transition: all 0.15s ease-in-out;
}

form #debt-amount-slider label::after {
  content: " ";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #625c5c;
  background: #fff;
  border-radius: 50%;
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: 1;
  cursor: pointer;
  transition: all 0.15sease-in-out;
}
form #debt-amount-slider input:checked:nth-child(3) ~ #debt-amount-pos {
  left: 30%;
}
form #debt-amount-slider input:checked:nth-child(5) ~ #debt-amount-pos {
  left: 50%;
}
form #debt-amount-slider input:checked:nth-child(7) ~ #debt-amount-pos {
  left: 70%;
}

form #debt-amount-slider input:checked:nth-child(9)~#debt-amount-pos {
  left: 90%;
}

form #debt-amount-slider input:checked~#debt-amount-pos {
  opacity: 1;
}

form #debt-amount-slider #debt-amount-pos {
  display: block;
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #FC2B5A;
  border-radius: 50%;
  transition: all 0.15sease-in-out;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  opacity: 0;
  z-index: 2;
}

/* .card-body {
    flex: 1 1 auto;
    padding: 1.5rem;
} */
form:valid #debt-amount-slider input:checked+label::before {
  color: #FC2B5A;
  transform: translate(-50%, 40px) scale(1.1);
  transition: all 0.15slinear;
}

form #debt-amount-slider input:checked+label::before {
  font-weight: 800;
  opacity: 1;
}

form #debt-amount-slider input:checked:nth-child(1)~#debt-amount-pos {
  left: 10%;
}

.searchjobspage .card {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1rem;
}

.fliter-block {
  background-color: #fff;
  border-bottom: 1px solid #dfe3e7;
}

.filterSearchJob {
  margin-bottom: 1rem;
}

.filterSearchJob label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Course/Job Card Styles */
.course_nw {
  margin-top: 1rem;
}

.cr_nw_in {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cr_nw_in:hover {
  transform: translateY(-5px);
}

.video_thum {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.course_inf {
  padding: 1rem;
}

.course_inf h5 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.job_cate {
  color: #6e6b7b;
  display: block;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.curs_description span.job_cate {
  background: #1b95391a;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: #1b9539;
  border: solid 1px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: inline;
}
.course_spec {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.spe_icon {
  background-color: rgba(115, 103, 240, 0.1);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.spe_icon i {
  color: #7367f0;
  font-size: 1.5rem;
}

.spe_detail h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.spe_detail span {
  color: #6e6b7b;
  font-size: 0.8rem;
}

.jobDetails-wrap {
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Job action buttons */
.act_btn {
  margin-top: 1rem;
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
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 0.5rem;
}

.call-btn {
  background-color: #1b9539 !important;
  border:
    2px solid #1b9539 !important;
}

.call-btn:hover {
  color: #1b9539 !important;
  border: 2px solid #1b9539 !important;
  background-color: #fff !important;
}

.act_btn .apply-thisjob {
  width: 100% !important;
  margin-bottom: 0px;
  text-align: center !important;
}

@media only screen and (max-width: 1400px) {
  .act_btn .apply-thisjob {
    padding:
      7px !important;
    font-size: 11px;
  }

  .act_btn .apply-thisjob i {
    font-size: 18px;
    top: 2px;
    margin-right: 3px;
  }
}

.call-btn:hover {
  background-color: #24b263;
}

.same-plane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.plane-font {
  font-size: 1.2rem;
}

/* Map section styles */
.map {
  margin-top: 1rem;
}

#map {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
}

/* Distance slider styles */
#debt-amount-slider {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  margin-top: 1rem;
}

#debt-amount-slider input[type="radio"] {
  position: absolute;
  opacity: 0;
}

#debt-amount-slider label {
  cursor: pointer;
  position: relative;
  display: block;
  width: 20%;
  height: 100%;
  text-align: center;
}

#debt-amount-slider label:after {
  content: attr(data-debt-amount);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #6e6b7b;
}

#debt-amount-slider label:before {
  content: '';
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  /* background-color: #ddd; */
  transition: background-color 0.3s ease;
}

/* #debt-amount-slider input[type="radio"]:checked+label:before {
  background-color: #7367f0;
} */

#debt-amount-pos {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background-color: #7367f0;
  pointer-events: none;
  transition: width 0.2s ease, left 0.2s ease;
}

/* Pagination styles */
.pagination {
  margin-top: 1rem;
}

.page-link {
  color: #7367f0;
  border-radius: 4px;
  margin: 0 2px;
}

.page-item.active .page-link {
  background-color: #7367f0;
  border-color: #7367f0;
}

.pagi_custom {
  background-color: #7367f0;
  color: #fff;
}

.pagi_customtwo:hover {
  background-color: rgba(115, 103, 240, 0.1);
}

/* Responsive styles */
@media (max-width: 768px) {
  .content-header {
    display: none;
  }

  .searchjobspage .card-body {
    padding: 0.75rem;
  }

  .forsmallscrn {
    display: block !important;
  }

  .forlrgscreen {
    display: none;
  }

  .cr_nw_in {
    margin-bottom: 1rem;
  }

  .act_btn .col-xl-6 {
    margin-bottom: 0.5rem;
  }
}

/* Modal styles */
.modal-content {
  border-radius: 8px;
  /* overflow: hidden; */
}

.modal-header {
  background-color: #7367f0;
  color: #fff;
}

.modal-title {
  font-weight: 600;
}

.close {
  color: #fff;
}

.btn-primary {
  background-color: #7367f0;
  border-color: #7367f0;
}

.btn-primary:hover {
  background-color: #5e50ee;
  border-color: #5e50ee;
}

/* Job Details Styles */

/* Rating Star Styles */
label.review {
  display: block;
}

input.star {
  display: none;
}

label.star {
  float: right;
  padding: 10px;
  font-size: 30px !important;
  color: #444;
  transition: all .2s;
}

input.star:hover ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star:checked ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star-5:hover ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

input.star-5:checked ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

label.star:hover {
  transform: rotate(-15deg) scale(1.3);
}

label.star:before {
  content: '\f006';
  font-family: FontAwesome;
}

input.star:checked ~ .rev-box {
  height: 125px;
  overflow: visible;
}

/* Job Details Specific Styles */
.course_dtl {
  margin-bottom: 20px;
}

.curs_description h4 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
}

.job_cate {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
  display: block;
}

.course_spec {
  display: flex;
  margin-top: 25px;
}

.spe_icon {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.spe_detail h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 0;
}

.jobDetails-wrap {
  margin-bottom: 5px;
}

.job-single-sec {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px 0;
}

.job-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 15px;
}
.v_pal img {
  border-radius: 8px;
}
.course_dtl h6 {
  font-size: 17px;
  font-weight: 600;
  margin-top: 35px;
}
.apply-thisjob {
  background-color: #FC2B5A;
  color: #fff;
  border-radius: 5px;
  padding: 12px 20px;
  font-weight: 500;
  display: inline-block;
  text-decoration: none !important;
  transition: background-color 0.3s;
  margin-bottom: 10px;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 8px;
}

.disabled-button {
  background-color: #888;
  cursor: not-allowed;
}

.disabled-button:hover {
  background-color: #888;
  border: 2px solid#888;
  color: #fff!important;
}

.call-btn {
  background-color: #28a745;
}

.call-btn:hover {
  background-color: #218838;
}

.rebase-job {
  background-color: #17a2b8;
}

.rebase-job:hover {
  background-color: #138496;
  border: 2px solid #138496;
  color: #fff!important;
}
.btn{
  border: 1px solid #FC2B5A!important;
}

.rebase-job.disabled {
  background-color: #888;
  cursor: not-allowed;
  border: 1px solid #888;
}

.extra-job-info {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.extra-job-info span {
  display: block;
  margin-bottom: 10px;
  color: #666;
}

.extra-job-info strong {
  display: inline-block;
  margin-right: 5px;
  color: #333;
  min-width: 150px;
}

.extra-job-info i {
  margin-right: 8px;
  color: #FC2B5A;
}

/* Course Card Styles */
.pointer {
  cursor: pointer;
}

.job-overview {
  margin-bottom: 20px;
}

.job-overview h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.job-overview ul li {
  display: flex;
  margin-bottom: 15px;
}

.job-overview ul li i {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.custom_sty {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

/* Media Gallery Styles */
.carousel-gallery {
  position: relative;
  margin-bottom: 30px;
}

.swiper-wrapper {
  display: flex;
}

.swiper-slide {
  width: 33.333%;
  transition: 0.3s;
}

.swiper-slide .image {
  width: 100%;
  height: 200px;
  border-radius: 5px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.swiper-slide .image .overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
}

.swiper-slide .image .overlay em {
  color: #fff;
  font-size: 24px;
}

.swiper-slide:hover .image .overlay {
  opacity: 1;
}

.swiper-pagination {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.swiper-pagination-bullet {
  width: 10px;
  height: 10px;
  background: #ccc;
  margin: 0 5px;
  border-radius: 50%;
  cursor: pointer;
}

.swiper-pagination-bullet-active {
  background: #FC2B5A;
}

/* Video Gallery Styles */
.position-relative {
  position: relative;
}

.play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.pluscenter .pulse {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: pulse 1.5s infinite;
}

.uplay {
  width: 30px;
  height: 30px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal Styles */
.modal-content {
  border-radius: 5px;
  overflow: hidden;
}

.modal-header {
  background-color: #FC2B5A;
  color: #fff;
  border-bottom: none;
}

.modal-title {
  font-weight: 600;
}

.modal-header .close {
  color: #fff;
  opacity: 0.8;
}

.modal-header .close:hover {
  opacity: 1;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  border-top: none;
  padding: 15px 20px;
}

.vchr_header {
  background-color: #6f42c1;
}

.mode-dice {
  background-color: #532e92;
  color: #fff;
}

.coupon-text {
  font-size: 16px;
  padding: 0 15px;
}

.voucher-btn {
  background-color: #28a745;
  color: #fff;
  border: none;
}

.voucher-btn.disabled {
  background-color: #888;
  cursor: not-allowed;
}

.button-vchr {
  background-color: #6f42c1;
  color: #fff;
  border: none;
}

.button-vchr:hover {
  background-color: #5e37a6;
  color: #fff;
}

.review-border .modal-header {
  background-color: #28a745;
}

.inner-border {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  padding: 10px;
}

.popup-bg {
  background-color: rgba(255, 255, 255, 0.1);
}

.radio-size {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.modal{
  background-color: rgba(0,0,0,0.5);
  }
  .job-thumb {
    display: table-cell;
    vertical-align: top;
    width: 107px;
}
.job-thumb img {
  float: left;
  width: 100%;
  border: 2px solid #e8ecec;
  border-radius: 8px;
}
@media (max-width: 767px) {
  .swiper-slide {
    width: 50%;
  }
  
  .viewjob-apply {
    margin-top: 20px;
  }
  
  .spe_icon {
    font-size: 20px;
    width: 30px;
  }
  
  .extra-job-info strong {
    min-width: auto;
    margin-bottom: 5px;
    display: block;
  }
}

@media (max-width: 575px) {
  .swiper-slide {
    width: 100%;
  }
  
  .course_spec {
    flex-direction: column;
  }
  
  .spe_icon {
    margin-bottom: 5px;
  }
  
  .job-overview ul li {
    flex-direction: column;
  }
  
  .job-overview ul li i {
    margin-bottom: 5px;
  }
}
  .breadcrumb-item a {
    color: #FC2B5A;
        }
          `
        }
      </style>
    </>
  );
};

export default RegisterForInterview;