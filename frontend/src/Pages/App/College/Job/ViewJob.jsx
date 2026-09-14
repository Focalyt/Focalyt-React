import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewJob = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const navigate = useNavigate();
  const token = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}')?.token
        || localStorage.getItem('token');
    } catch {
      return localStorage.getItem('token');
    }
  }, []);
  const authHeaders = { headers: { 'x-auth': token } };

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shortlistedCounts, setShortlistedCounts] = useState([]);
  const [collegeData, setCollegeData] = useState({});
  const [canAdd, setCanAdd] = useState(true);
  const [isExist, setIsExist] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadJobsData = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/college/job/list`, {
        ...authHeaders,
        params: { page },
      });
      const data = response.data || {};
      if (data.success) {
        setJobs(Array.isArray(data.jd) ? data.jd : []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || 1);
        setShortlistedCounts(Array.isArray(data.shortlistedCandCount) ? data.shortlistedCandCount : []);
        setCollegeData(data.college || {});
        setCanAdd(data.canAdd !== undefined ? data.canAdd : true);
        setIsExist(data.isExist !== undefined ? data.isExist : true);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobsData(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      await axios.patch(
        `${backendUrl}/college/job/changeStatus`,
        { id: jobId, status: !currentStatus },
        authHeaders
      );
      loadJobsData(currentPage);
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const isJobExpired = (validityDate) => {
    if (!validityDate) return false;
    const today = new Date();
    const validity = new Date(validityDate);
    today.setHours(0, 0, 0, 0);
    validity.setHours(0, 0, 0, 0);
    return validity < today;
  };

  const getShortlistedCount = (jobId) => {
    const count = shortlistedCounts.find((elem) => (
      String(elem._id?.job || '') === String(jobId || '')
    ));
    return count?.count || '0';
  };

  const handleAddJobClick = () => {
    if (canAdd && isExist) {
      navigate('/institute/addjob');
      return;
    }
    if (!canAdd && isExist) {
      setShowProfileModal(true);
    }
  };

  const handleCopyJobClick = (jobId) => {
    if (canAdd) {
      navigate(`/institute/addjob/${jobId}`);
      return;
    }
    setShowProfileModal(true);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;
    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    const pages = [];
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button type="button" className="page-link" onClick={() => setCurrentPage(1)}>First</button>
        </li>
      );
    }

    for (let i = first; i <= last; i += 1) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button type="button" className="page-link" onClick={() => setCurrentPage(i)}>{i}</button>
        </li>
      );
    }

    if (totalPages > last) {
      pages.push(
        <li key="dots" className="page-item">
          <button type="button" className="page-link" onClick={() => setCurrentPage(last + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button type="button" className="page-link" onClick={() => setCurrentPage(totalPages)}>Last</button>
        </li>
      );
    }

    return <ul className="pagination justify-content-end ml-2 mb-2">{pages}</ul>;
  };

  return (
    <div className="content-body">
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Job Details</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/institute/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Job Details</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="list-view">
        <div className="row">
          <div className="col-12 px-3">
            <div className="card mt-1 mb-5">
              <div className="card-header border border-top-0 border-left-0 border-right-0 pb-1 px-0">
                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6">
                  <h4 className="card-title">All Job Details</h4>
                </div>
                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 text-right">
                  {(canAdd && isExist) ? (
                    <Link to="/institute/addjob" className="btn btn-primary">+ Add JD</Link>
                  ) : (!canAdd && isExist) ? (
                    <button type="button" className="btn btn-primary" onClick={handleAddJobClick}>+ Add JD</button>
                  ) : null}
                </div>
              </div>

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
                          <td className="text-center" colSpan="10">Loading...</td>
                        </tr>
                      ) : jobs.length > 0 ? (
                        jobs.map((job, index) => {
                          const expired = isJobExpired(job.validity);
                          return (
                            <tr key={job._id} className={expired ? 'disable_button' : ''}>
                              <td style={expired ? { fontSize: '12.5px', color: '#000' } : undefined}>
                                {job.displayCompanyName || 'NA'}
                              </td>
                              <td style={expired ? { fontSize: '12.5px', color: '#000' } : undefined}>
                                {job.title || 'NA'}
                              </td>
                              <td style={expired ? { fontSize: '12.5px', color: '#000' } : undefined}>
                                {job.experience || 'Fresher'}
                              </td>
                              <td style={expired ? { fontSize: '12.5px', color: '#000' } : undefined}>
                                {job._qualification?.name || 'NA'}
                              </td>
                              <td style={expired ? { fontSize: '12.5px', color: '#000' } : undefined}>
                                {getShortlistedCount(job._id)}
                              </td>
                              <td style={expired ? { fontSize: '12.5px', color: '#000' } : undefined}>
                                {formatDate(job.createdAt)}
                              </td>
                              <td>
                                <Link to={`/institute/editjob/${job._id}`}>
                                  <i
                                    className={`fas fa-edit ${expired ? 'disable_button' : ''}`}
                                    style={expired ? { color: 'black' } : undefined}
                                  />
                                </Link>
                              </td>
                              <td>
                                {canAdd ? (
                                  <button
                                    type="button"
                                    className="btn btn-link p-0"
                                    onClick={() => handleCopyJobClick(job._id)}
                                  >
                                    <i
                                      className={`fas fa-copy ${expired ? 'disable_button' : ''}`}
                                      style={expired ? { color: 'black' } : undefined}
                                    />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-link p-0"
                                    onClick={() => setShowProfileModal(true)}
                                  >
                                    <i
                                      className={`fas fa-copy ${expired ? 'disable_button' : ''}`}
                                      style={expired ? { color: 'black' } : undefined}
                                    />
                                  </button>
                                )}
                              </td>
                              <td>
                                <div className="custom-control custom-switch custom-control-inline">
                                  <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id={`customSwitch${index}`}
                                    checked={Boolean(job.status)}
                                    onChange={() => toggleJobStatus(job._id, job.status)}
                                  />
                                  <label className="custom-control-label" htmlFor={`customSwitch${index}`} />
                                </div>
                              </td>
                              <td className="px-0">
                                {expired ? (
                                  <span className="offer-valid bg-danger ml-1">Expired</span>
                                ) : (
                                  <>
                                    <Link to={`/institute/job/${job._id}`} className="btn btn-primary btn-sm">
                                      View
                                    </Link>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="text-center" colSpan="10">No record found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {renderPagination()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showProfileModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">Complete Profile</h5>
                <button type="button" className="close" onClick={() => setShowProfileModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <ul className="list-unstyled">
                  <li className="mb-1">
                    <span className="credit font-weight-bold">
                      Current Coins Balance: {collegeData?.creditLeft || 0}
                    </span>
                  </li>
                </ul>
                <h5 className="pb-1 mb-0">
                  Kindly complete your profile before adding Jobs / नौकरियाँ जोड़ने से पहले कृपया अपना प्रोफ़ाइल पूरा करें
                </h5>
              </div>
              <div className="modal-footer">
                <Link to="/institute/myprofile">
                  <button type="button" className="btn btn-primary">Complete Profile</button>
                </Link>
                <button type="button" className="btn btn-outline-light" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .disable_button { opacity: 0.6; }
        .offer-valid { padding: 0.25rem 0.5rem; border-radius: 0.25rem; color: white; font-size: 0.75rem; }
        .pagination .page-link { cursor: pointer; }
        .company-jd-head, .inyears, .shortlisted, .company-jd-head-date, .action-width { white-space: nowrap; }
      `}</style>
    </div>
  );
};

export default ViewJob;
