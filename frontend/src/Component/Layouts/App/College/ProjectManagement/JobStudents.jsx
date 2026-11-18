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

const SOURCE_LABELS = {
  manual: 'Added by HR',
  'Website Apply': 'Website',
  bulk_upload: 'Bulk upload',
  'Digital Lead': 'Digital lead',
};

const STATUS_TABS = [
  { key: 'ALL', label: 'All Students' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const sourceLabel = (source) => SOURCE_LABELS[source] || source || 'NA';

const initials = (name) => String(name || '?')
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || '?';

const JobStudents = ({ selectedJob, onBackToJobs, selectedCenter = null, onBackToCenters = null, selectedProject = null, onBackToProjects = null, selectedVertical = null, onBackToVerticals = null }) => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
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

  const statusOf = (student) => String(student.approvalStatus || 'PENDING').toUpperCase();
  const countFor = (key) => (key === 'ALL' ? students.length : students.filter((s) => statusOf(s) === key).length);
  const websiteCount = students.filter((s) => s.source === 'Website Apply').length;
  const manualCount = students.filter((s) => s.source === 'manual').length;

  const needle = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (statusTab !== 'ALL' && statusOf(student) !== statusTab) return false;
    if (!needle) return true;
    return String(student.name || '').toLowerCase().includes(needle)
      || String(student.mobile || '').includes(needle)
      || String(student.email || '').toLowerCase().includes(needle);
  });

  return (
    <div className="container py-4" id="jobStudentsPage">
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

      <div className="js-summary">
        <div className="js-summary__job">
          <div className="js-summary__icon"><i className="bi bi-briefcase"></i></div>
          <div className="min-w-0">
            <h4 className="js-summary__title">{selectedJob?.title || 'Job'}</h4>
            <p className="js-summary__company">{selectedJob?.displayCompanyName || 'NA'}</p>
          </div>
        </div>
        <div className="js-stats">
          <div className="js-stat">
            <strong>{students.length}</strong>
            <span>Total</span>
          </div>
          <div className="js-stat">
            <strong>{websiteCount}</strong>
            <span>Website</span>
          </div>
          <div className="js-stat">
            <strong>{manualCount}</strong>
            <span>Added by HR</span>
          </div>
          <div className="js-stat">
            <strong>{countFor('APPROVED')}</strong>
            <span>Approved</span>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3 allCenter">
        <ul className="d-flex nav nav-pills mb-2 allCenterBtn">
          {STATUS_TABS.map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button"
                style={{ fontSize: 'clamp(12px,1.8vw,15px)' }}
                className={`nav-link navBTn ${statusTab === tab.key ? 'active' : ''}`}
                onClick={() => setStatusTab(tab.key)}
              >
                {tab.label} ({countFor(tab.key)})
              </button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          className="form-control w-25 searchBar"
          placeholder="Search by name, mobile or email"
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
        <section className="js-card">
          <div className="table-responsive">
            <table className="js-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Mobile</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Applied on</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const status = statusOf(student);
                  return (
                    <tr key={student._id}>
                      <td className="js-table__index">{index + 1}</td>
                      <td>
                        <div className="js-person">
                          <span className="js-avatar">{initials(student.name)}</span>
                          <div className="min-w-0">
                            <div className="js-person__name">{student.name || 'NA'}</div>
                            <div className="js-person__email" title={student.email}>{student.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {student.mobile ? (
                          <a href={`tel:${student.mobile}`} className="js-phone">
                            <i className="bi bi-telephone me-1"></i>{student.mobile}
                          </a>
                        ) : 'NA'}
                      </td>
                      <td>
                        <span className={`js-pill ${student.source === 'manual' ? 'js-pill--hr' : 'js-pill--web'}`}>
                          {sourceLabel(student.source)}
                        </span>
                      </td>
                      <td>
                        <span className={`js-pill js-pill--${status.toLowerCase()}`}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="js-table__date">{formatDate(student.appliedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && !error && filteredStudents.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-people fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No students found</h5>
          <p className="text-muted">
            {students.length > 0
              ? 'Try another tab or search'
              : `No students have applied for ${selectedJob?.title || 'this job'} yet`}
          </p>
        </div>
      )}

      <style>{`
        #jobStudentsPage .min-w-0 { min-width: 0; }
        #jobStudentsPage .js-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #ffe4e6;
          border-radius: 14px;
          padding: 16px 20px;
          margin-bottom: 18px;
        }
        #jobStudentsPage .js-summary__job { display: flex; align-items: center; gap: 12px; min-width: 0; }
        #jobStudentsPage .js-summary__icon {
          background: #fff1f2;
          color: #e11d48;
          border-radius: 12px;
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        #jobStudentsPage .js-summary__title { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
        #jobStudentsPage .js-summary__company { margin: 2px 0 0; font-size: 13px; color: #64748b; }
        #jobStudentsPage .js-stats { display: flex; flex-wrap: wrap; gap: 10px; }
        #jobStudentsPage .js-stat {
          min-width: 96px;
          padding: 8px 14px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        #jobStudentsPage .js-stat strong { display: block; font-size: 18px; color: #1e293b; line-height: 1.2; }
        #jobStudentsPage .js-stat span { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        #jobStudentsPage .js-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        #jobStudentsPage .js-table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 0; }
        #jobStudentsPage .js-table thead th {
          text-align: left;
          padding: 12px 14px;
          background: #fff1f2;
          color: #9f1239;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
          border-bottom: 1px solid #fecdd3;
        }
        #jobStudentsPage .js-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #0f172a;
          font-size: 14px;
          vertical-align: middle;
        }
        #jobStudentsPage .js-table tbody tr:last-child td { border-bottom: none; }
        #jobStudentsPage .js-table tbody tr:hover td { background: #fff7f8; }
        #jobStudentsPage .js-table__index { color: #94a3b8; width: 48px; }
        #jobStudentsPage .js-table__date { white-space: nowrap; color: #475569; }
        #jobStudentsPage .js-person { display: flex; align-items: center; gap: 10px; min-width: 0; }
        #jobStudentsPage .js-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        #jobStudentsPage .js-person__name { font-weight: 600; text-transform: capitalize; }
        #jobStudentsPage .js-person__email {
          font-size: 12px;
          color: #64748b;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #jobStudentsPage .js-phone { color: #0f172a; text-decoration: none; white-space: nowrap; }
        #jobStudentsPage .js-phone:hover { color: #e11d48; }
        #jobStudentsPage .js-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        #jobStudentsPage .js-pill--web { background: #eff6ff; color: #1d4ed8; }
        #jobStudentsPage .js-pill--hr { background: #f5f3ff; color: #6d28d9; }
        #jobStudentsPage .js-pill--pending { background: #fef3c7; color: #92400e; }
        #jobStudentsPage .js-pill--approved { background: #ecfdf5; color: #047857; }
        #jobStudentsPage .js-pill--rejected { background: #fff1f2; color: #be123c; }
        @media (max-width: 768px) {
          #jobStudentsPage .js-stats { width: 100%; }
          #jobStudentsPage .js-stat { flex: 1 1 40%; }
        }
      `}</style>
    </div>
  );
};

export default JobStudents;
