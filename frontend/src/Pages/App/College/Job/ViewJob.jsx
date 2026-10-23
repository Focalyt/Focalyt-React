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

  const visibleJobs = jobs.length;
  const liveJobs = jobs.filter((job) => job.status && !isJobExpired(job.validity)).length;
  const expiredJobs = jobs.filter((job) => isJobExpired(job.validity)).length;

  return (
    <div className="content-body" id="viewJobPage">
      <div className="job-page-header">
        <div className="job-page-header__main">
          <div className="job-page-header__icon">
            <i className="fa fa-briefcase"></i>
          </div>
          <div className="job-page-header__copy">
            <h2>Job details</h2>
           
            <p>
              <Link to="/institute/dashboard">Home</Link>
              <span>›</span>
              <span>Job details</span>
            </p>
          </div>
        </div>
        {isExist && (
          <div className="job-page-header__actions">
            <button type="button" className="job-page-header__save" onClick={handleAddJobClick}>
              + Add job
            </button>
          </div>
        )}
      </div>

     

      <section className="job-list-card">
        <div className="job-list-card__head">
          <h4>All Job Details</h4>
          <p>{loading ? 'Fetching jobs…' : `${visibleJobs} shown`}</p>
        </div>

        <div className="table-responsive">
          <table className="job-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Title</th>
                <th>Experience</th>
                <th>Qualification</th>
                <th>Shortlisted</th>
                <th>Posted</th>
                <th>Edit</th>
                <th>Copy</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="job-table__empty" colSpan="10">Loading...</td>
                </tr>
              ) : jobs.length > 0 ? (
                jobs.map((job, index) => {
                  const expired = isJobExpired(job.validity);
                  return (
                    <tr key={job._id} className={expired ? 'is-expired' : ''}>
                      <td>
                        <span className="job-ellipsis" title={job.displayCompanyName || 'NA'}>
                          {job.displayCompanyName || 'NA'}
                        </span>
                      </td>
                      <td className="job-table__title">
                        <span className="job-ellipsis" title={job.title || 'NA'}>
                          {job.title || 'NA'}
                        </span>
                      </td>
                      <td>
                        <span className="job-ellipsis" title={job.experience || 'Fresher'}>
                          {job.experience || 'Fresher'}
                        </span>
                      </td>
                      <td>
                        <span className="job-ellipsis" title={job._qualification?.name || 'NA'}>
                          {job._qualification?.name || 'NA'}
                        </span>
                      </td>
                      <td>
                        <span className="job-count" title={`${getShortlistedCount(job._id)} shortlisted`}>
                          {getShortlistedCount(job._id)}
                        </span>
                      </td>
                      <td>
                        <span className="job-ellipsis" title={formatDate(job.createdAt)}>
                          {formatDate(job.createdAt)}
                        </span>
                      </td>
                      <td>
                        <Link to={`/institute/editjob/${job._id}`} className="job-icon-btn" aria-label="Edit job">
                          <i className="fas fa-pen"></i>
                        </Link>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="job-icon-btn"
                          aria-label="Copy job"
                          onClick={() => handleCopyJobClick(job._id)}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </td>
                      <td>
                        <div className="custom-control custom-switch">
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
                      <td>
                        {expired ? (
                          <span className="job-badge job-badge--expired">Expired</span>
                        ) : (
                          <Link to={`/institute/job/${job._id}`} className="job-action job-action--primary">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="job-table__empty" colSpan="10">No record found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </section>

      {showProfileModal && (
        <div className="job-modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="job-modal" onClick={(event) => event.stopPropagation()}>
            <div className="job-modal__head">
              <h5>Complete your profile</h5>
              <button type="button" onClick={() => setShowProfileModal(false)} aria-label="Close">
                &times;
              </button>
            </div>
            <div className="job-modal__body">
              <p className="job-modal__coins">Current coins: {collegeData?.creditLeft || 0}</p>
              <p>
                Kindly complete your profile before adding jobs.
              </p>
              <p className="job-modal__hindi">
                नौकरियाँ जोड़ने से पहले कृपया अपना प्रोफ़ाइल पूरा करें
              </p>
            </div>
            <div className="job-modal__foot">
              <Link to="/institute/myprofile" className="job-action job-action--primary">Complete profile</Link>
              <button type="button" className="job-action" onClick={() => setShowProfileModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        #viewJobPage,
        #viewJobPage button,
        #viewJobPage a,
        #viewJobPage h2,
        #viewJobPage h3,
        #viewJobPage h4,
        #viewJobPage p,
        #viewJobPage span {
          font-family: 'Open Sans', sans-serif;
        }
        #viewJobPage {
          background: #f1f5f9;
          min-height: 100vh;
          padding-bottom: 40px;
        }
        #viewJobPage .job-page-header {
          background: #ffffff;
          border: 1px solid #ffe4e6;
          border-radius: 18px;
          padding: 22px 28px;
          margin: 4px 12px 18px;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }
        #viewJobPage .job-page-header__main,
        #viewJobPage .job-page-header__actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        #viewJobPage .job-page-header__main { min-width: 0; }
        #viewJobPage .job-page-header__icon {
          background: #fff1f2;
          color: #e11d48;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 22px;
        }
        #viewJobPage .job-page-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
        }
        #viewJobPage .job-page-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
        }
        #viewJobPage .job-page-header__sub {
          max-width: 520px;
        }
        #viewJobPage .job-page-header a {
          color: #e11d48;
          text-decoration: none;
        }
        #viewJobPage .job-page-header p span { margin: 0 8px; color: #cbd5e1; }
        #viewJobPage .job-page-header__save {
          background: #e11d48;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        #viewJobPage .job-page-header__save:hover { transform: translateY(-1px); }
        #viewJobPage .job-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 180px));
          gap: 12px;
          margin: 0 12px 18px;
        }
        #viewJobPage .job-stat {
          background: white;
          border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 20px rgba(15, 23, 42, 0.04);
        }
        #viewJobPage .job-stat strong {
          display: block;
          font-size: 22px;
          color: #1e293b;
          line-height: 1.1;
        }
        #viewJobPage .job-stat span {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        #viewJobPage .job-list-card {
          margin: 0 12px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        #viewJobPage .job-list-card__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 22px 14px;
          border-bottom: 1px solid #f1f5f9;
        }
        #viewJobPage .job-list-card__head h4 {
          margin: 0;
          padding-left: 12px;
          position: relative;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }
        #viewJobPage .job-list-card__head h4::before {
          content: '';
          position: absolute;
          left: 0;
          top: 2px;
          width: 4px;
          height: 16px;
          border-radius: 4px;
          background: linear-gradient(135deg, #e11d48, #fb7185);
        }
        #viewJobPage .job-list-card__head p {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }
        #viewJobPage .job-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 0;
        }
        #viewJobPage .job-table thead th {
          text-align: left;
          padding: 14px 12px !important;
          background: #fff1f2 !important;
          color: #9f1239 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 0.03em !important;
          text-transform: uppercase !important;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          line-height: 1.2 !important;
          border: none !important;
          border-bottom: 1px solid #fecdd3 !important;
        }
        #viewJobPage .job-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
          vertical-align: middle;
        }
        #viewJobPage .job-table tbody tr:nth-child(even) td {
          background: #f8fafc;
        }
        #viewJobPage .job-ellipsis {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #viewJobPage .job-table td:nth-child(1) .job-ellipsis { max-width: 180px; }
        #viewJobPage .job-table td:nth-child(2) .job-ellipsis { max-width: 150px; }
        #viewJobPage .job-table td:nth-child(4) .job-ellipsis { max-width: 140px; }
        #viewJobPage .job-table td:nth-child(6) .job-ellipsis { max-width: 120px; }
        #viewJobPage .job-table tbody tr:hover td { background: #fff1f2; }
        #viewJobPage .job-table tr.is-expired td {
          color: #64748b;
          background: #f1f5f9 !important;
        }
        #viewJobPage .job-table__title { font-weight: 700; }
        #viewJobPage .job-table__empty {
          text-align: left;
          color: #64748b;
          padding: 28px 16px !important;
          white-space: normal;
        }
        #viewJobPage .job-count {
          display: inline-flex;
          min-width: 28px;
          justify-content: center;
          padding: 3px 8px;
          border-radius: 999px;
          background: #fff1f2;
          color: #be123c;
          font-size: 12px;
          font-weight: 700;
        }
        #viewJobPage .job-icon-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #e11d48;
          cursor: pointer;
          text-decoration: none;
        }
        #viewJobPage .job-icon-btn:hover {
          border-color: #fda4af;
          background: #fff1f2;
          color: #9f1239;
        }
        #viewJobPage .job-badge {
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: #f1f5f9;
          color: #64748b;
        }
        #viewJobPage .job-badge--live { background: #ecfdf5; color: #047857; }
        #viewJobPage .job-badge--expired { background: #fff1f2; color: #be123c; }
        #viewJobPage .custom-switch { padding-left: 2.4rem; min-height: 1.4rem; margin: 0; }
        #viewJobPage .custom-control-label {
          margin-bottom: 0;
        }
        #viewJobPage .custom-control-input:checked ~ .custom-control-label::before {
          background-color: #e11d48 !important;
          border-color: #e11d48 !important;
        }
        #viewJobPage .job-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #334155;
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }
        #viewJobPage .job-action:hover { border-color: #fda4af; color: #9f1239; }
        #viewJobPage .job-action--primary {
          background: linear-gradient(135deg, #e11d48, #fb7185);
          border-color: transparent;
          color: white;
          box-shadow: 0 6px 14px rgba(225, 29, 72, 0.22);
        }
        #viewJobPage .job-action--primary:hover { color: white; }
        #viewJobPage .pagination {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          list-style: none;
          padding: 14px 18px 18px;
          margin: 0;
        }
        #viewJobPage .page-item { list-style: none; }
        #viewJobPage .page-link {
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #334155;
          border-radius: 10px;
          min-width: 38px;
          height: 36px;
          padding: 0 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }
        #viewJobPage .page-item.active .page-link {
          background: #e11d48;
          border-color: #e11d48;
          color: white;
        }
        #viewJobPage .job-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }
        #viewJobPage .job-modal {
          width: min(480px, 100%);
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
        }
        #viewJobPage .job-modal__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          background: linear-gradient(105deg, #9f1239, #e11d48);
          color: white;
        }
        #viewJobPage .job-modal__head h5 { margin: 0; font-size: 16px; font-weight: 700; }
        #viewJobPage .job-modal__head button {
          border: none;
          background: transparent;
          color: white;
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
        }
        #viewJobPage .job-modal__body { padding: 18px; color: #334155; }
        #viewJobPage .job-modal__coins {
          display: inline-block;
          margin: 0 0 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          font-weight: 700;
        }
        #viewJobPage .job-modal__body p { margin: 0 0 8px; font-size: 14px; line-height: 1.5; }
        #viewJobPage .job-modal__hindi { color: #64748b; }
        #viewJobPage .job-modal__foot {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 0 18px 18px;
        }
        @media (max-width: 768px) {
          #viewJobPage .job-page-header,
          #viewJobPage .job-modal__foot {
            flex-direction: column;
            align-items: flex-start;
          }
          #viewJobPage .job-stats { grid-template-columns: 1fr; }
          #viewJobPage .job-page-header { margin-left: 0; margin-right: 0; }
        }
      `}</style>
    </div>
  );
};

export default ViewJob;
