import React, { useState, useEffect } from 'react';

const ShortListedCandidate = () => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State management
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    filterType: ''
  });

  // Hiring status options
  const hiringStatusOptions = [
    { value: '', label: 'Select Option' },
    { value: 'Shortlisted', label: 'Shortlisted' },
    { value: 'Interview Due', label: 'Interview Due' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Offer Letter Rollout', label: 'Offer Letter Rollout' },
    { value: 'Hiring on Hold', label: 'Hiring on Hold' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ];

  useEffect(() => {
    fetchCandidates();
    fetchQualifications();
  }, [currentPage]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage === 1) {
      fetchCandidates();
    }
  }, [filters, currentPage]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        ...(filters.name && { name: filters.name }),
        ...(filters.filterType && { filterType: filters.filterType })
      });

      const response = await fetch(`${backendUrl}/candidate/shortlisted?${queryParams}`, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCandidates(data.candidates || []);
        setTotalCount(data.countCandidates?.[0]?.metadata?.[0]?.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQualifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/qualifications`, {
        headers: { 'x-auth': token }
      });
      const data = await response.json();
      setQualifications(data.qualifications || []);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    setCurrentPage(1);
    fetchCandidates();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const getQualificationName = (qualificationId) => {
    const qualification = qualifications.find(q => q._id === qualificationId);
    return qualification?.name || 'NA';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    // First page link
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>
            First
          </button>
        </li>
      );
    }

    // Page number links
    for (let i = first; i <= last; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => handlePageChange(i)}
            disabled={i === currentPage}
          >
            {i}
          </button>
        </li>
      );
    }

    // Last page links
    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(last + 1)}>
            ...
          </button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            Last
          </button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2">
        {pages}
      </ul>
    );
  };

  return (
    <>
        {/* Breadcrumb */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h2 className="content-header-title float-left mb-0">Shortlisted Candidates</h2>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Shortlisted Candidates</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-body">
          <section className="list-view">
            <div className="row">
              <div className="col-12">
                <div className="card mt-1 mb-5">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Shortlisted Candidates</h4>
                    <h6 className="text-bold-500">
                      Candidate Count: {totalCount}
                    </h6>
                  </div>

                  {/* Filter Section */}
                  <div className="col-xl-12 col-lg-12 mt-2">
                    <div>
                      <div className="row">
                        <div className="col-xl-4">
                          <label>Name/ Mobile/ Whatsapp</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={filters.name}
                            onChange={(e) => handleFilterChange('name', e.target.value)}
                            maxLength="25"
                            placeholder="Search by name, mobile, or WhatsApp"
                          />
                        </div>
                        <div className="col-xl-4">
                          <h6>Hiring Status</h6>
                          <select 
                            className="form-control" 
                            value={filters.filterType}
                            onChange={(e) => handleFilterChange('filterType', e.target.value)}
                          >
                            {hiringStatusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-xl-2">
                          <label>&nbsp;</label>
                          <br />
                          <button
                            type="button"
                            className="btn btn-success waves-effect waves-light text-white"
                            onClick={handleSubmit}
                            disabled={loading}
                          >
                            {loading ? 'LOADING...' : 'SUBMIT'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="card-content">
                    <div className="table-responsive mt-1">
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>CANDIDATES</th>
                            <th>Qualification</th>
                            <th>MOBILE NO.</th>
                            <th>SHORTLISTING DATE</th>
                            <th>Experience</th>
                            <th>Hiring Status</th>
                            <th>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="7" className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="sr-only">Loading...</span>
                                </div>
                              </td>
                            </tr>
                          ) : candidates.length > 0 ? (
                            candidates.map((shortlisted) => {
                              const candidate = shortlisted.candidate?.[0] || {};
                              return (
                                <tr key={candidate._id || shortlisted._id}>
                                  <td className="name text-capitalize">
                                    {candidate.name || 'NA'}
                                  </td>
                                  <td>
                                    {getQualificationName(candidate.highestQualification)}
                                  </td>
                                  <td className="mobile">
                                    {candidate.mobile || 'NA'}
                                  </td>
                                  <td>
                                    {formatDate(shortlisted.createdAt)}
                                  </td>
                                  <td>
                                    {candidate.totalExperience 
                                      ? `${candidate.totalExperience} Years` 
                                      : 'Fresher'
                                    }
                                  </td>
                                  <td className="text-capitalize">
                                    {shortlisted.status || 'NA'}
                                  </td>
                                  <td className="actions" id="social-iconw">
                                    <a 
                                      href={`/company/candidate/${candidate._id}?src=shortlisted`}
                                      className="me-2"
                                    >
                                      <i className="fa-regular fa-user fa-lg"></i>
                                    </a>
                                    {candidate.whatsapp && (
                                      <a 
                                        href={`https://wa.me/91${candidate.whatsapp}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="me-1"
                                      >
                                        <img 
                                          src="/public_assets/images/whatsappicon.png" 
                                          width="18%" 
                                          className="mx-1"
                                          alt="WhatsApp"
                                        />
                                      </a>
                                    )}
                                    {candidate.mobile && (
                                      <a href={`tel:${candidate.mobile}`}>
                                        <img 
                                          src="/public_assets/images/telephone.png" 
                                          width="18.5%"
                                          alt="Call"
                                        />
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No Result Found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {renderPagination()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
    
    </>
  );
};

export default ShortListedCandidate;