import React, { useState, useEffect } from 'react';

const AllJd = () => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State management
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shortlistedCounts, setShortlistedCounts] = useState([]);
  const [companyData, setCompanyData] = useState({});
  const [canAdd, setCanAdd] = useState(true);
  const [isExist, setIsExist] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load jobs data
  useEffect(() => {
    loadJobsData(currentPage);
  }, [currentPage]);

  const loadJobsData = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'x-auth': token };

      // Fetch jobs data
      const response = await fetch(`${backendUrl}/company/jobs?page=${page}`, {
        headers
      });
      const data = await response.json();

      if (data.success) {
        setJobs(data.jd || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
        setShortlistedCounts(data.shortlistedCandCount || []);
        setCompanyData(data.company || {});
        setCanAdd(data.canAdd !== undefined ? data.canAdd : true);
        setIsExist(data.isExist !== undefined ? data.isExist : true);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle job status
  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const headers = { 
        'x-auth': localStorage.getItem('token'),
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${backendUrl}/company/changeStatus`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: jobId, status: newStatus })
      });

      if (response.ok) {
        // Reload the page data
        loadJobsData(currentPage);
      }
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
  };

  // Check if job is expired
  const isJobExpired = (validityDate) => {
    const today = new Date();
    const validity = new Date(validityDate);
    today.setHours(0, 0, 0, 0);
    validity.setHours(0, 0, 0, 0);
    return validity < today;
  };

  // Get shortlisted count for a job
  const getShortlistedCount = (jobId) => {
    const count = shortlistedCounts.find(elem => 
      elem._id?.job?.toString() === jobId?.toString()
    );
    return count?.count || '0';
  };

  // Handle add job click
  const handleAddJobClick = () => {
    if (canAdd && isExist) {
      window.location.href = '/company/addjobs';
    } else if (!canAdd && isExist) {
      setShowProfileModal(true);
    }
  };

  // Handle copy job click
  const handleCopyJobClick = (jobId) => {
    if (canAdd) {
      window.location.href = `/company/addjobs/${jobId}`;
    } else {
      setShowProfileModal(true);
    }
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      let first = 1;
      let last = totalPages > 4 ? 4 : totalPages;

      if (totalPages > 4 && currentPage >= 2) {
        first = currentPage - 1;
        last = currentPage + 1;
        if (last > totalPages) last = totalPages;
      }

      const pages = [];
      
      // First page link
      if (first > 1) {
        pages.push(
          <li key="first" className="page-item">
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
          </li>
        );
      }

      // Page numbers
      for (let i = first; i <= last; i++) {
        pages.push(
          <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </button>
          </li>
        );
      }

      // Last pages
      if (totalPages > last) {
        pages.push(
          <li key="dots" className="page-item">
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(last + 1)}
            >
              ...
            </button>
          </li>
        );
        pages.push(
          <li key="last" className="page-item">
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </li>
        );
      }

      return pages;
    };

    return (
      <ul className="pagination justify-content-end ml-2 mb-2">
        {getPageNumbers()}
      </ul>
    );
  };

  return (
    <>
    
        <div>
          
          {/* Breadcrumb */}
          <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
            <div className="content-header-left col-md-9 col-12 mb-2">
              <div className="row breadcrumbs-top">
                <div className="col-12">
                  <h3 className="content-header-title float-left mb-0">Job Details</h3>
                  <div className="breadcrumb-wrapper col-12">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item">
                        <a href="/company/dashboard">Home</a>
                      </li>
                      <li className="breadcrumb-item active">Job Details</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="content-body">
            <section className="list-view">
              <div className="row">
                <div className="col-12 px-3">
                  <div className="card mt-1 mb-5">
                    
                    {/* Card Header */}
                    <div className="card-header border border-top-0 border-left-0 border-right-0 pb-1 px-0">
                      <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                        <h4 className="card-title">All Job Details</h4>
                      </div>
                      <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 text-right">
                        {(canAdd && isExist) ? (
                          <a href="/company/addjobs" className="btn btn-primary">+ Add JD</a>
                        ) : (!canAdd && isExist) ? (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => setShowProfileModal(true)}
                          >
                            + Add JD
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="card-content">
                      <div className="table-responsive">
                        <table className="table table-hover-animation mb-0 table-hover">
                          <thead>
                            <tr>
                              <th className="company-jd-head">Company Name</th>
                              <th className="company-jd-head">Title</th>
                              <th className="inyears">Experience (In Years)</th>
                              <th className="company-jd-head">Qualification</th>
                              <th className="shortlisted">Shortlisted</th>
                              <th className="company-jd-head-date">Date of posting</th>
                              <th>Edit</th>
                              <th>Copy</th>
                              <th>Active</th>
                              <th className="action-width">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              <tr>
                                <td className="text-center" colSpan="9">
                                  Loading...
                                </td>
                              </tr>
                            ) : jobs.length > 0 ? (
                              jobs.map((job, index) => {
                                const expired = isJobExpired(job.validity);
                                const rowClass = expired ? 'disable_button' : '';
                                const textStyle = expired ? 
                                  { fontSize: '12.5px', color: '#000' } : {};

                                return (
                                  <tr key={job._id} className={rowClass}>
                                    <td style={textStyle}>
                                      {job.displayCompanyName || 'NA'}
                                    </td>
                                    <td style={textStyle}>
                                      {job.title || 'NA'}
                                    </td>
                                    <td style={textStyle}>
                                      {job.experience || 'Fresher'}
                                    </td>
                                    <td style={textStyle}>
                                      {job._qualification?.name || 'NA'}
                                    </td>
                                    <td style={textStyle}>
                                      {getShortlistedCount(job._id)}
                                    </td>
                                    <td style={textStyle}>
                                      {formatDate(job.createdAt)}
                                    </td>
                                    <td>
                                      <a href={`/company/editJobs/${job._id}`}>
                                        <i 
                                          className={`fas fa-edit ${expired ? 'disable_button' : ''}`}
                                          style={expired ? { color: 'black' } : {}}
                                        ></i>
                                      </a>
                                    </td>
                                    <td>
                                      {canAdd ? (
                                        <a href={`/company/addjobs/${job._id}`}>
                                          <i 
                                            className={`fas fa-copy ${expired ? 'disable_button' : ''}`}
                                            style={expired ? { color: 'black' } : {}}
                                          ></i>
                                        </a>
                                      ) : (
                                        <button 
                                          onClick={() => setShowProfileModal(true)}
                                          style={{ border: 'none', background: 'none' }}
                                        >
                                          <i 
                                            className={`fas fa-copy ${expired ? 'disable_button' : ''}`}
                                            style={expired ? { color: 'black' } : {}}
                                          ></i>
                                        </button>
                                      )}
                                    </td>
                                    <td>
                                      <div className="custom-control custom-switch custom-control-inline">
                                        <input 
                                          type="checkbox"
                                          className="custom-control-input"
                                          id={`customSwitch${index}`}
                                          checked={job.status}
                                          onChange={() => toggleJobStatus(job._id, job.status)}
                                        />
                                        <label 
                                          className="custom-control-label" 
                                          htmlFor={`customSwitch${index}`}
                                        ></label>
                                      </div>
                                    </td>
                                    <td className="px-0">
                                      {expired ? (
                                        <span className="offer-valid bg-danger ml-1">
                                          Expired
                                        </span>
                                      ) : (
                                        <>
                                          <a 
                                            href={`/company/jobs/${job._id}`} 
                                            className="btn btn-primary btn-sm"
                                          >
                                            View
                                          </a>
                                          {expired && (
                                            <span className="badge bg-danger ml-1" style={{ position: 'relative' }}>
                                              Expired
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td className="text-center" colSpan="9">
                                  No record found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Pagination */}
                        <Pagination />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
   

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">
                  Complete Profile
                </h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowProfileModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <ul className="list-unstyled">
                  <li className="mb-1">
                    <span className="credit font-weight-bold">
                      Current Coins Balance: {companyData?.creditLeft || 0}
                    </span>
                  </li>
                </ul>
                <h5 className="pb-1 mb-0">
                  Kindly complete your profile before adding Jobs / नौकरियाँ जोड़ने से पहले कृपया अपना प्रोफ़ाइल पूरा करें
                </h5>
              </div>
              <div className="modal-footer">
                <a href="/company/myProfile">
                  <button type="button" className="btn btn-primary">
                    Complete Profile
                  </button>
                </a>
                <button 
                  type="button" 
                  className="btn btn-outline-light" 
                  onClick={() => setShowProfileModal(false)}
                >
                  <i className="feather icon-x d-block d-lg-none"></i>
                  <span className="d-none d-lg-block">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .disable_button {
          opacity: 0.6;
        }
        .offer-valid {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          color: white;
          font-size: 0.75rem;
        }
        .bg-danger {
          background-color: #dc3545 !important;
        }
        .pagination .page-link {
          cursor: pointer;
        }
        .pagination .page-item.active .page-link {
          background-color: #007bff;
          border-color: #007bff;
          color: white;
        }
        .modal {
          z-index: 1050;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .company-jd-head, .inyears, .shortlisted, .company-jd-head-date, .action-width {
          white-space: nowrap;
        }
        .custom-control-input:checked ~ .custom-control-label::before {
          background-color: #28a745;
          border-color: #28a745;
        }
      `}</style>
    </>
  );
};

export default AllJd;