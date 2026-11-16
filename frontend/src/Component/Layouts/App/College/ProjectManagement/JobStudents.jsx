import React, { useEffect, useState } from 'react';
import axios from 'axios';

const formatDate = (dateString) => {
  if (!dateString) return 'NA';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const crumbStyle = { cursor: 'pointer', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '110px', fontSize: 'clamp(15px,2vw,1rem)' };

const approvalClass = {
  APPROVED: 'text-success',
  REJECTED: 'text-danger',
  PENDING: 'text-secondary',
};

const JobStudents = ({ selectedJob, onBackToJobs, selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const jobId = selectedJob?._id || '';

  useEffect(() => {
    if (!jobId) return undefined;
    let cancelled = false;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError('');
        const token = JSON.parse(sessionStorage.getItem('user') || '{}')?.token;
        const response = await axios.get(`${backendUrl}/college/job/${jobId}/students`, {
          headers: { 'x-auth': token },
        });
        if (cancelled) return;
        setStudents(Array.isArray(response.data?.students) ? response.data.students : []);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading job students:', err);
        setStudents([]);
        setError(err?.response?.data?.message || 'Could not load students for this job. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStudents();
    return () => { cancelled = true; };
  }, [backendUrl, jobId]);

  const needle = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter((student) => (
    !needle
    || String(student.name || '').toLowerCase().includes(needle)
    || String(student.mobile || '').includes(needle)
    || String(student.email || '').toLowerCase().includes(needle)
  ));

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 allCenter">
        <div className="mb-2">
          <div className="d-flex align-items-center w-100">
            <h5 style={crumbStyle} onClick={onBackToVerticals} className="me-2">
              {selectedVertical?.name || 'Department'} Vertical
            </h5>
            <span className="mx-2"> &gt; </span>
            <h5 style={crumbStyle} title={selectedProject?.name} onClick={onBackToProjects} className="breadcrumb-item mb-0">
              {selectedProject?.name || 'Project'} Project
            </h5>
            <span className="mx-2"> &gt; </span>
            <h5 style={crumbStyle} onClick={onBackToCenters} className="breadcrumb-item mb-0">
              {selectedCenter?.name || 'Center'} Centers
            </h5>
            <span className="mx-2"> &gt; </span>
            <h5 style={crumbStyle} title={selectedJob?.title} onClick={onBackToJobs} className="breadcrumb-item mb-0">
              {selectedJob?.title || 'Job'} Job
            </h5>
            <span className="mx-2"> &gt; </span>
            <h5 className="breadcrumb-item mb-0" aria-current="page" style={{ ...crumbStyle, cursor: 'default' }}>
              All Students
            </h5>
          </div>
        </div>
        <div>
          <button
            onClick={onBackToJobs}
            className="btn btn-light BAckBtn"
            title="Back to Jobs"
            style={{ fontSize: 'clamp(12px,1.8vw,15px)' }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3 allCenter">
        <input
          type="text"
          className="form-control w-25 searchBar"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2 text-muted">Loading students...</p>
        </div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && filteredStudents.length > 0 && (
        <div className="card border rounded shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Applied on</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student._id}>
                    <td>{index + 1}</td>
                    <td>{student.name || 'NA'}</td>
                    <td>{student.mobile || 'NA'}</td>
                    <td>{student.email || 'NA'}</td>
                    <td>{student.source || 'NA'}</td>
                    <td className={approvalClass[student.approvalStatus] || 'text-secondary'}>
                      {String(student.approvalStatus || 'PENDING').toLowerCase()}
                    </td>
                    <td>{formatDate(student.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && filteredStudents.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-people fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No students found</h5>
          <p className="text-muted">
            {students.length > 0
              ? 'Try adjusting your search'
              : `No students have applied for ${selectedJob?.title || 'this job'} yet`}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobStudents;
