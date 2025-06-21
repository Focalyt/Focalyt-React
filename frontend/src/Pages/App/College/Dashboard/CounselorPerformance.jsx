import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';

const CounselorPerformance = () => {
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });

  // Mock data structured according to schema
  const [counselorData] = useState({
    counselors: [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@college.com',
        phone: '+91 9876543210',
        totalLeads: 125,
        activeLeads: 89,
        convertedLeads: 23,
        centers: ['center1', 'center2', 'center3']
      }
    ],
    // Applied Courses data matching schema
    appliedCourses: [
      {
        _id: '507f1f77bcf86cd799439012',
        _candidate: {
          _id: '507f1f77bcf86cd799439013',
          name: 'Arjun Kumar',
          phone: '+91 9876543210',
          email: 'arjun@email.com',
          age: 22,
          gender: 'Male',
          address: 'Delhi, India',
          qualification: 'B.Tech Computer Science'
        },
        _course: {
          _id: '507f1f77bcf86cd799439014',
          name: 'Full Stack Development',
          duration: '6 months',
          fee: 50000
        },
        _center: {
          _id: 'center1',
          name: 'Delhi North',
          location: 'Delhi'
        },
        _leadStatus: {
          _id: '64ab1234abcd5678ef901234',
          name: 'In Progress',
          color: '#ffc107'
        },
        _initialStatus: 'Hot',
        registeredBy: {
          _id: '507f1f77bcf86cd799439015',
          name: 'Admin User'
        },
        courseStatus: 1, // Assigned
        kycStage: true,
        kyc: false,
        admissionDone: false,
        dropout: false,
        followupDate: new Date('2024-06-25'),
        followups: [
          {
            date: new Date('2024-06-20'),
            status: 'Done'
          },
          {
            date: new Date('2024-06-25'),
            status: 'Planned'
          }
        ],
        leadAssignment: [
          {
            _id: '507f1f77bcf86cd799439011',
            counsellorName: 'Rahul Sharma',
            assignDate: new Date('2024-06-15'),
            assignedBy: '507f1f77bcf86cd799439015'
          }
        ],
        logs: [
          {
            user: '507f1f77bcf86cd799439011',
            timestamp: new Date('2024-06-15'),
            action: 'Lead assigned to counselor',
            remarks: 'Hot lead - priority follow up'
          },
          {
            user: '507f1f77bcf86cd799439011',
            timestamp: new Date('2024-06-16'),
            action: 'First contact attempted',
            remarks: 'Student interested, scheduled callback'
          }
        ],
        registrationFee: 'Unpaid',
        remarks: 'Interested in weekend batch',
        uploadedDocs: [
          {
            docsId: { name: 'Aadhaar Card' },
            fileUrl: '/docs/aadhaar_123.pdf',
            status: 'Pending',
            uploadedAt: new Date('2024-06-16')
          },
          {
            docsId: { name: 'Educational Certificate' },
            fileUrl: '/docs/edu_123.pdf',
            status: 'Verified',
            verifiedBy: '507f1f77bcf86cd799439015',
            verifiedDate: new Date('2024-06-17')
          }
        ],
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-20')
      },
      // Add more sample leads...
    ],
    centers: [
      {
        _id: 'center1',
        name: 'Delhi North',
        location: 'Delhi',
        totalLeads: 85,
        activeLeads: 60,
        convertedLeads: 15
      },
      {
        _id: 'center2',
        name: 'Hamirpur',
        location: 'Himachal Pradesh',
        totalLeads: 45,
        activeLeads: 30,
        convertedLeads: 8
      },
      {
        _id: 'center3',
        name: 'Shahpur',
        location: 'Himachal Pradesh',
        totalLeads: 32,
        activeLeads: 20,
        convertedLeads: 5
      }
    ],
    courses: [
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'Full Stack Development',
        duration: '6 months',
        fee: 50000
      },
      {
        _id: '507f1f77bcf86cd799439016',
        name: 'Data Science',
        duration: '6 months',
        fee: 60000
      },
      {
        _id: '507f1f77bcf86cd799439017',
        name: 'Digital Marketing',
        duration: '4 months',
        fee: 30000
      }
    ]
  });

  // Helper functions
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'hot': return '#dc3545';
      case 'warm': return '#fd7e14';
      case 'cold': return '#6c757d';
      default: return '#17a2b8';
    }
  };

  const getCourseStatusText = (status) => {
    return status === 0 ? 'Due' : 'Assigned';
  };

  const getDocumentStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'verified': return '✅';
      case 'rejected': return '❌';
      default: return '⏳';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Get counselor's leads
  const getCounselorLeads = (counselorId) => {
    return counselorData.appliedCourses.filter(lead => 
      lead.leadAssignment.some(assignment => assignment._id === counselorId)
    );
  };

  // Get center-wise leads
  const getCenterLeads = (centerId) => {
    return counselorData.appliedCourses.filter(lead => lead._center._id === centerId);
  };

  // Get course-wise leads
  const getCourseLeads = (courseId) => {
    return counselorData.appliedCourses.filter(lead => lead._course._id === courseId);
  };

  // Calculate conversion metrics
  const calculateMetrics = (leads) => {
    const total = leads.length;
    const converted = leads.filter(l => l.admissionDone).length;
    const dropped = leads.filter(l => l.dropout).length;
    const kycPending = leads.filter(l => l.kycStage && !l.kyc).length;
    const kycCompleted = leads.filter(l => l.kyc).length;
    const hotLeads = leads.filter(l => l._initialStatus === 'Hot').length;
    const warmLeads = leads.filter(l => l._initialStatus === 'Warm').length;
    const coldLeads = leads.filter(l => l._initialStatus === 'Cold').length;

    return {
      total,
      converted,
      dropped,
      kycPending,
      kycCompleted,
      hotLeads,
      warmLeads,
      coldLeads,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : 0
    };
  };

  const renderOverviewTab = () => {
    const overallMetrics = calculateMetrics(counselorData.appliedCourses);

    return (
      <div className="overview-content">
        <div className="summary-header">
          <h4>📊 Counselor Performance Overview</h4>
          <p className="text-muted">Overall system metrics and counselor performance</p>
        </div>

        {/* Overall Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <span className="metric-value">{overallMetrics.total}</span>
              <span className="metric-label">Total Leads</span>
            </div>
          </div>
          <div className="metric-card success">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <span className="metric-value">{overallMetrics.converted}</span>
              <span className="metric-label">Admissions</span>
            </div>
          </div>
          <div className="metric-card warning">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <span className="metric-value">{overallMetrics.kycPending}</span>
              <span className="metric-label">KYC Pending</span>
            </div>
          </div>
          <div className="metric-card danger">
            <div className="metric-icon">🚫</div>
            <div className="metric-content">
              <span className="metric-value">{overallMetrics.dropped}</span>
              <span className="metric-label">Dropouts</span>
            </div>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="charts-row">
          <div className="chart-container">
            <h5>Lead Status Distribution</h5>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Hot', value: overallMetrics.hotLeads, fill: '#dc3545' },
                    { name: 'Warm', value: overallMetrics.warmLeads, fill: '#fd7e14' },
                    { name: 'Cold', value: overallMetrics.coldLeads, fill: '#6c757d' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Counselors Grid */}
        <h5 className="section-title">Counselors</h5>
        <div className="counselors-grid">
          {counselorData.counselors.map((counselor) => {
            const counselorLeads = getCounselorLeads(counselor._id);
            const metrics = calculateMetrics(counselorLeads);

            return (
              <div key={counselor._id} className="counselor-card"
                   onClick={() => {
                     setSelectedCounselor(counselor);
                     setViewMode('counselor');
                   }}>
                <div className="counselor-header">
                  <img src={`https://ui-avatars.com/api/?name=${counselor.name}&background=667eea&color=fff&size=60`} alt={counselor.name} />
                  <div className="counselor-info">
                    <h6>{counselor.name}</h6>
                    <p>{counselor.email}</p>
                  </div>
                </div>
                
                <div className="counselor-stats">
                  <div className="stat-item">
                    <span className="stat-value">{metrics.total}</span>
                    <span className="stat-label">Total Leads</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{metrics.converted}</span>
                    <span className="stat-label">Converted</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{metrics.conversionRate}%</span>
                    <span className="stat-label">Conv. Rate</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCounselorTab = () => {
    if (!selectedCounselor) return null;

    const counselorLeads = getCounselorLeads(selectedCounselor._id);
    const centerWiseData = {};

    // Group leads by center
    counselorLeads.forEach(lead => {
      const centerId = lead._center._id;
      if (!centerWiseData[centerId]) {
        centerWiseData[centerId] = {
          center: lead._center,
          leads: []
        };
      }
      centerWiseData[centerId].leads.push(lead);
    });

    return (
      <div className="counselor-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('overview')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Overview
          </button>
          <h4>{selectedCounselor.name} - Performance Dashboard</h4>
        </div>

        <div className="counselor-summary">
          <div className="profile-section">
            <img src={`https://ui-avatars.com/api/?name=${selectedCounselor.name}&background=667eea&color=fff&size=80`} alt={selectedCounselor.name} />
            <div className="profile-details">
              <h5>{selectedCounselor.name}</h5>
              <p>{selectedCounselor.email}</p>
              <p>{selectedCounselor.phone}</p>
            </div>
          </div>
        </div>

        {/* Center-wise Performance */}
        <h5 className="section-title">Center-wise Performance</h5>
        <div className="centers-grid">
          {Object.values(centerWiseData).map(({ center, leads }) => {
            const metrics = calculateMetrics(leads);
            return (
              <div key={center._id} className="center-card"
                   onClick={() => {
                     setSelectedCenter(center);
                     setViewMode('center');
                   }}>
                <h6>🏢 {center.name}</h6>
                <div className="center-metrics">
                  <div className="metric-row">
                    <span>Total Leads:</span>
                    <span className="metric-value">{metrics.total}</span>
                  </div>
                  <div className="metric-row">
                    <span>Converted:</span>
                    <span className="metric-value">{metrics.converted}</span>
                  </div>
                  <div className="metric-row">
                    <span>KYC Pending:</span>
                    <span className="metric-value">{metrics.kycPending}</span>
                  </div>
                  <div className="metric-row">
                    <span>Conversion Rate:</span>
                    <span className="metric-value">{metrics.conversionRate}%</span>
                  </div>
                </div>
                <div className="lead-status-bar">
                  <div className="status-segment hot" style={{ width: `${(metrics.hotLeads / metrics.total) * 100}%` }}></div>
                  <div className="status-segment warm" style={{ width: `${(metrics.warmLeads / metrics.total) * 100}%` }}></div>
                  <div className="status-segment cold" style={{ width: `${(metrics.coldLeads / metrics.total) * 100}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activities */}
        <h5 className="section-title">Recent Activities</h5>
        <div className="activities-timeline">
          {counselorLeads
            .flatMap(lead => lead.logs.map(log => ({ ...log, lead })))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-time">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
                <div className="activity-content">
                  <p className="activity-action">{activity.action}</p>
                  {activity.remarks && <p className="activity-remarks">{activity.remarks}</p>}
                  <p className="activity-lead">Lead: {activity.lead._candidate.name}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderCenterTab = () => {
    if (!selectedCenter) return null;

    const centerLeads = getCenterLeads(selectedCenter._id);
    const courseWiseData = {};

    // Group leads by course
    centerLeads.forEach(lead => {
      const courseId = lead._course._id;
      if (!courseWiseData[courseId]) {
        courseWiseData[courseId] = {
          course: lead._course,
          leads: []
        };
      }
      courseWiseData[courseId].leads.push(lead);
    });

    return (
      <div className="center-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('counselor')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Counselor
          </button>
          <h4>🏢 {selectedCenter.name} - Lead Management</h4>
        </div>

        {/* Center Summary */}
        <div className="center-summary">
          <h5>Center Overview</h5>
          <div className="summary-metrics">
            {Object.values(courseWiseData).map(({ course, leads }) => {
              const metrics = calculateMetrics(leads);
              return (
                <div key={course._id} className="course-summary-card">
                  <h6>{course.name}</h6>
                  <div className="course-metrics">
                    <span>Total: {metrics.total}</span>
                    <span>Converted: {metrics.converted}</span>
                    <span>Rate: {metrics.conversionRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads Table */}
        <h5 className="section-title">All Leads</h5>
        <div className="leads-table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Course</th>
                <th>Status</th>
                <th>KYC</th>
                <th>Followup</th>
                <th>Registration Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {centerLeads.map((lead) => (
                <tr key={lead._id}>
                  <td>
                    <div className="candidate-cell">
                      <strong>{lead._candidate.name}</strong>
                      <small>{lead._candidate.phone}</small>
                    </div>
                  </td>
                  <td>{lead._course.name}</td>
                  <td>
                    <span className={`status-badge ${lead._initialStatus.toLowerCase()}`}>
                      {lead._initialStatus}
                    </span>
                  </td>
                  <td>
                    <div className="kyc-status">
                      {lead.kyc ? '✅ Complete' : lead.kycStage ? '⏳ In Progress' : '❌ Pending'}
                    </div>
                  </td>
                  <td>
                    {lead.followupDate && 
                      <span>{new Date(lead.followupDate).toLocaleDateString()}</span>
                    }
                  </td>
                  <td>
                    <span className={`fee-status ${lead.registrationFee.toLowerCase()}`}>
                      {lead.registrationFee}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedLead(lead);
                              setViewMode('lead');
                            }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLeadTab = () => {
    if (!selectedLead) return null;

    return (
      <div className="lead-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('center')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Center
          </button>
          <h4>Lead Details - {selectedLead._candidate.name}</h4>
        </div>

        <div className="lead-details-grid">
          {/* Candidate Information */}
          <div className="detail-card">
            <h5>👤 Candidate Information</h5>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{selectedLead._candidate.name}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{selectedLead._candidate.phone}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{selectedLead._candidate.email}</span>
              </div>
              <div className="info-item">
                <label>Age:</label>
                <span>{selectedLead._candidate.age}</span>
              </div>
              <div className="info-item">
                <label>Qualification:</label>
                <span>{selectedLead._candidate.qualification}</span>
              </div>
              <div className="info-item">
                <label>Address:</label>
                <span>{selectedLead._candidate.address}</span>
              </div>
            </div>
          </div>

          {/* Course & Status Information */}
          <div className="detail-card">
            <h5>📚 Course & Status</h5>
            <div className="info-grid">
              <div className="info-item">
                <label>Course:</label>
                <span>{selectedLead._course.name}</span>
              </div>
              <div className="info-item">
                <label>Duration:</label>
                <span>{selectedLead._course.duration}</span>
              </div>
              <div className="info-item">
                <label>Fee:</label>
                <span>{formatCurrency(selectedLead._course.fee)}</span>
              </div>
              <div className="info-item">
                <label>Lead Status:</label>
                <span className={`status-badge ${selectedLead._initialStatus.toLowerCase()}`}>
                  {selectedLead._initialStatus}
                </span>
              </div>
              <div className="info-item">
                <label>Course Status:</label>
                <span>{getCourseStatusText(selectedLead.courseStatus)}</span>
              </div>
              <div className="info-item">
                <label>Registration Fee:</label>
                <span className={`fee-status ${selectedLead.registrationFee.toLowerCase()}`}>
                  {selectedLead.registrationFee}
                </span>
              </div>
            </div>
          </div>

          {/* KYC Documents */}
          <div className="detail-card">
            <h5>📋 KYC Documents</h5>
            <div className="documents-list">
              {selectedLead.uploadedDocs.map((doc, idx) => (
                <div key={idx} className={`document-item ${doc.status.toLowerCase()}`}>
                  <div className="doc-info">
                    <span className="doc-name">{doc.docsId.name}</span>
                    <span className="doc-status">
                      {getDocumentStatusIcon(doc.status)} {doc.status}
                    </span>
                  </div>
                  <div className="doc-actions">
                    {doc.status === 'Pending' && (
                      <>
                        <button className="btn btn-sm btn-success">Verify</button>
                        <button className="btn btn-sm btn-danger">Reject</button>
                      </>
                    )}
                    <button className="btn btn-sm btn-info">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Followup History */}
          <div className="detail-card">
            <h5>📅 Followup History</h5>
            <div className="followup-list">
              {selectedLead.followups.map((followup, idx) => (
                <div key={idx} className={`followup-item ${followup.status.toLowerCase()}`}>
                  <span className="followup-date">
                    {new Date(followup.date).toLocaleDateString()}
                  </span>
                  <span className={`followup-status ${followup.status.toLowerCase()}`}>
                    {followup.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment History */}
          <div className="detail-card">
            <h5>👥 Assignment History</h5>
            <div className="assignment-list">
              {selectedLead.leadAssignment.map((assignment, idx) => (
                <div key={idx} className="assignment-item">
                  <div className="assignment-info">
                    <strong>{assignment.counsellorName}</strong>
                    <span>Assigned on: {new Date(assignment.assignDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="detail-card full-width">
            <h5>📝 Activity Logs</h5>
            <div className="logs-timeline">
              {selectedLead.logs.map((log, idx) => (
                <div key={idx} className="log-item">
                  <div className="log-time">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="log-content">
                    <p className="log-action">{log.action}</p>
                    {log.remarks && <p className="log-remarks">{log.remarks}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="counselor-performance-dashboard">
      <div className="dashboard-header">
        <h3>Counselor Performance Dashboard</h3>
        <div className="header-controls">
          <input 
            type="date" 
            className="date-filter"
            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
          />
          <input 
            type="date" 
            className="date-filter"
            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
          />
          <button className="btn btn-primary">
            <i className="fas fa-download"></i> Export Report
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {viewMode === 'overview' && renderOverviewTab()}
        {viewMode === 'counselor' && renderCounselorTab()}
        {viewMode === 'center' && renderCenterTab()}
        {viewMode === 'lead' && renderLeadTab()}
      </div>

      <style jsx>{`
        .counselor-performance-dashboard {
          padding: 2rem;
          background: #f8f9fa;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .dashboard-header h3 {
          margin: 0;
          color: #2c3e50;
          font-weight: 700;
        }

        .header-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .date-filter {
          padding: 0.5rem 1rem;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a67d8;
          transform: translateY(-1px);
        }

        .btn-outline-secondary {
          background: white;
          color: #6c757d;
          border: 1px solid #dee2e6;
        }

        .btn-outline-secondary:hover {
          background: #f8f9fa;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        /* Overview Tab Styles */
        .overview-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .summary-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .summary-header h4 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .text-muted {
          color: #6c757d;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
        }

        .metric-card.success { border-left: 4px solid #28a745; }
        .metric-card.warning { border-left: 4px solid #ffc107; }
        .metric-card.danger { border-left: 4px solid #dc3545; }

        .metric-icon {
          font-size: 2rem;
          opacity: 0.8;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .metric-label {
          font-size: 0.9rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .charts-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .chart-container h5 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
        }

        .section-title {
          margin: 2rem 0 1rem 0;
          color: #2c3e50;
          font-weight: 600;
        }

        .counselors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .counselor-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .counselor-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          border: 1px solid #667eea;
        }

        .counselor-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .counselor-header img {
          border-radius: 50%;
          border: 3px solid #e9ecef;
        }

        .counselor-info h6 {
          margin: 0 0 0.25rem 0;
          color: #2c3e50;
        }

        .counselor-info p {
          margin: 0;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .counselor-stats {
          display: flex;
          justify-content: space-around;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #667eea;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6c757d;
          text-transform: uppercase;
        }

        /* Navigation Header */
        .navigation-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .navigation-header h4 {
          margin: 0;
          color: #2c3e50;
        }

        /* Counselor Detail View */
        .counselor-detail-view {
          animation: fadeIn 0.3s ease;
        }

        .counselor-summary {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .profile-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .profile-section img {
          border-radius: 50%;
          border: 4px solid #667eea;
        }

        .profile-details h5 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .profile-details p {
          margin: 0.25rem 0;
          color: #6c757d;
        }

        .centers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .center-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .center-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }

        .center-card h6 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
        }

        .center-metrics {
          margin-bottom: 1rem;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .lead-status-bar {
          display: flex;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 1rem;
        }

        .status-segment {
          transition: width 0.3s ease;
        }

        .status-segment.hot { background: #dc3545; }
        .status-segment.warm { background: #fd7e14; }
        .status-segment.cold { background: #6c757d; }

        /* Activities Timeline */
        .activities-timeline {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-time {
          font-size: 0.875rem;
          color: #6c757d;
          min-width: 100px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-action {
          margin: 0 0 0.25rem 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .activity-remarks {
          margin: 0 0 0.25rem 0;
          color: #6c757d;
          font-style: italic;
        }

        .activity-lead {
          margin: 0;
          font-size: 0.875rem;
          color: #667eea;
        }

        /* Center Detail View */
        .center-detail-view {
          animation: fadeIn 0.3s ease;
        }

        .center-summary {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .center-summary h5 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
        }

        .summary-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .course-summary-card {
          padding: 1rem;
          border: 1px solid #e9ecef;
          border-radius: 8px;
        }

        .course-summary-card h6 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .course-metrics {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        /* Leads Table */
        .leads-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .leads-table {
          width: 100%;
          border-collapse: collapse;
        }

        .leads-table th {
          background: #f8f9fa;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .leads-table td {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .leads-table tr:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        .candidate-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .candidate-cell strong {
          color: #2c3e50;
        }

        .candidate-cell small {
          color: #6c757d;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
        }

        .status-badge.hot { background: #dc3545; }
        .status-badge.warm { background: #fd7e14; }
        .status-badge.cold { background: #6c757d; }

        .kyc-status {
          font-size: 0.875rem;
        }

        .fee-status {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .fee-status.paid {
          background: #d4edda;
          color: #155724;
        }

        .fee-status.unpaid {
          background: #f8d7da;
          color: #721c24;
        }

        /* Lead Detail View */
        .lead-detail-view {
          animation: fadeIn 0.3s ease;
        }

        .lead-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .detail-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .detail-card.full-width {
          grid-column: 1 / -1;
        }

        .detail-card h5 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-weight: 600;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .info-item label {
          font-weight: 600;
          color: #6c757d;
        }

        .info-item span {
          color: #2c3e50;
        }

        /* Documents List */
        .documents-list {
          display: grid;
          gap: 0.75rem;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .document-item.pending { background: rgba(255, 193, 7, 0.1); }
        .document-item.verified { background: rgba(40, 167, 69, 0.1); }
        .document-item.rejected { background: rgba(220, 53, 69, 0.1); }

        .doc-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .doc-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .doc-status {
          font-size: 0.875rem;
        }

        .doc-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Followup List */
        .followup-list {
          display: grid;
          gap: 0.5rem;
        }

        .followup-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .followup-date {
          font-weight: 600;
          color: #2c3e50;
        }

        .followup-status {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .followup-status.done {
          background: #d4edda;
          color: #155724;
        }

        .followup-status.missed {
          background: #f8d7da;
          color: #721c24;
        }

        .followup-status.planned {
          background: #d1ecf1;
          color: #0c5460;
        }

        /* Assignment List */
        .assignment-list {
          display: grid;
          gap: 0.75rem;
        }

        .assignment-item {
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .assignment-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .assignment-info strong {
          color: #2c3e50;
        }

        .assignment-info span {
          font-size: 0.875rem;
          color: #6c757d;
        }

        /* Logs Timeline */
        .logs-timeline {
          max-height: 400px;
          overflow-y: auto;
        }

        .log-item {
          display: flex;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .log-item:last-child {
          border-bottom: none;
        }

        .log-time {
          font-size: 0.875rem;
          color: #6c757d;
          min-width: 150px;
        }

        .log-content {
          flex: 1;
        }

        .log-action {
          margin: 0 0 0.25rem 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .log-remarks {
          margin: 0;
          color: #6c757d;
          font-style: italic;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .counselor-performance-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-controls {
            flex-wrap: wrap;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .charts-row {
            grid-template-columns: 1fr;
          }

          .counselors-grid {
            grid-template-columns: 1fr;
          }

          .centers-grid {
            grid-template-columns: 1fr;
          }

          .lead-details-grid {
            grid-template-columns: 1fr;
          }

          .leads-table-container {
            overflow-x: auto;
          }

          .navigation-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CounselorPerformance;