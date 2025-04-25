import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import './CandidateJobs.css';


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
    </>
  );
};

export default RegisterForInterview;