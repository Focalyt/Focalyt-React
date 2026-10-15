import React, { useState } from 'react';

const Jobs = ({ selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {
  const [activeJobTab, setActiveJobTab] = useState('Active Jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [jobs] = useState([]);

  const filteredJobs = jobs.filter((job) => {
    if (activeJobTab === 'Active Jobs' && job.status !== 'active') return false;
    if (activeJobTab === 'Inactive Jobs' && job.status !== 'inactive') return false;
    const name = String(job.name || job.title || '').toLowerCase();
    return name.includes(searchQuery.trim().toLowerCase());
  });

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

      <div className="row">
        {filteredJobs.map((job) => (
          <div key={job._id || job.id || job.name} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
            <div className="card h-100 border rounded shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-briefcase text-info fs-3 me-2"></i>
                  <p className="text-muted mb-1">{job.name || job.title}</p>
                </div>
                <span className={job.status === 'active' ? 'text-success' : 'text-secondary'}>
                  {job.status || 'active'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
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
