import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';


const Shortlisting = () => {
  const [hiringStatus, setHiringStatus] = useState([]);
  const [cities, setCities] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse the URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const page = parseInt(searchParams.get('page')) || 1;

    // Fetch shortlisting data
    fetchShortlistingData(page);
  }, [location.search]);

  const fetchShortlistingData = async (page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/candidate/shortlisting?page=${page}`, {
        headers: { 'x-auth': token }
      });

      if (response.data) {
        setHiringStatus(response.data.hiringStatus || []);
        setCities(response.data.cities || []);
        setPagination({
          page: page,
          totalPages: response.data.totalPages || 0
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shortlisting data:', error);
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

  // Helper function to get company logo URL
  const getCompanyLogoUrl = (hiring) => {
    if (hiring.company?.logo) {
      return `${process.env.REACT_APP_BUCKET_URL}/${hiring.company.logo}`;
    }
    return '/Assets/images/logo90.png';
  };

  // Helper function to get company name
  const getCompanyName = (hiring) => {
    return hiring.company ? hiring.company.name : "NA";
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "NA";
    return moment(dateString).utcOffset('+05:30').format('MMM DD YYYY hh:mm A');
  };

  // Helper function to get city name
  const getCityName = (hiring) => {
    if (hiring.company?.cityId && cities.length > 0) {
      const city = cities.find(city => city._id === hiring.company.cityId);
      return city?.name || "NA";
    }
    return "NA";
  };

  // Render hiring status list
  const renderHiringStatusList = (isLargeScreen = true) => {
    if (loading) {
      return <div className="text-center">Loading data...</div>;
    }

    if (!hiringStatus || hiringStatus.length === 0) {
      return <h4 className="text-center">No Results found</h4>;
    }

    return hiringStatus.map((hiring, index) => (
      <React.Fragment key={hiring._id || index}>
        <div className="row pointer">
          <div className={`col-lg-12 col-md-12 column ${isLargeScreen ? 'py-2' : ''}`}>
            <div className="job-single-sec">
              <div className="job-single-head border-0 pb-0">
                <div className="job-thumb my-auto">
                  <img
                    src={getCompanyLogoUrl(hiring)}
                    className="p-1"
                    alt="Company Logo"
                  />
                </div>
                <div className="job-head-info">
                  <span className="text-capitalize set-lineh">
                    {getCompanyName(hiring)}
                  </span>
                </div>
              </div>
              <div className="job-overview mt-1">
                <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                  <li className="">
                    <i className="la la-thumb-tack"></i>
                    <h3 className="text-capitalize jobDetails-wrap">
                      {formatDate(hiring.updatedAt)}
                    </h3>
                    <span className="text-capitalize jobDetails-wrap">
                      Date & Time / दिनांक
                    </span>
                  </li>
                  <li>
                    <i className="la la-university"></i>
                    <h3 className="jobDetails-wrap">
                      {getCompanyName(hiring)}
                    </h3>
                    <span className="text-capitalize jobDetails-wrap">
                      Company / कंपनी
                    </span>
                  </li>
                  <li>
                    <i className="la la-building-o"></i>
                    <h3 className="jobDetails-wrap">
                      {hiring.company?._industry ? hiring.company._industry.name : "NA"}
                    </h3>
                    <span className="text-capitalize jobDetails-wrap">
                      Industry Name / उद्योग का नाम
                    </span>
                  </li>
                  <li>
                    <i className="la la-shield"></i>
                    <h3 className="jobDetails-wrap">
                      {getCityName(hiring)}
                    </h3>
                    <span className="jobDetails-wrap">
                      City / शहर
                    </span>
                  </li>
                  <li>
                    <i className="la la-puzzle-piece"></i>
                    <h3 className="jobDetails-wrap">
                      {hiring?.status || "NA"}
                    </h3>
                    <span className="jobDetails-wrap">
                      Status / स्थति
                    </span>
                  </li>
                  <li>
                    <i className="la la-weixin"></i>
                    <h3 className="jobDetails-wrap">
                      {hiring?.comment || "NA"}
                    </h3>
                    <span className="jobDetails-wrap">
                      Comments / टिप्पणी
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {!isLargeScreen && <hr />}
      </React.Fragment>
    ));
  };

  return (
    <>

      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Shortlisting</h3>
              <div className="breadcrumb-wrapper col-12">
               
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Shortlisting / शॉर्टलिस्टइंग</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="row">
            <div className="col-12">
              {/* Large screen view */}
              <section className="forlrgscreen d-xl-block d-lg-block d-md-block d-sm-none d-none">
                <div className="container-fluid pt-xl-0 pt-lg-0 pt-md-0 pt-sm-2 pt-0">
                  {renderHiringStatusList(true)}
                </div>
              </section>

              {/* Small screen view */}
              <section className="forsmallscrn d-xl-none d-lg-none d-md-none d-sm-block d-block">
                <div className="container-fluid pt-xl-2 pt-lg-0 pt-md-0 pt-sm-2 pt-2">
                  {renderHiringStatusList(false)}
                </div>
              </section>
            </div>
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
          .breadcrumb-item a {
            color: #FC2B5A;
          }
            `
        }
      </style>

    </>
  );
};

export default Shortlisting;