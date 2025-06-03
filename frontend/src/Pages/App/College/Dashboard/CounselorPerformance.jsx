import React, { useState } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area,
  ComposedChart, FunnelChart, Funnel, LabelList, TreemapChart, Treemap
} from 'recharts';

const CounselorPerformance = () => {
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'counselor', 'center', 'batch', 'student'
  const [studentViewMode, setStudentViewMode] = useState('cards'); // 'cards', 'table'

  // Enhanced data structure with batch-wise distribution
  const [counselorData] = useState({
    counselors: [
      { 
        id: 1,
        name: 'Rahul Sharma', 
        email: 'rahul.sharma@college.com',
        phone: '+91 9876543210',
        assignedLeads: 125, 
        activeLeads: 89, 
        convertedLeads: 23, 
        conversionRate: 18.4,
        status: 'online',
        joiningDate: '2023-01-15',
        centers: [
          {
            centerId: 'center1',
            centerName: 'Delhi North',
            totalStudents: 85,
            totalBatches: 6,
            leadStatus: {
              hotLeads: 12,
              warmLeads: 25,
              coldLeads: 18,
              interestedLeads: 30
            },
            kycStats: {
              kycPending: 25,
              kycApproved: 58,
              kycRejected: 2
            },
            batches: [
              {
                batchId: 'batch1',
                batchName: 'FS-Delhi-Batch-01',
                courseName: 'Full Stack Development',
                startDate: '2024-01-15',
                endDate: '2024-07-15',
                duration: '6 months',
                status: 'active',
                capacity: 30,
                enrolled: 28,
                completed: 2,
                dropouts: 0,
                avgAttendance: 94.5,
                instructor: 'Prof. Amit Kumar',
                students: [
                  {
                    id: 'st1',
                    name: 'Arjun Kumar',
                    phone: '+91 9876543210',
                    email: 'arjun@email.com',
                    age: 22,
                    gender: 'Male',
                    address: 'Delhi, India',
                    fatherName: 'Rajesh Kumar',
                    motherName: 'Sunita Kumar',
                    qualification: 'B.Tech Computer Science',
                    workExperience: 'Fresher',
                    kycStatus: 'pending',
                    leadStatus: 'hot',
                    enrollmentDate: '2024-01-15',
                    attendance: 95.5,
                    performance: 'excellent',
                    fees: {
                      total: 50000,
                      paid: 25000,
                      pending: 25000,
                      installments: 2
                    },
                    kycDocuments: {
                      aadhaar: { status: 'pending', uploadDate: '2024-01-16', rejectionReason: '' },
                      pan: { status: 'approved', uploadDate: '2024-01-15', rejectionReason: '' },
                      photo: { status: 'pending', uploadDate: '2024-01-16', rejectionReason: '' },
                      signature: { status: 'approved', uploadDate: '2024-01-15', rejectionReason: '' },
                      qualification: { status: 'approved', uploadDate: '2024-01-15', rejectionReason: '' }
                    },
                    monthlyProgress: [
                      { month: 'Jan', attendance: 95, assignment: 88, test: 92 },
                      { month: 'Feb', attendance: 94, assignment: 90, test: 89 },
                      { month: 'Mar', attendance: 96, assignment: 85, test: 94 }
                    ]
                  },
                  {
                    id: 'st2',
                    name: 'Priya Sharma',
                    phone: '+91 9876543211',
                    email: 'priya@email.com',
                    age: 21,
                    gender: 'Female',
                    address: 'Delhi, India',
                    fatherName: 'Vikash Sharma',
                    motherName: 'Meera Sharma',
                    qualification: 'BCA',
                    workExperience: '6 months intern',
                    kycStatus: 'approved',
                    leadStatus: 'converted',
                    enrollmentDate: '2024-01-16',
                    attendance: 92.3,
                    performance: 'good',
                    fees: {
                      total: 50000,
                      paid: 50000,
                      pending: 0,
                      installments: 1
                    },
                    kycDocuments: {
                      aadhaar: { status: 'approved', uploadDate: '2024-01-14', rejectionReason: '' },
                      pan: { status: 'approved', uploadDate: '2024-01-14', rejectionReason: '' },
                      photo: { status: 'approved', uploadDate: '2024-01-14', rejectionReason: '' },
                      signature: { status: 'approved', uploadDate: '2024-01-14', rejectionReason: '' },
                      qualification: { status: 'approved', uploadDate: '2024-01-14', rejectionReason: '' }
                    },
                    monthlyProgress: [
                      { month: 'Jan', attendance: 92, assignment: 95, test: 88 },
                      { month: 'Feb', attendance: 93, assignment: 92, test: 90 },
                      { month: 'Mar', attendance: 91, assignment: 88, test: 92 }
                    ]
                  },
                  {
                    id: 'st3',
                    name: 'Vikash Singh',
                    phone: '+91 9876543212',
                    email: 'vikash@email.com',
                    age: 23,
                    gender: 'Male',
                    address: 'Noida, India',
                    fatherName: 'Ram Singh',
                    motherName: 'Sita Singh',
                    qualification: 'B.Sc IT',
                    workExperience: 'Fresher',
                    kycStatus: 'pending',
                    leadStatus: 'warm',
                    enrollmentDate: '2024-01-17',
                    attendance: 88.7,
                    performance: 'average',
                    fees: {
                      total: 50000,
                      paid: 15000,
                      pending: 35000,
                      installments: 3
                    },
                    kycDocuments: {
                      aadhaar: { status: 'approved', uploadDate: '2024-01-17', rejectionReason: '' },
                      pan: { status: 'pending', uploadDate: '2024-01-18', rejectionReason: '' },
                      photo: { status: 'rejected', uploadDate: '2024-01-17', rejectionReason: 'Poor image quality' },
                      signature: { status: 'pending', uploadDate: '2024-01-18', rejectionReason: '' },
                      qualification: { status: 'pending', uploadDate: '2024-01-18', rejectionReason: '' }
                    },
                    monthlyProgress: [
                      { month: 'Jan', attendance: 88, assignment: 75, test: 82 },
                      { month: 'Feb', attendance: 90, assignment: 78, test: 85 },
                      { month: 'Mar', attendance: 87, assignment: 80, test: 88 }
                    ]
                  }
                ]
              },
              {
                batchId: 'batch2',
                batchName: 'DS-Delhi-Batch-01',
                courseName: 'Data Science',
                startDate: '2024-02-01',
                endDate: '2024-08-01',
                duration: '6 months',
                status: 'active',
                capacity: 25,
                enrolled: 22,
                completed: 0,
                dropouts: 3,
                avgAttendance: 91.2,
                instructor: 'Dr. Sarah Wilson',
                students: [
                  {
                    id: 'st4',
                    name: 'Anjali Patel',
                    phone: '+91 9876543213',
                    email: 'anjali@email.com',
                    age: 24,
                    gender: 'Female',
                    address: 'Delhi, India',
                    fatherName: 'Suresh Patel',
                    motherName: 'Kavita Patel',
                    qualification: 'M.Sc Mathematics',
                    workExperience: '1 year analyst',
                    kycStatus: 'approved',
                    leadStatus: 'converted',
                    enrollmentDate: '2024-02-01',
                    attendance: 97.2,
                    performance: 'excellent',
                    fees: {
                      total: 60000,
                      paid: 60000,
                      pending: 0,
                      installments: 1
                    },
                    kycDocuments: {
                      aadhaar: { status: 'approved', uploadDate: '2024-01-30', rejectionReason: '' },
                      pan: { status: 'approved', uploadDate: '2024-01-30', rejectionReason: '' },
                      photo: { status: 'approved', uploadDate: '2024-01-30', rejectionReason: '' },
                      signature: { status: 'approved', uploadDate: '2024-01-30', rejectionReason: '' },
                      qualification: { status: 'approved', uploadDate: '2024-01-30', rejectionReason: '' }
                    },
                    monthlyProgress: [
                      { month: 'Feb', attendance: 97, assignment: 95, test: 96 },
                      { month: 'Mar', attendance: 98, assignment: 97, test: 98 },
                      { month: 'Apr', attendance: 96, assignment: 94, test: 95 }
                    ]
                  }
                ]
              }
            ]
          },
          {
            centerId: 'center2',
            centerName: 'Hamirpur',
            totalStudents: 45,
            totalBatches: 3,
            leadStatus: {
              hotLeads: 8,
              warmLeads: 15,
              coldLeads: 12,
              interestedLeads: 10
            },
            kycStats: {
              kycPending: 15,
              kycApproved: 28,
              kycRejected: 2
            },
            batches: [
              {
                batchId: 'batch3',
                batchName: 'DM-Hamirpur-Batch-01',
                courseName: 'Digital Marketing',
                startDate: '2024-01-20',
                endDate: '2024-05-20',
                duration: '4 months',
                status: 'active',
                capacity: 20,
                enrolled: 18,
                completed: 1,
                dropouts: 1,
                avgAttendance: 89.5,
                instructor: 'Ms. Pooja Sharma',
                students: [
                  {
                    id: 'st5',
                    name: 'Rohit Gupta',
                    phone: '+91 9876543214',
                    email: 'rohit@email.com',
                    age: 20,
                    gender: 'Male',
                    address: 'Hamirpur, HP',
                    fatherName: 'Dinesh Gupta',
                    motherName: 'Asha Gupta',
                    qualification: 'B.Com',
                    workExperience: 'Fresher',
                    kycStatus: 'pending',
                    leadStatus: 'interested',
                    enrollmentDate: '2024-01-20',
                    attendance: 89.5,
                    performance: 'good',
                    fees: {
                      total: 30000,
                      paid: 20000,
                      pending: 10000,
                      installments: 2
                    },
                    kycDocuments: {
                      aadhaar: { status: 'pending', uploadDate: '2024-01-21', rejectionReason: '' },
                      pan: { status: 'approved', uploadDate: '2024-01-20', rejectionReason: '' },
                      photo: { status: 'pending', uploadDate: '2024-01-21', rejectionReason: '' },
                      signature: { status: 'approved', uploadDate: '2024-01-20', rejectionReason: '' },
                      qualification: { status: 'approved', uploadDate: '2024-01-20', rejectionReason: '' }
                    },
                    monthlyProgress: [
                      { month: 'Jan', attendance: 89, assignment: 82, test: 86 },
                      { month: 'Feb', attendance: 91, assignment: 85, test: 88 },
                      { month: 'Mar', attendance: 88, assignment: 87, test: 90 }
                    ]
                  }
                ]
              }
            ]
          },
          {
            centerId: 'center3',
            centerName: 'Shahpur',
            totalStudents: 32,
            totalBatches: 2,
            leadStatus: {
              hotLeads: 6,
              warmLeads: 12,
              coldLeads: 8,
              interestedLeads: 6
            },
            kycStats: {
              kycPending: 12,
              kycApproved: 18,
              kycRejected: 2
            },
            batches: [
              {
                batchId: 'batch4',
                batchName: 'UX-Shahpur-Batch-01',
                courseName: 'UI/UX Design',
                startDate: '2024-02-15',
                endDate: '2024-07-15',
                duration: '5 months',
                status: 'active',
                capacity: 20,
                enrolled: 16,
                completed: 0,
                dropouts: 0,
                avgAttendance: 93.8,
                instructor: 'Mr. Rajesh Kumar',
                students: [
                  {
                    id: 'st6',
                    name: 'Sonia Kapoor',
                    phone: '+91 9876543215',
                    email: 'sonia@email.com',
                    age: 22,
                    gender: 'Female',
                    address: 'Shahpur, HP',
                    fatherName: 'Anil Kapoor',
                    motherName: 'Sunita Kapoor',
                    qualification: 'B.Des',
                    workExperience: 'Intern - 3 months',
                    kycStatus: 'approved',
                    leadStatus: 'converted',
                    enrollmentDate: '2024-02-15',
                    attendance: 94.8,
                    performance: 'excellent',
                    fees: {
                      total: 45000,
                      paid: 30000,
                      pending: 15000,
                      installments: 2
                    },
                    kycDocuments: {
                      aadhaar: { status: 'approved', uploadDate: '2024-02-14', rejectionReason: '' },
                      pan: { status: 'approved', uploadDate: '2024-02-14', rejectionReason: '' },
                      photo: { status: 'approved', uploadDate: '2024-02-14', rejectionReason: '' },
                      signature: { status: 'approved', uploadDate: '2024-02-14', rejectionReason: '' },
                      qualification: { status: 'approved', uploadDate: '2024-02-14', rejectionReason: '' }
                    },
                    monthlyProgress: [
                      { month: 'Feb', attendance: 95, assignment: 92, test: 94 },
                      { month: 'Mar', attendance: 96, assignment: 94, test: 96 },
                      { month: 'Apr', attendance: 93, assignment: 90, test: 93 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });

  const getPerformanceColor = (performance) => {
    switch(performance?.toLowerCase()) {
      case 'excellent': return '#28a745';
      case 'good': return '#17a2b8';
      case 'average': return '#ffc107';
      case 'poor': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getKycDocumentStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '⏳';
    }
  };

  const getLeadStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'hot': return '#dc3545';
      case 'warm': return '#fd7e14';
      case 'cold': return '#6c757d';
      case 'interested': return '#28a745';
      case 'converted': return '#198754';
      default: return '#6c757d';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderOverviewTab = () => (
    <div className="overview-content">
      <div className="summary-header">
        <h4>📊 Counselor Performance Overview</h4>
        <p className="text-muted">Click on any counselor to view detailed center-wise performance</p>
      </div>

      <div className="counselors-grid">
        {counselorData.counselors.map((counselor) => (
          <div key={counselor.id} className="counselor-overview-card" 
               onClick={() => {
                 setSelectedCounselor(counselor);
                 setViewMode('counselor');
               }}>
            <div className="counselor-header">
              <div className="counselor-avatar">
                <img src={`https://ui-avatars.com/api/?name=${counselor.name}&background=667eea&color=fff&size=60`} alt={counselor.name} />
                <div className={`status-dot ${counselor.status}`}></div>
              </div>
              <div className="counselor-info">
                <h5>{counselor.name}</h5>
                <p>{counselor.centers.length} Centers</p>
              </div>
            </div>
            
            <div className="centers-summary">
              {counselor.centers.map((center, idx) => (
                <div key={center.centerId} className="center-pill">
                  <span className="center-name">{center.centerName}</span>
                  <span className="center-stats">{center.totalStudents} students</span>
                </div>
              ))}
            </div>

            <div className="counselor-metrics">
              <div className="metric-item">
                <span className="metric-value">{counselor.convertedLeads}</span>
                <span className="metric-label">Conversions</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{counselor.conversionRate}%</span>
                <span className="metric-label">Rate</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCounselorTab = () => {
    if (!selectedCounselor) return null;

    return (
      <div className="counselor-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('overview')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Overview
          </button>
          <h4>{selectedCounselor.name} - Center Management</h4>
        </div>

        <div className="counselor-summary-card">
          <div className="counselor-profile">
            <img src={`https://ui-avatars.com/api/?name=${selectedCounselor.name}&background=667eea&color=fff&size=80`} alt={selectedCounselor.name} />
            <div className="profile-details">
              <h3>{selectedCounselor.name}</h3>
              <p>{selectedCounselor.email}</p>
              <p>{selectedCounselor.phone}</p>
            </div>
          </div>
        </div>

        <div className="centers-grid">
          {selectedCounselor.centers.map((center) => (
            <div key={center.centerId} className="center-detail-card"
                 onClick={() => {
                   setSelectedCenter(center);
                   setViewMode('center');
                 }}>
              <div className="center-header">
                <h5>🏢 {center.centerName}</h5>
                <span className="center-badge">{center.totalBatches} Batches</span>
              </div>

              <div className="center-stats-grid">
                <div className="stat-box">
                  <span className="stat-number">{center.totalStudents}</span>
                  <span className="stat-label">Total Students</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{center.kycStats.kycApproved}</span>
                  <span className="stat-label">KYC Approved</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{center.kycStats.kycPending}</span>
                  <span className="stat-label">KYC Pending</span>
                </div>
              </div>

              <div className="lead-status-mini">
                <h6>Lead Distribution</h6>
                <div className="status-mini-grid">
                  <div className="status-mini hot">
                    <span className="count">{center.leadStatus.hotLeads}</span>
                    <span className="label">Hot</span>
                  </div>
                  <div className="status-mini warm">
                    <span className="count">{center.leadStatus.warmLeads}</span>
                    <span className="label">Warm</span>
                  </div>
                  <div className="status-mini cold">
                    <span className="count">{center.leadStatus.coldLeads}</span>
                    <span className="label">Cold</span>
                  </div>
                  <div className="status-mini interested">
                    <span className="count">{center.leadStatus.interestedLeads}</span>
                    <span className="label">Interested</span>
                  </div>
                </div>
              </div>

              <div className="batches-preview">
                <h6>Batches Overview</h6>
                {center.batches.map((batch, idx) => (
                  <div key={batch.batchId} className="batch-mini">
                    <span className="batch-name">{batch.batchName}</span>
                    <span className="batch-students">{batch.enrolled}/{batch.capacity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCenterTab = () => {
    if (!selectedCenter) return null;

    const batchDistributionData = selectedCenter.batches.map(batch => ({
      name: batch.batchName,
      students: batch.enrolled,
      capacity: batch.capacity,
      fill: `hsl(${Math.random() * 360}, 70%, 60%)`
    }));

    return (
      <div className="center-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('counselor')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Centers
          </button>
          <h4>🏢 {selectedCenter.centerName} - Batch Management</h4>
        </div>

        <div className="center-overview-cards">
          <div className="center-summary-card">
            <h5>Center Overview</h5>
            <div className="center-metrics">
              <div className="metric-large">
                <span className="number">{selectedCenter.totalStudents}</span>
                <span className="label">Total Students</span>
              </div>
              <div className="metric-large">
                <span className="number">{selectedCenter.totalBatches}</span>
                <span className="label">Active Batches</span>
              </div>
            </div>
          </div>

          <div className="batch-distribution-chart">
            <h5>📊 Batch Distribution</h5>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={batchDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="students"
                  label={({ name, students }) => `${name}: ${students}`}
                >
                  {batchDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="batches-detailed-grid">
          {selectedCenter.batches.map((batch) => (
            <div key={batch.batchId} className="batch-detail-card"
                 onClick={() => {
                   setSelectedBatch(batch);
                   setViewMode('batch');
                 }}>
              <div className="batch-header">
                <h5>{batch.batchName}</h5>
                <span className={`batch-status ${batch.status}`}>{batch.status}</span>
              </div>

              <div className="batch-info">
                <p><strong>Course:</strong> {batch.courseName}</p>
                <p><strong>Instructor:</strong> {batch.instructor}</p>
                <p><strong>Duration:</strong> {batch.duration}</p>
                <p><strong>Start Date:</strong> {new Date(batch.startDate).toLocaleDateString()}</p>
              </div>

              <div className="batch-progress">
                <div className="progress-item">
                  <span className="progress-label">Enrollment</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(batch.enrolled / batch.capacity) * 100}%` }}></div>
                    </div>
                    <span className="progress-text">{batch.enrolled}/{batch.capacity}</span>
                  </div>
                </div>
                <div className="progress-item">
                  <span className="progress-label">Attendance</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${batch.avgAttendance}%` }}></div>
                    </div>
                    <span className="progress-text">{batch.avgAttendance}%</span>
                  </div>
                </div>
              </div>

              <div className="batch-stats">
                <div className="stat-mini">
                  <span className="stat-value">{batch.students.length}</span>
                  <span className="stat-label">Students</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-value">{batch.completed}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-value">{batch.dropouts}</span>
                  <span className="stat-label">Dropouts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBatchTab = () => {
    if (!selectedBatch) return null;

    return (
      <div className="batch-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('center')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Batches
          </button>
          <h4>📚 {selectedBatch.batchName} - Student Management</h4>
        </div>

        <div className="batch-overview-section">
          <div className="batch-info-card">
            <h5>Batch Information</h5>
            <div className="batch-details-grid">
              <div className="detail-item">
                <span className="detail-label">Course:</span>
                <span className="detail-value">{selectedBatch.courseName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Instructor:</span>
                <span className="detail-value">{selectedBatch.instructor}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{selectedBatch.duration}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Capacity:</span>
                <span className="detail-value">{selectedBatch.enrolled}/{selectedBatch.capacity}</span>
              </div>
            </div>
          </div>

          <div className="student-view-controls">
            <h5>Students ({selectedBatch.students.length})</h5>
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${studentViewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setStudentViewMode('cards')}
              >
                <i className="fas fa-th-large"></i> Cards
              </button>
              <button 
                className={`toggle-btn ${studentViewMode === 'table' ? 'active' : ''}`}
                onClick={() => setStudentViewMode('table')}
              >
                <i className="fas fa-table"></i> Table
              </button>
            </div>
          </div>
        </div>

        {studentViewMode === 'cards' ? (
          <div className="students-cards-grid">
            {selectedBatch.students.map((student) => (
              <div key={student.id} className="student-card"
                   onClick={() => {
                     setSelectedStudent(student);
                     setViewMode('student');
                   }}>
                <div className="student-header">
                  <div className="student-avatar">
                    <img src={`https://ui-avatars.com/api/?name=${student.name}&background=${student.kycStatus === 'approved' ? '28a745' : 'ffc107'}&color=${student.kycStatus === 'approved' ? 'fff' : '000'}&size=50`} alt={student.name} />
                    <div className={`kyc-indicator ${student.kycStatus}`}>
                      {student.kycStatus === 'approved' ? '✅' : '⏳'}
                    </div>
                  </div>
                  <div className="student-basic-info">
                    <h6>{student.name}</h6>
                    <p>{student.email}</p>
                    <p>{student.phone}</p>
                  </div>
                </div>

                <div className="student-status-indicators">
                  <span className={`lead-badge ${student.leadStatus}`}>
                    {student.leadStatus}
                  </span>
                  <span className={`performance-badge ${student.performance}`}>
                    {student.performance}
                  </span>
                </div>

                <div className="student-quick-stats">
                  <div className="quick-stat">
                    <span className="stat-value">{student.attendance}%</span>
                    <span className="stat-label">Attendance</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-value">{student.age}</span>
                    <span className="stat-label">Age</span>
                  </div>
                </div>

                <div className="kyc-progress-mini">
                  <div className="kyc-documents-mini">
                    {Object.entries(student.kycDocuments).map(([doc, details]) => (
                      <span key={doc} className={`doc-mini ${details.status}`}>
                        {getKycDocumentStatusIcon(details.status)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="students-table-view">
            <div className="table-responsive">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>KYC</th>
                    <th>Performance</th>
                    <th>Fees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBatch.students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <img src={`https://ui-avatars.com/api/?name=${student.name}&background=667eea&color=fff&size=40`} alt={student.name} />
                          <div>
                            <div className="student-name">{student.name}</div>
                            <div className="student-qualification">{student.qualification}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <div>{student.phone}</div>
                          <div>{student.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          <span className={`lead-badge ${student.leadStatus}`}>{student.leadStatus}</span>
                          <span className={`kyc-badge ${student.kycStatus}`}>{student.kycStatus}</span>
                        </div>
                      </td>
                      <td>
                        <div className="kyc-cell">
                          {Object.entries(student.kycDocuments).map(([doc, details]) => (
                            <span key={doc} className={`doc-status ${details.status}`}>
                              {getKycDocumentStatusIcon(details.status)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="performance-cell">
                          <span className={`performance-badge ${student.performance}`}>{student.performance}</span>
                          <div className="attendance-mini">{student.attendance}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="fees-cell">
                          <div className="fees-paid">{formatCurrency(student.fees.paid)}</div>
                          <div className="fees-pending">Pending: {formatCurrency(student.fees.pending)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn btn-sm btn-primary" onClick={() => {
                            setSelectedStudent(student);
                            setViewMode('student');
                          }}>
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-warning">
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStudentTab = () => {
    if (!selectedStudent) return null;

    return (
      <div className="student-detail-view">
        <div className="navigation-header">
          <button className="btn btn-outline-secondary" onClick={() => setViewMode('batch')}>
            <i className="fas fa-arrow-left me-2"></i>Back to Students
          </button>
          <h4>👨‍🎓 {selectedStudent.name} - Complete Profile</h4>
        </div>

        <div className="student-profile-section">
          <div className="student-profile-card">
            <div className="profile-header">
              <div className="profile-avatar-large">
                <img src={`https://ui-avatars.com/api/?name=${selectedStudent.name}&background=667eea&color=fff&size=100`} alt={selectedStudent.name} />
                <div className={`status-ring ${selectedStudent.kycStatus}`}></div>
              </div>
              <div className="profile-info">
                <h3>{selectedStudent.name}</h3>
                <p className="qualification">{selectedStudent.qualification}</p>
                <div className="contact-info">
                  <span><i className="fas fa-phone"></i> {selectedStudent.phone}</span>
                  <span><i className="fas fa-envelope"></i> {selectedStudent.email}</span>
                  <span><i className="fas fa-map-marker-alt"></i> {selectedStudent.address}</span>
                </div>
              </div>
              <div className="profile-badges">
                <span className={`status-badge ${selectedStudent.leadStatus}`}>{selectedStudent.leadStatus}</span>
                <span className={`performance-badge ${selectedStudent.performance}`}>{selectedStudent.performance}</span>
                <span className={`kyc-badge ${selectedStudent.kycStatus}`}>KYC: {selectedStudent.kycStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="student-details-grid">
          <div className="personal-details-card">
            <h5>👤 Personal Information</h5>
            <div className="details-grid">
              <div className="detail-row">
                <span className="label">Age:</span>
                <span className="value">{selectedStudent.age} years</span>
              </div>
              <div className="detail-row">
                <span className="label">Gender:</span>
                <span className="value">{selectedStudent.gender}</span>
              </div>
              <div className="detail-row">
                <span className="label">Father's Name:</span>
                <span className="value">{selectedStudent.fatherName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Mother's Name:</span>
                <span className="value">{selectedStudent.motherName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Work Experience:</span>
                <span className="value">{selectedStudent.workExperience}</span>
              </div>
              <div className="detail-row">
                <span className="label">Enrollment Date:</span>
                <span className="value">{new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="academic-details-card">
            <h5>📊 Academic Performance</h5>
            <div className="performance-metrics">
              <div className="metric-card">
                <span className="metric-value">{selectedStudent.attendance}%</span>
                <span className="metric-label">Attendance</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${selectedStudent.attendance}%` }}></div>
                </div>
              </div>
            </div>
            <div className="monthly-progress-chart">
              <h6>Monthly Progress</h6>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selectedStudent.monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#28a745" strokeWidth={2} name="Attendance" />
                  <Line type="monotone" dataKey="assignment" stroke="#17a2b8" strokeWidth={2} name="Assignments" />
                  <Line type="monotone" dataKey="test" stroke="#ffc107" strokeWidth={2} name="Tests" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="fees-details-card">
            <h5>💰 Fee Details</h5>
            <div className="fees-summary">
              <div className="fee-item">
                <span className="fee-label">Total Fees:</span>
                <span className="fee-value">{formatCurrency(selectedStudent.fees.total)}</span>
              </div>
              <div className="fee-item">
                <span className="fee-label">Paid:</span>
                <span className="fee-value paid">{formatCurrency(selectedStudent.fees.paid)}</span>
              </div>
              <div className="fee-item">
                <span className="fee-label">Pending:</span>
                <span className="fee-value pending">{formatCurrency(selectedStudent.fees.pending)}</span>
              </div>
              <div className="fee-item">
                <span className="fee-label">Installments:</span>
                <span className="fee-value">{selectedStudent.fees.installments}</span>
              </div>
            </div>
            <div className="fee-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(selectedStudent.fees.paid / selectedStudent.fees.total) * 100}%` }}></div>
              </div>
              <span className="progress-text">{((selectedStudent.fees.paid / selectedStudent.fees.total) * 100).toFixed(1)}% Paid</span>
            </div>
          </div>

          <div className="kyc-documents-card">
            <h5>📋 KYC Documents</h5>
            <div className="documents-grid">
              {Object.entries(selectedStudent.kycDocuments).map(([docType, details]) => (
                <div key={docType} className={`document-item ${details.status}`}>
                  <div className="document-header">
                    <span className="document-icon">{getKycDocumentStatusIcon(details.status)}</span>
                    <span className="document-name">{docType.charAt(0).toUpperCase() + docType.slice(1)}</span>
                  </div>
                  <div className="document-details">
                    <div className="document-status">{details.status}</div>
                    <div className="upload-date">Uploaded: {new Date(details.uploadDate).toLocaleDateString()}</div>
                    {details.rejectionReason && (
                      <div className="rejection-reason">Reason: {details.rejectionReason}</div>
                    )}
                  </div>
                  <div className="document-actions">
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="fas fa-eye"></i> View
                    </button>
                    {details.status === 'pending' && (
                      <div className="approval-actions">
                        <button className="btn btn-sm btn-success">
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button className="btn btn-sm btn-danger">
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </div>
                    )}
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
    <div className="enhanced-counselor-performance">
      <div className="performance-header">
        <h3>👥 Advanced Counselor & Student Management System</h3>
        <p className="text-muted">Comprehensive tracking from counselors to individual students with batch-wise distribution</p>
      </div>

      <div className="breadcrumb-navigation">
        <div className="breadcrumb">
          <span className={`breadcrumb-item ${viewMode === 'overview' ? 'active' : ''}`} 
                onClick={() => setViewMode('overview')}>
            📊 Overview
          </span>
          {selectedCounselor && (
            <>
              <i className="fas fa-chevron-right"></i>
              <span className={`breadcrumb-item ${viewMode === 'counselor' ? 'active' : ''}`}
                    onClick={() => setViewMode('counselor')}>
                👨‍💼 {selectedCounselor.name}
              </span>
            </>
          )}
          {selectedCenter && (
            <>
              <i className="fas fa-chevron-right"></i>
              <span className={`breadcrumb-item ${viewMode === 'center' ? 'active' : ''}`}
                    onClick={() => setViewMode('center')}>
                🏢 {selectedCenter.centerName}
              </span>
            </>
          )}
          {selectedBatch && (
            <>
              <i className="fas fa-chevron-right"></i>
              <span className={`breadcrumb-item ${viewMode === 'batch' ? 'active' : ''}`}
                    onClick={() => setViewMode('batch')}>
                📚 {selectedBatch.batchName}
              </span>
            </>
          )}
          {selectedStudent && (
            <>
              <i className="fas fa-chevron-right"></i>
              <span className={`breadcrumb-item ${viewMode === 'student' ? 'active' : ''}`}>
                👨‍🎓 {selectedStudent.name}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="view-content">
        {viewMode === 'overview' && renderOverviewTab()}
        {viewMode === 'counselor' && renderCounselorTab()}
        {viewMode === 'center' && renderCenterTab()}
        {viewMode === 'batch' && renderBatchTab()}
        {viewMode === 'student' && renderStudentTab()}
      </div>

      <style jsx>{`
        .enhanced-counselor-performance {
          padding: 2rem;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .performance-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .performance-header h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .breadcrumb-navigation {
          background: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .breadcrumb-item {
          color: #6c757d;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .breadcrumb-item:hover {
          color: #667eea;
        }

        .breadcrumb-item.active {
          color: #667eea;
          font-weight: 700;
        }

        /* Overview Tab Styles */
        .summary-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .counselors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .counselor-overview-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .counselor-overview-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .counselor-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .counselor-avatar {
          position: relative;
        }

        .counselor-avatar img {
          border-radius: 50%;
          border: 3px solid #667eea;
        }

        .status-dot {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-dot.online { background: #28a745; }
        .status-dot.away { background: #ffc107; }
        .status-dot.offline { background: #6c757d; }

        .counselor-info h5 {
          margin: 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .centers-summary {
          margin-bottom: 1.5rem;
        }

        .center-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 25px;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .center-name {
          font-size: 0.9rem;
        }

        .center-stats {
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .counselor-metrics {
          display: flex;
          justify-content: space-around;
        }

        .metric-item {
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .metric-label {
          font-size: 0.8rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Navigation Header */
        .navigation-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1rem 0;
        }

        .navigation-header h4 {
          margin: 0;
          font-weight: 700;
          color: #2c3e50;
        }

        /* Counselor Detail View */
        .counselor-summary-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .counselor-profile {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .counselor-profile img {
          border-radius: 50%;
          border: 4px solid #667eea;
        }

        .profile-details h3 {
          margin: 0 0 0.5rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .profile-details p {
          margin: 0.25rem 0;
          color: #6c757d;
        }

        .centers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
        }

        .center-detail-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .center-detail-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .center-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .center-header h5 {
          margin: 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .center-badge {
          background: #667eea;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .center-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-box {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .lead-status-mini h6 {
          margin: 0 0 1rem 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .status-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .status-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .status-mini.hot { border-left: 3px solid #dc3545; }
        .status-mini.warm { border-left: 3px solid #fd7e14; }
        .status-mini.cold { border-left: 3px solid #6c757d; }
        .status-mini.interested { border-left: 3px solid #28a745; }

        .status-mini .count {
          font-weight: 700;
          color: #2c3e50;
        }

        .status-mini .label {
          font-size: 0.7rem;
          color: #6c757d;
          text-transform: uppercase;
        }

        .batches-preview h6 {
          margin: 1.5rem 0 1rem 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .batch-mini {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .batch-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .batch-students {
          font-size: 0.8rem;
          color: #6c757d;
        }

        /* Center Detail View */
        .center-overview-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .center-summary-card, .batch-distribution-chart {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .center-summary-card h5, .batch-distribution-chart h5 {
          margin: 0 0 1.5rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .center-metrics {
          display: flex;
          justify-content: space-around;
        }

        .metric-large {
          text-align: center;
        }

        .metric-large .number {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .metric-large .label {
          font-size: 0.9rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .batches-detailed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .batch-detail-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .batch-detail-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .batch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .batch-header h5 {
          margin: 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .batch-status {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .batch-status.active {
          background: #28a745;
          color: white;
        }

        .batch-info {
          margin-bottom: 1.5rem;
        }

        .batch-info p {
          margin: 0.5rem 0;
          color: #6c757d;
        }

        .batch-progress {
          margin-bottom: 1.5rem;
        }

        .progress-item {
          margin-bottom: 1rem;
        }

        .progress-label {
          display: block;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .progress-bar-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
          min-width: 50px;
        }

        .batch-stats {
          display: flex;
          justify-content: space-around;
        }

        .stat-mini {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: #667eea;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Batch Detail View */
        .batch-overview-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .batch-info-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .batch-info-card h5 {
          margin: 0 0 1.5rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .batch-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .detail-label {
          font-weight: 600;
          color: #6c757d;
        }

        .detail-value {
          font-weight: 700;
          color: #2c3e50;
        }

        .student-view-controls {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .student-view-controls h5 {
          margin: 0 0 1.5rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
        }

        .toggle-btn {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          color: #6c757d;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toggle-btn:hover {
          background: #e9ecef;
          border-color: #667eea;
          color: #667eea;
        }

        .toggle-btn.active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        /* Students Cards View */
        .students-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .student-card {
          background: white;
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .student-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .student-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .student-avatar {
          position: relative;
        }

        .student-avatar img {
          border-radius: 50%;
          border: 2px solid #e9ecef;
        }

        .kyc-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          border: 2px solid white;
        }

        .kyc-indicator.approved {
          background: #28a745;
        }

        .kyc-indicator.pending {
          background: #ffc107;
        }

        .student-basic-info h6 {
          margin: 0 0 0.25rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .student-basic-info p {
          margin: 0.125rem 0;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .student-status-indicators {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .lead-badge, .performance-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 15px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
        }

        .lead-badge.hot { background: #dc3545; }
        .lead-badge.warm { background: #fd7e14; }
        .lead-badge.cold { background: #6c757d; }
        .lead-badge.interested { background: #28a745; }
        .lead-badge.converted { background: #198754; }

        .performance-badge.excellent { background: #28a745; }
        .performance-badge.good { background: #17a2b8; }
        .performance-badge.average { background: #ffc107; color: #212529; }
        .performance-badge.poor { background: #dc3545; }

        .student-quick-stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 1rem;
        }

        .quick-stat {
          text-align: center;
        }

        .quick-stat .stat-value {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: #667eea;
        }

        .quick-stat .stat-label {
          font-size: 0.7rem;
          color: #6c757d;
          text-transform: uppercase;
        }

        .kyc-progress-mini {
          border-top: 1px solid #e9ecef;
          padding-top: 1rem;
        }

        .kyc-documents-mini {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .doc-mini {
          font-size: 1.2rem;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .doc-mini.pending { background: rgba(255, 193, 7, 0.2); }
        .doc-mini.approved { background: rgba(40, 167, 69, 0.2); }
        .doc-mini.rejected { background: rgba(220, 53, 69, 0.2); }

        /* Students Table View */
        .students-table-view {
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .students-table {
          width: 100%;
          margin: 0;
          border-collapse: collapse;
        }

        .students-table th {
          background: #f8f9fa;
          padding: 1rem;
          font-weight: 600;
          color: #2c3e50;
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.8rem;
        }

        .students-table td {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }

        .students-table tr:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        .student-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .student-cell img {
          border-radius: 50%;
        }

        .student-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .student-qualification {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .contact-cell div {
          font-size: 0.8rem;
          color: #6c757d;
          margin: 0.125rem 0;
        }

        .status-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .kyc-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 15px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
        }

        .kyc-badge.approved { background: #28a745; }
        .kyc-badge.pending { background: #ffc107; color: #212529; }
        .kyc-badge.rejected { background: #dc3545; }

        .kyc-cell {
          display: flex;
          gap: 0.25rem;
        }

        .doc-status {
          font-size: 1rem;
          padding: 0.125rem;
        }

        .performance-cell {
          text-align: center;
        }

        .attendance-mini {
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        .fees-cell {
          text-align: right;
        }

        .fees-paid {
          font-weight: 600;
          color: #28a745;
        }

        .fees-pending {
          font-size: 0.8rem;
          color: #dc3545;
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        /* Student Detail View */
        .student-profile-section {
          margin-bottom: 2rem;
        }

        .student-profile-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .profile-avatar-large {
          position: relative;
        }

        .profile-avatar-large img {
          border-radius: 50%;
          border: 4px solid #667eea;
        }

        .status-ring {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 4px solid white;
        }

        .status-ring.approved { background: #28a745; }
        .status-ring.pending { background: #ffc107; }
        .status-ring.rejected { background: #dc3545; }

        .profile-info h3 {
          margin: 0 0 0.5rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .qualification {
          font-size: 1.1rem;
          color: #667eea;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .contact-info span {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .contact-info i {
          margin-right: 0.5rem;
          color: #667eea;
          width: 16px;
        }

        .profile-badges {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-weight: 600;
          text-align: center;
          color: white;
        }

        .student-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .personal-details-card, .academic-details-card, .fees-details-card, .kyc-documents-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .personal-details-card h5, .academic-details-card h5, .fees-details-card h5, .kyc-documents-card h5 {
          margin: 0 0 1.5rem 0;
          font-weight: 700;
          color: #2c3e50;
        }

        .details-grid {
          display: grid;
          gap: 0.75rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .detail-row .label {
          font-weight: 600;
          color: #6c757d;
        }

        .detail-row .value {
          font-weight: 700;
          color: #2c3e50;
        }

        .performance-metrics {
          margin-bottom: 1.5rem;
        }

        .metric-card {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 1rem;
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .metric-label {
          font-size: 0.9rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
        }

        .metric-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
          transition: width 0.3s ease;
        }

        .monthly-progress-chart h6 {
          margin: 0 0 1rem 0;
          font-weight: 600;
          color: #2c3e50;
        }

        .fees-summary {
          margin-bottom: 1.5rem;
        }

        .fee-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .fee-label {
          font-weight: 600;
          color: #6c757d;
        }

        .fee-value {
          font-weight: 700;
          color: #2c3e50;
        }

        .fee-value.paid {
          color: #28a745;
        }

        .fee-value.pending {
          color: #dc3545;
        }

        .fee-progress {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .fee-progress .progress-bar {
          flex: 1;
          height: 10px;
          background: #e9ecef;
          border-radius: 5px;
          overflow: hidden;
        }

        .fee-progress .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
        }

        .fee-progress .progress-text {
          font-weight: 600;
          color: #2c3e50;
          min-width: 80px;
        }

        .documents-grid {
          display: grid;
          gap: 1rem;
        }

        .document-item {
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .document-item.pending {
          border-color: #ffc107;
          background: rgba(255, 193, 7, 0.05);
        }

        .document-item.approved {
          border-color: #28a745;
          background: rgba(40, 167, 69, 0.05);
        }

        .document-item.rejected {
          border-color: #dc3545;
          background: rgba(220, 53, 69, 0.05);
        }

        .document-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .document-icon {
          font-size: 1.2rem;
        }

        .document-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .document-details {
          margin-bottom: 1rem;
        }

        .document-status {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .upload-date {
          font-size: 0.8rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }

        .rejection-reason {
          font-size: 0.8rem;
          color: #dc3545;
          font-style: italic;
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .approval-actions {
          display: flex;
          gap: 0.25rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .enhanced-counselor-performance {
            padding: 1rem;
          }
          
          .counselors-grid {
            grid-template-columns: 1fr;
          }
          
          .centers-grid {
            grid-template-columns: 1fr;
          }
          
          .batches-detailed-grid {
            grid-template-columns: 1fr;
          }
          
          .students-cards-grid {
            grid-template-columns: 1fr;
          }
          
          .student-details-grid {
            grid-template-columns: 1fr;
          }
          
          .center-overview-cards {
            grid-template-columns: 1fr;
          }
          
          .batch-overview-section {
            grid-template-columns: 1fr;
          }
          
          .counselor-profile {
            flex-direction: column;
            text-align: center;
          }
          
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
          
          .breadcrumb {
            flex-wrap: wrap;
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