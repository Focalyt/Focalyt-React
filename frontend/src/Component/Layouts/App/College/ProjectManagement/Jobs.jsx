import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobStudents from './JobStudents';

const isJobExpired = (validityDate) => {
  if (!validityDate) return false;
  const today = new Date();
  const validity = new Date(validityDate);
  today.setHours(0, 0, 0, 0);
  validity.setHours(0, 0, 0, 0);
  return validity < today;
};

const formatDate = (dateString) => {
  if (!dateString) return 'NA';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const Jobs = ({ selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [activeJobTab, setActiveJobTab] = useState('Active Jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const centerId = selectedCenter?._id || '';
  const projectId = selectedProject?._id || '';
  const verticalId = selectedVertical?._id || '';

  useEffect(() => {
    if (!centerId) {
      setJobs([]);
      return;
    }
    let cancelled = false;
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError('');
        const token = JSON.parse(sessionStorage.getItem('user') || '{}')?.token;
        const params = { center: centerId };
        if (projectId) params.project = projectId;
        if (verticalId) params.vertical = verticalId;
        const response = await axios.get(`${backendUrl}/college/job/list`, {
          headers: { 'x-auth': token },
          params,
        });
        if (cancelled) return;
        const data = response.data || {};
        setJobs(Array.isArray(data.jd) ? data.jd : []);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading center jobs:', err);
        setJobs([]);
        setError(err?.response?.data?.message || 'Could not load jobs for this center. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchJobs();
    return () => { cancelled = true; };
  }, [backendUrl, centerId, projectId, verticalId]);

  const isLive = (job) => Boolean(job.status) && !isJobExpired(job.validity);

  const filteredJobs = jobs.filter((job) => {
    if (activeJobTab === 'Active Jobs' && !isLive(job)) return false;
    if (activeJobTab === 'Inactive Jobs' && isLive(job)) return false;
    const haystack = `${job.title || ''} ${job.displayCompanyName || ''}`.toLowerCase();
    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  if (selectedJob) {
    return (
      <JobStudents
        selectedJob={selectedJob}
        onBackToJobs={() => setSelectedJob(null)}
        selectedCenter={selectedCenter}
        onBackToCenters={onBackToCenters}
        selectedProject={selectedProject}
        onBackToProjects={onBackToProjects}
        selectedVertical={selectedVertical}
        onBackToVerticals={onBackToVerticals}
      />
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 allCenter">
        <div className="mb-2">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center w-100">
              <h5
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '110px', fontSize: 'clamp(15px,2vw,1rem)' }}
                onClick={onBackToVerticals}
                className="me-2"
              >
                {selectedVertical?.name || 'Department'} Vertical
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '110px', fontSize: 'clamp(15px,2vw,1rem)' }}
                title={selectedProject?.name}
                onClick={onBackToProjects}
                className="breadcrumb-item mb-0"
              >
                {selectedProject?.name || 'Project'} Project
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '110px', fontSize: 'clamp(15px,2vw,1rem)' }}
                onClick={onBackToCenters}
                className="breadcrumb-item mb-0"
              >
                {selectedCenter?.name || 'Center'} Centers
              </h5>
              <span className="mx-2"> &gt; </span>
              <h5
                className="breadcrumb-item mb-0"
                aria-current="page"
                style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '110px', fontSize: 'clamp(15px,2vw,1rem)' }}
              >
                All Jobs
              </h5>
            </div>
          </div>
        </div>
        <div>
          {onBackToCenters && (
            <button
              onClick={onBackToCenters}
              className="btn btn-light BAckBtn"
              title="Back to Centers"
              style={{ fontSize: 'clamp(12px,1.8vw,15px)' }}
            >
              <i className="bi bi-arrow-left me-2"></i>
              <span>Back</span>
            </button>
          )}
          <button
            className="btn btn-outline-secondary me-2 border-0 bg-transparent visibility"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3 allCenter">
        <ul className="d-flex nav nav-pills mb-2 allCenterBtn">
          {['Active Jobs', 'Inactive Jobs', 'All Jobs'].map((tab) => (
            <li className="nav-item" key={tab}>
              <button
                type="button"
                style={{ fontSize: 'clamp(12px,1.8vw,15px)' }}
                className={`nav-link navBTn ${activeJobTab === tab ? 'active' : ''}`}
                onClick={() => setActiveJobTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className="form-control w-25 searchBar"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2 text-muted">Loading jobs...</p>
        </div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="row">
          {filteredJobs.map((job) => {
            const live = isLive(job);
            return (
              <div key={job._id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
                <div className="card h-100 border rounded shadow-sm position-relative">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div
                        className="flex-grow-1"
                        onClick={() => setSelectedJob(job)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-briefcase text-info fs-3 me-2"></i>
                          <div>
                            <p className="text-muted mb-1">{job.title || 'NA'}</p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-muted small mb-1">
                            <i className="bi bi-building me-1"></i>
                            <strong>Company:</strong> {job.displayCompanyName || 'NA'}
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-calendar me-1"></i>
                            <strong>Active till:</strong> {formatDate(job.validity)}
                          </p>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          <span className={live ? 'text-success' : 'text-secondary'}>
                            {live ? 'active' : 'inactive'}
                          </span>
                          <span className="bg-primary">{job._qualification?.name || 'N/A'}</span>
                          <span className="badge bg-info text-dark">
                            <i className="bi bi-people-fill me-1"></i>
                            {job.noOfPosition || 0} Vacanc{job.noOfPosition === 1 ? 'y' : 'ies'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-briefcase fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No jobs found</h5>
          {selectedCenter ? (
            <p className="text-muted">No jobs found for center {selectedCenter.name}</p>
          ) : (
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Jobs;
