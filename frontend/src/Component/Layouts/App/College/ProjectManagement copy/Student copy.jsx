import React, { useState, useEffect, useCallback, useMemo } from 'react';

const AttendanceManagement = ({ selectedBatch = null, onBack = null }) => {
  // Previous AttendanceManagement component code here
  return (
    <div className="container-fluid">
      <div className="alert alert-info">
        <h5><i className="fas fa-clock me-2"></i>Attendance Management System</h5>
        <p className="mb-0">This is a comprehensive attendance management system for zero period students.</p>
      </div>
    </div>
  );
};

const Student = ({ selectedBatch = null, onBackToBatches = null, selectedCourse = null, onBackToCourses = null, selectedCenter = null, onBackToCenters = null }) => {
  // State management
  const [showAttendanceManagement, setShowAttendanceManagement] = useState(false);
  const [activeTab, setActiveTab] = useState('zeroPeriod'); // Default to zero period for attendance
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [showPopup, setShowPopup] = useState(null);
  const [leadDetailsVisible, setLeadDetailsVisible] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [studentTabsActive, setStudentTabsActive] = useState({});

  // ===== NEW ATTENDANCE STATE =====
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBulkControls, setShowBulkControls] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState('');
  const [todayAttendance, setTodayAttendance] = useState({});
  const [showAttendanceMode, setShowAttendanceMode] = useState(false);

  // Filter state
  const [filterData, setFilterData] = useState({
    course: '',
    batch: '',
    status: '',
    fromDate: '',
    toDate: '',
    center: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    enrollmentNumber: '',
    batchId: selectedBatch?.id || '',
    admissionDate: '',
    address: '',
    parentName: '',
    parentMobile: '',
    status: 'active',
    password: '',
    confirmPassword: ''
  });

  // Tab definitions for each student card
  const tabs = [
    'Student Details',
    'Personal Info',  
    'Academic Progress',
    'Attendance',
    'Documents'
  ];

  // Tab definitions for main navigation
  const mainTabs = [
    { key: 'all', label: 'All', count: 0, icon: 'bi-people-fill' },
    { key: 'admission', label: 'Admission List', count: 0, icon: 'bi-person-check' },
    { key: 'zeroPeriod', label: 'Zero Period List', count: 0, icon: 'bi-clock' },
    { key: 'batchFreeze', label: 'Batch Freezed', count: 0, icon: 'bi-snow' },
    { key: 'dropout', label: 'Dropout List', count: 0, icon: 'bi-person-x' }
  ];

  // Sample students data
  const [students, setStudents] = useState([
    {
      id: 1,
      enrollmentNumber: 'STU001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      mobile: '+91 9876543210',
      batchId: 1,
      batchName: 'CS101 Morning Batch',
      admissionDate: '2024-02-01',
      status: 'active',
      admissionStatus: 'admitted',
      attendance: 92,
      assignments: { completed: 8, total: 10 },
      tests: { completed: 3, total: 4 },
      overallProgress: 85,
      lastActive: '2024-03-15',
      parentName: 'Robert Doe',
      parentMobile: '+91 9876543211',
      address: '123 Main Street, Mumbai',
      feeStatus: 'paid',
      zeroPeriodDays: 0,
      profileImage: null,
      dateOfBirth: '2000-05-15',
      bloodGroup: 'O+',
      emergencyContact: '+91 9876543212'
    },
    {
      id: 2,
      enrollmentNumber: 'STU002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      mobile: '+91 9876543220',
      batchId: 1,
      batchName: 'CS101 Morning Batch',
      admissionDate: '2024-02-01',
      status: 'active',
      admissionStatus: 'admitted',
      attendance: 88,
      assignments: { completed: 7, total: 10 },
      tests: { completed: 3, total: 4 },
      overallProgress: 78,
      lastActive: '2024-03-14',
      parentName: 'Mary Smith',
      parentMobile: '+91 9876543221',
      address: '456 Park Avenue, Mumbai',
      feeStatus: 'paid',
      zeroPeriodDays: 0,
      profileImage: null,
      dateOfBirth: '2001-08-22',
      bloodGroup: 'A+',
      emergencyContact: '+91 9876543222'
    },
    // Adding Zero Period Students
    {
      id: 4,
      enrollmentNumber: 'STU004',
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      mobile: '+91 9876543240',
      batchId: 1,
      batchName: 'CS101 Morning Batch',
      admissionDate: '2024-02-15',
      status: 'active',
      admissionStatus: 'zeroPeriod',
      attendance: 75,
      assignments: { completed: 2, total: 5 },
      tests: { completed: 1, total: 2 },
      overallProgress: 60,
      lastActive: '2024-03-16',
      parentName: 'Tom Williams',
      parentMobile: '+91 9876543241',
      address: '321 Garden Street, Mumbai',
      feeStatus: 'pending',
      zeroPeriodDays: 15,
      profileImage: null,
      dateOfBirth: '2000-11-08',
      bloodGroup: 'AB+',
      emergencyContact: '+91 9876543242',
      trialStartDate: '2024-03-01',
      trialEndDate: '2024-03-16',
      presentDays: 12,
      totalTrialDays: 16,
      punctualityScore: 85
    },
    {
      id: 5,
      enrollmentNumber: 'STU005',
      name: 'David Brown',
      email: 'david.brown@example.com',
      mobile: '+91 9876543250',
      batchId: 1,
      batchName: 'CS101 Morning Batch',
      admissionDate: '2024-02-10',
      status: 'active',
      admissionStatus: 'zeroPeriod',
      attendance: 65,
      assignments: { completed: 1, total: 5 },
      tests: { completed: 0, total: 2 },
      overallProgress: 45,
      lastActive: '2024-03-15',
      parentName: 'Robert Brown',
      parentMobile: '+91 9876543251',
      address: '654 Hill Road, Mumbai',
      feeStatus: 'pending',
      zeroPeriodDays: 20,
      profileImage: null,
      dateOfBirth: '2001-03-25',
      bloodGroup: 'O-',
      emergencyContact: '+91 9876543252',
      trialStartDate: '2024-02-25',
      trialEndDate: '2024-03-17',
      presentDays: 13,
      totalTrialDays: 20,
      punctualityScore: 70
    },
    {
      id: 6,
      enrollmentNumber: 'STU006',
      name: 'Emily Johnson',
      email: 'emily.johnson@example.com',
      mobile: '+91 9876543260',
      batchId: 1,
      batchName: 'CS101 Morning Batch',
      admissionDate: '2024-03-01',
      status: 'active',
      admissionStatus: 'zeroPeriod',
      attendance: 80,
      assignments: { completed: 3, total: 5 },
      tests: { completed: 1, total: 2 },
      overallProgress: 70,
      lastActive: '2024-03-16',
      parentName: 'Michael Johnson',
      parentMobile: '+91 9876543261',
      address: '789 Hill Street, Mumbai',
      feeStatus: 'pending',
      zeroPeriodDays: 10,
      profileImage: null,
      dateOfBirth: '2000-09-12',
      bloodGroup: 'B+',
      emergencyContact: '+91 9876543262',
      trialStartDate: '2024-03-05',
      trialEndDate: '2024-03-20',
      presentDays: 8,
      totalTrialDays: 15,
      punctualityScore: 90
    }
  ]);

  // ===== ATTENDANCE FUNCTIONS =====
  
  // Initialize today's attendance
  useEffect(() => {
    const initialAttendance = {};
    students.forEach(student => {
      initialAttendance[student.id] = {
        status: '',
        timeIn: '',
        timeOut: '',
        notes: '',
        isMarked: false
      };
    });
    setTodayAttendance(initialAttendance);
  }, [selectedDate]);

  // Mark individual attendance
  const markIndividualAttendance = (studentId, status) => {
    setTodayAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status,
        timeIn: status !== 'absent' ? (prev[studentId]?.timeIn || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })) : '',
        timeOut: prev[studentId]?.timeOut || '',
        isMarked: true
      }
    }));
  };

  // Bulk attendance functions
  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAllStudents = () => {
    const zeroPeriodStudents = getFilteredStudents().filter(s => s.admissionStatus === 'zeroPeriod');
    if (selectedStudents.size === zeroPeriodStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(zeroPeriodStudents.map(s => s.id)));
    }
  };

  const applyBulkAttendance = () => {
    if (!bulkAttendanceStatus || selectedStudents.size === 0) return;
    
    const newAttendance = { ...todayAttendance };
    selectedStudents.forEach(studentId => {
      newAttendance[studentId] = {
        ...newAttendance[studentId],
        status: bulkAttendanceStatus,
        timeIn: bulkAttendanceStatus !== 'absent' ? new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
        timeOut: '',
        isMarked: true
      };
    });
    
    setTodayAttendance(newAttendance);
    setSelectedStudents(new Set());
    setBulkAttendanceStatus('');
    setShowBulkControls(false);
    alert(`Bulk attendance marked for ${selectedStudents.size} students`);
  };

  // Save attendance
  const saveAllAttendance = () => {
    const markedCount = Object.values(todayAttendance).filter(a => a.isMarked).length;
    alert(`Attendance saved for ${markedCount} students on ${new Date(selectedDate).toLocaleDateString()}`);
  };

  const handleAttendanceManagement = () => {
    setShowAttendanceManagement(true);
  };

  const handleBackFromAttendance = () => {
    setShowAttendanceManagement(false);
  };

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Calculate tab counts
  const getTabCounts = () => {
    const counts = {
      all: students.length,
      admission: students.filter(s => s.admissionStatus === 'admitted' && s.status === 'active').length,
      zeroPeriod: students.filter(s => s.admissionStatus === 'zeroPeriod').length,
      batchFreeze: students.filter(s => s.admissionStatus === 'batchFreeze').length,
      dropout: students.filter(s => s.admissionStatus === 'dropped').length
    };
    return counts;
  };

  // Filter students based on selected tab and search query
  const getFilteredStudents = () => {
    let filtered = students;

    if (selectedBatch && selectedBatch.id) {
      filtered = filtered.filter(student => student.batchId === selectedBatch.id);
    }

    switch (activeTab) {
      case 'admission':
        filtered = filtered.filter(s => s.admissionStatus === 'admitted' && s.status === 'active');
        break;
      case 'zeroPeriod':
        filtered = filtered.filter(s => s.admissionStatus === 'zeroPeriod');
        break;
      case 'batchFreeze':
        filtered = filtered.filter(s => s.admissionStatus === 'batchFreeze');
        break;
      case 'dropout':
        filtered = filtered.filter(s => s.admissionStatus === 'dropped');
        break;
      default:
        break;
    }

    if (!isFilterCollapsed) {
      if (filterData.status) {
        filtered = filtered.filter(s => s.status === filterData.status);
      }
      if (filterData.fromDate) {
        filtered = filtered.filter(s => new Date(s.admissionDate) >= new Date(filterData.fromDate));
      }
      if (filterData.toDate) {
        filtered = filtered.filter(s => new Date(s.admissionDate) <= new Date(filterData.toDate));
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.mobile.includes(searchQuery)
      );
    }

    return filtered;
  };

  const filteredStudents = getFilteredStudents();
  const tabCounts = getTabCounts();

  if (showAttendanceManagement) {
    return <AttendanceManagement selectedBatch={selectedBatch} onBack={handleBackFromAttendance} />;
  }

  const togglePopup = (studentIndex) => {
    setShowPopup(prev => prev === studentIndex ? null : studentIndex);
  };

  const toggleStudentDetails = (studentIndex) => {
    setLeadDetailsVisible(prev => prev === studentIndex ? null : studentIndex);
  };

  const handleTabClick = (studentIndex, tabIndex) => {
    setStudentTabsActive(prevTabs => ({
      ...prevTabs,
      [studentIndex]: tabIndex
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'frozen': return 'warning';
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      default: return 'secondary';
    }
  };

  const getAdmissionStatusBadge = (student) => {
    switch(student.admissionStatus) {
      case 'admitted':
        return <span className="badge bg-success">Admitted</span>;
      case 'zeroPeriod':
        return <span className="badge bg-warning">Zero Period ({student.zeroPeriodDays} days)</span>;
      case 'batchFreeze':
        return <span className="badge bg-info">Batch Freeze</span>;
      case 'dropped':
        return <span className="badge bg-danger">Dropout</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    return 'danger';
  };

  // Statistics for current tab
  const getTabStatistics = () => {
    const stats = {
      all: {
        total: filteredStudents.length,
        avgAttendance: filteredStudents.length > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.attendance, 0) / filteredStudents.length) : 0,
        avgProgress: filteredStudents.length > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.overallProgress, 0) / filteredStudents.length) : 0,
        feesPaid: filteredStudents.filter(s => s.feeStatus === 'paid').length
      }
    };
    return stats[activeTab] || stats.all;
  };

  const tabStats = getTabStatistics();

  // Check if current tab shows zero period students for attendance mode
  const showAttendanceControls = activeTab === 'zeroPeriod' || activeTab === 'all';
  const zeroPeriodStudents = filteredStudents.filter(s => s.admissionStatus === 'zeroPeriod');

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="position-relative">
            <div className="site-header--sticky--register">
              <div className="container-fluid">
                <div className="row align-items-center">
                  <div className="col-md-5 d-md-block d-sm-none">
                    <div className="d-flex align-items-center">
                      <h4 className="fw-bold text-dark mb-0 me-3">Students Management</h4>
                      <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0 small">
                          {onBackToCenters && selectedCenter && (
                            <li className="breadcrumb-item">
                              <button 
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={onBackToCenters}
                              >
                                Centers
                              </button>
                            </li>
                          )}
                          {onBackToCourses && selectedCourse && (
                            <li className="breadcrumb-item">
                              <button 
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={onBackToCourses}
                              >
                                Courses
                              </button>
                            </li>
                          )}
                          {onBackToBatches && selectedBatch && (
                            <li className="breadcrumb-item">
                              <button 
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={onBackToBatches}
                              >
                                Batches
                              </button>
                            </li>
                          )}
                          <li className="breadcrumb-item active" aria-current="page">
                            Students {selectedBatch && `- ${selectedBatch.name}`}
                          </li>
                        </ol>
                      </nav>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                      {/* ===== NEW ATTENDANCE CONTROLS ===== */}
                      {showAttendanceControls && zeroPeriodStudents.length > 0 && (
                        <>
                          {/* Date Picker */}
                          <div className="d-flex align-items-center me-2">
                            <label className="form-label me-2 mb-0 small fw-bold">Date:</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              style={{ width: '140px' }}
                            />
                          </div>

                          {/* Attendance Mode Toggle */}
                          <button
                            onClick={() => setShowAttendanceMode(!showAttendanceMode)}
                            className={`btn btn-sm ${showAttendanceMode ? 'btn-success' : 'btn-outline-success'}`}
                          >
                            <i className="fas fa-check-circle me-1"></i>
                            {showAttendanceMode ? 'Exit Attendance' : 'Mark Attendance'}
                          </button>

                          {/* Bulk Controls */}
                          {showAttendanceMode && (
                            <button
                              onClick={() => setShowBulkControls(!showBulkControls)}
                              className={`btn btn-sm ${showBulkControls ? 'btn-primary' : 'btn-outline-primary'}`}
                            >
                              <i className="fas fa-users me-1"></i>
                              Bulk
                            </button>
                          )}

                          {/* Save Attendance */}
                          {showAttendanceMode && (
                            <button className="btn btn-sm btn-warning" onClick={saveAllAttendance}>
                              <i className="fas fa-save me-1"></i>
                              Save
                            </button>
                          )}
                        </>
                      )}

                      <div className="input-group" style={{ maxWidth: '300px' }}>
                        <span className="input-group-text bg-white border-end-0 input-height">
                          <i className="fas fa-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 m-0"
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            className="btn btn-outline-secondary border-start-0"
                            type="button"
                            onClick={() => setSearchQuery('')}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                        className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                        Filters
                      </button>

                      <div className="btn-group">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className="fas fa-th"></i>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                          <i className="fas fa-list"></i>
                        </button>
                      </div>

                      {onBackToBatches && (
                        <button className="btn btn-outline-secondary" onClick={onBackToBatches}>
                          <i className="fas fa-arrow-left"></i> Back
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Buttons Row */}
                  <div className="col-12 mt-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {mainTabs.map((tab, index) => (
                        <div key={index} className="d-flex align-items-center gap-1">
                          <button
                            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveTab(tab.key)}
                          >
                            <i className={`${tab.icon} me-1`}></i>
                            {tab.label}
                            <span className={`ms-1 ${activeTab === tab.key ? 'text-white' : 'text-dark'}`}>
                              ({tabCounts[tab.key] || 0})
                            </span>
                          </button>
                        </div>
                      ))}
                      <div className="ms-auto">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setShowBulkUpload(true)}>
                          <i className="fas fa-upload"></i> Bulk Upload
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===== BULK ATTENDANCE CONTROLS ===== */}
                  {showBulkControls && showAttendanceMode && (
                    <div className="col-12 mt-3 p-3 bg-light rounded">
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={selectedStudents.size === zeroPeriodStudents.length && zeroPeriodStudents.length > 0}
                            onChange={selectAllStudents}
                          />
                          <label className="form-check-label fw-bold">
                            Select All Zero Period ({selectedStudents.size}/{zeroPeriodStudents.length})
                          </label>
                        </div>

                        {selectedStudents.size > 0 && (
                          <>
                            <div className="d-flex align-items-center gap-2">
                              <label className="form-label mb-0 small fw-bold">Mark as:</label>
                              <select
                                className="form-select form-select-sm"
                                value={bulkAttendanceStatus}
                                onChange={(e) => setBulkAttendanceStatus(e.target.value)}
                                style={{ width: '130px' }}
                              >
                                <option value="">Select Status</option>
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="absent">Absent</option>
                              </select>
                            </div>

                            <button
                              onClick={applyBulkAttendance}
                              className="btn btn-primary btn-sm"
                              disabled={!bulkAttendanceStatus}
                            >
                              <i className="fas fa-check me-1"></i>
                              Apply to {selectedStudents.size} Students
                            </button>

                            <button
                              onClick={() => {
                                setSelectedStudents(new Set());
                                setBulkAttendanceStatus('');
                              }}
                              className="btn btn-outline-secondary btn-sm"
                            >
                              <i className="fas fa-times me-1"></i>
                              Clear Selection
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {!isFilterCollapsed && (
            <div className="bg-white border-bottom shadow-sm">
              <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-filter text-primary me-2"></i>
                    <h5 className="fw-bold mb-0 text-dark">Advanced Filters</h5>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsFilterCollapsed(true)}
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>
                </div>

                <div className="row g-4">
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">Status</label>
                    <select
                      className="form-select"
                      value={filterData.status}
                      onChange={(e) => setFilterData({...filterData, status: e.target.value})}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="frozen">Frozen</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">From Date</label>
                    <input
                      type="date"
                      className="form-select"
                      value={filterData.fromDate}
                      onChange={(e) => setFilterData({...filterData, fromDate: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">To Date</label>
                    <input
                      type="date"
                      className="form-select"
                      value={filterData.toDate}
                      onChange={(e) => setFilterData({...filterData, toDate: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      className="btn btn-sm btn-outline-danger me-2"
                      onClick={() => setFilterData({
                        course: '',
                        batch: '',
                        status: '',
                        fromDate: '',
                        toDate: '',
                        center: ''
                      })}
                    >
                      <i className="fas fa-times-circle me-1"></i>
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Students Cards */}
          <div className="content-body" style={{marginTop: showBulkControls && showAttendanceMode ? '250px' : showAttendanceMode ? '180px' : '110px'}}>
            <section className="list-view">
              <div className='row'>
                <div className="col-12 rounded equal-height-2 coloumn-2">
                  <div className="card px-3">
                    <div className="row" id="students-main-row">
                      {filteredStudents.map((student, studentIndex) => (
                        <div className={`card-content transition-col mb-2`} key={studentIndex}>
                          {/* Student Header Card */}
                          <div className="card border-0 shadow-sm mb-0 mt-2">
                            <div className="card-body px-1 py-0 my-2">
                              <div className="row align-items-center">
                                <div className={showAttendanceMode && student.admissionStatus === 'zeroPeriod' ? "col-md-4" : "col-md-6"}>
                                  <div className="d-flex align-items-center">
                                    {/* Bulk Selection Checkbox for Zero Period Students */}
                                    {showAttendanceMode && showBulkControls && student.admissionStatus === 'zeroPeriod' && (
                                      <div className="form-check me-3">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={selectedStudents.has(student.id)}
                                          onChange={() => toggleStudentSelection(student.id)}
                                        />
                                      </div>
                                    )}
                                    
                                    <div className="form-check me-3">
                                      <input className="form-check-input" type="checkbox" />
                                    </div>
                                    <div className="me-3">
                                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                                           style={{ width: '50px', height: '50px' }}>
                                        <i className="bi bi-person-fill fs-4 text-primary"></i>
                                      </div>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 fw-bold">{student.name}</h6>
                                      <small className="text-muted">{student.enrollmentNumber}</small>
                                      {/* Show today's attendance status if marked */}
                                      {todayAttendance[student.id]?.isMarked && (
                                        <div className="mt-1">
                                          <span className={`badge bg-${getStatusColor(todayAttendance[student.id]?.status)} me-1`}>
                                            <i className={`fas ${todayAttendance[student.id]?.status === 'present' ? 'fa-check' : 
                                              todayAttendance[student.id]?.status === 'late' ? 'fa-clock' : 'fa-times'} me-1`}></i>
                                            {todayAttendance[student.id]?.status?.toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ marginLeft: '15px' }}>
                                      <button className="btn btn-outline-primary btn-sm border-0" title="Call" style={{ fontSize: '20px' }}>
                                        <a href={`tel:${student.mobile}`} target="_blank" rel="noopener noreferrer">
                                          <i className="fas fa-phone"></i>
                                        </a>
                                      </button>
                                   
                                    </div>
                                  </div>
                                </div>

                                {/* ===== ATTENDANCE CONTROLS FOR ZERO PERIOD STUDENTS ===== */}
                                {showAttendanceMode && student.admissionStatus === 'zeroPeriod' && (
                                  <div className="col-md-4">
                                    <div className="attendance-controls p-2 border rounded bg-light">
                                      <h6 className="text-dark mb-2 small fw-bold">
                                        <i className="fas fa-calendar-check me-1"></i>
                                        Mark Attendance - {new Date(selectedDate).toLocaleDateString()}
                                      </h6>
                                      <div className="btn-group btn-group-sm w-100 mb-2" role="group">
                                        <button
                                          type="button"
                                          className={`btn ${todayAttendance[student.id]?.status === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                                          onClick={() => markIndividualAttendance(student.id, 'present')}
                                        >
                                          <i className="fas fa-check"></i> Present
                                        </button>
                                        <button
                                          type="button"
                                          className={`btn ${todayAttendance[student.id]?.status === 'late' ? 'btn-warning' : 'btn-outline-warning'}`}
                                          onClick={() => markIndividualAttendance(student.id, 'late')}
                                        >
                                          <i className="fas fa-clock"></i> Late
                                        </button>
                                        <button
                                          type="button"
                                          className={`btn ${todayAttendance[student.id]?.status === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                          onClick={() => markIndividualAttendance(student.id, 'absent')}
                                        >
                                          <i className="fas fa-times"></i> Absent
                                        </button>
                                      </div>

                                      {/* Time Fields */}
                                      {todayAttendance[student.id]?.status && todayAttendance[student.id]?.status !== 'absent' && (
                                        <div className="row">
                                          <div className="col-6">
                                            <label className="form-label small mb-1">Time In</label>
                                            <input
                                              type="time"
                                              className="form-control form-control-sm"
                                              value={todayAttendance[student.id]?.timeIn || ''}
                                              onChange={(e) => setTodayAttendance(prev => ({
                                                ...prev,
                                                [student.id]: { ...prev[student.id], timeIn: e.target.value }
                                              }))}
                                            />
                                          </div>
                                          <div className="col-6">
                                            <label className="form-label small mb-1">Time Out</label>
                                            <input
                                              type="time"
                                              className="form-control form-control-sm"
                                              value={todayAttendance[student.id]?.timeOut || ''}
                                              onChange={(e) => setTodayAttendance(prev => ({
                                                ...prev,
                                                [student.id]: { ...prev[student.id], timeOut: e.target.value }
                                              }))}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                         
                                <div className="col-md-2 text-end">
                                  <div className="btn-group">
                                    <div style={{ position: "relative", display: "inline-block" }}>
                                      <button
                                        className="btn btn-sm btn-outline-secondary border-0"
                                        onClick={() => togglePopup(studentIndex)}
                                        aria-label="Options"
                                      >
                                        <i className="fas fa-ellipsis-v"></i>
                                      </button>

                                      {showPopup === studentIndex && (
                                        <div
                                          onClick={() => setShowPopup(null)}
                                          style={{
                                            position: "fixed",
                                            top: 0,
                                            left: 0,
                                            width: "100vw",
                                            height: "100vh",
                                            backgroundColor: "transparent",
                                            zIndex: 999,
                                          }}
                                        ></div>
                                      )}

                                      <div
                                        style={{
                                          position: "absolute",
                                          top: "28px",
                                          right: "-100px",
                                          width: "170px",
                                          backgroundColor: "white",
                                          border: "1px solid #ddd",
                                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                          borderRadius: "4px",
                                          padding: "8px 0",
                                          zIndex: 1000,
                                          transform: showPopup === studentIndex ? "translateX(-70px)" : "translateX(100%)",
                                          transition: "transform 0.3s ease-in-out",
                                          pointerEvents: showPopup === studentIndex ? "auto" : "none",
                                          display: showPopup === studentIndex ? "block" : "none"
                                        }}
                                      >
                                        <button
                                          className="dropdown-item"
                                          style={{
                                            width: "100%",
                                            padding: "8px 16px",
                                            border: "none",
                                            background: "none",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "600"
                                          }}
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            setShowDetailsModal(true);
                                            setShowPopup(null);
                                          }}
                                        >
                                          View Profile
                                        </button>
                                        <button
                                          className="dropdown-item"
                                          style={{
                                            width: "100%",
                                            padding: "8px 16px",
                                            border: "none",
                                            background: "none",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "600"
                                          }}
                                          onClick={() => {
                                            setEditingStudent(student);
                                            setShowEditForm(true);
                                            setShowPopup(null);
                                          }}
                                        >
                                          Edit Student
                                        </button>
                                        <button
                                          className="dropdown-item"
                                          style={{
                                            width: "100%",
                                            padding: "8px 16px",
                                            border: "none",
                                            background: "none",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "600"
                                          }}
                                          onClick={() => {
                                            setStudentToDelete(student);
                                            setShowDeleteModal(true);
                                            setShowPopup(null);
                                          }}
                                        >
                                          Delete Student
                                        </button>
                                      </div>
                                    </div>

                                    <button
                                      className="btn btn-sm btn-outline-secondary border-0"
                                      onClick={() => toggleStudentDetails(studentIndex)}
                                    >
                                      {leadDetailsVisible === studentIndex ? (
                                        <i className="fas fa-chevron-up"></i>
                                      ) : (
                                        <i className="fas fa-chevron-down"></i>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Notes Section for Attendance */}
                              {showAttendanceMode && student.admissionStatus === 'zeroPeriod' && todayAttendance[student.id]?.isMarked && (
                                <div className="row mt-3">
                                  <div className="col-12">
                                    <label className="form-label small mb-1">Notes (Optional)</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Add notes for today's attendance..."
                                      value={todayAttendance[student.id]?.notes || ''}
                                      onChange={(e) => setTodayAttendance(prev => ({
                                        ...prev,
                                        [student.id]: { ...prev[student.id], notes: e.target.value }
                                      }))}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tab Navigation and Content Card - Rest of your existing tab content */}
                          <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom-0 py-3 mb-3">
                              <ul className="nav nav-pills nav-pills-sm">
                                {tabs.map((tab, tabIndex) => (
                                  <li className="nav-item" key={tabIndex}>
                                    <button
                                      className={`nav-link ${(studentTabsActive[studentIndex] || 0) === tabIndex ? 'active' : ''}`}
                                      onClick={() => handleTabClick(studentIndex, tabIndex)}
                                    >
                                      {tab}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Tab Content - Only show if leadDetailsVisible is true */}
                            {leadDetailsVisible === studentIndex && (
                              <div className="tab-content">
                                {/* Your existing tab content here */}
                                {(studentTabsActive[studentIndex] || 0) === 0 && (
                                  <div className="tab-pane active">
                                    <div className="p-3">
                                      <h6>Student Details for {student.name}</h6>
                                      <p>Email: {student.email}</p>
                                      <p>Mobile: {student.mobile}</p>
                                      <p>Batch: {student.batchName}</p>
                                    </div>
                                  </div>
                                )}
                                {/* Add other tab contents as needed */}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-person fs-1 text-muted"></i>
              <h5 className="text-muted mt-3">No students found</h5>
              <p className="text-muted">
                {activeTab === 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : `No students in the ${mainTabs.find(t => t.key === activeTab)?.label || ''}`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS for styling */}
      <style jsx>{`
        .site-header--sticky--register {
          position: fixed;
          top: 104px;
          left: 15.9%;
          right: 33px;
          background: white;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 15px 0;
        }
        
        .attendance-controls {
          border: 1px solid #e3f2fd;
          border-radius: 8px;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
        }
        
        .btn-group-sm .btn {
          font-size: 0.75rem;
          padding: 0.375rem 0.5rem;
        }
        
        .progress {
          border-radius: 10px;
        }
        
        .card {
          border: none;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          transition: all 0.3s ease;
        }
        
        .card:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }
        
        .card-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        
        .nav-pills .nav-link {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }
        
        .nav-pills .nav-link.active {
          background-color: #fd2b5a;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .transition-col {
          transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .site-header--sticky--register {
            left: 0;
            right: 0;
          }
          
          .btn-group-sm .btn {
            font-size: 0.7rem;
            padding: 0.25rem 0.4rem;
          }
          
          .attendance-controls {
            padding: 8px;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .card {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
     
    </div>
  );
};

export default Student;

//  import React, { useState, useEffect } from 'react';
//  import axios from 'axios';

//  const Student = ({ selectedBatch = null, onBackToBatches = null, selectedCourse = null, onBackToCourses = null, selectedCenter = null, onBackToCenters = null }) => {
//    // State management
//    const [activeTab, setActiveTab] = useState('all');
//    const [searchQuery, setSearchQuery] = useState('');
//    const [showAddForm, setShowAddForm] = useState('');
//    const [showEditForm, setShowEditForm] = useState(false);
//    const [editingStudent, setEditingStudent] = useState(null);
//    const [viewMode, setViewMode] = useState('grid');
//    const [showDeleteModal, setShowDeleteModal] = useState(false);
//    const [studentToDelete, setStudentToDelete] = useState(null);
//    const [showDetailsModal, setShowDetailsModal] = useState(false);
//    const [selectedStudent, setSelectedStudent] = useState(null);
//    const [showBulkUpload, setShowBulkUpload] = useState(false);
//    const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

//   // Filter state
//    const [filterData, setFilterData] = useState({
//      course: '',
//      batch: '',
//      status: '',
//      fromDate: '',
//      toDate: '',
//      center: ''
//    });

//    // Form state
//    const [formData, setFormData] = useState({
//      name: '',
//      email: '',
//     mobile: '',
//     enrollmentNumber: '',
//     batchId: selectedBatch?.id || '',
//     admissionDate: '',
//     address: '',
//     parentName: '',
//     parentMobile: '',
//     status: 'active',
//     password: '',
//     confirmPassword: ''
//   });

//   // Tab definitions
//   const tabs = [
//     { key: 'all', label: 'All', count: 0, icon: 'bi-people-fill' },
//     { key: 'admission', label: 'Admission List', count: 0, icon: 'bi-person-check' },
//     { key: 'zeroPeriod', label: 'Zero Period List', count: 0, icon: 'bi-clock' },
//     { key: 'batchFreeze', label: 'Batch Freezed', count: 0, icon: 'bi-snow' },
//     { key: 'dropout', label: 'Dropout List', count: 0, icon: 'bi-person-x' }
//   ];

//   // Sample students data with different statuses
//   const [students, setStudents] = useState([
//     {
//       id: 1,
//       enrollmentNumber: 'STU001',
//       name: 'John Doe',
//       email: 'john.doe@example.com',
//       mobile: '+91 9876543210',
//       batchId: 1,
//       batchName: 'CS101 Morning Batch',
//       admissionDate: '2024-02-01',
//       status: 'active',
//       admissionStatus: 'admitted',
//       attendance: 92,
//       assignments: { completed: 8, total: 10 },
//       tests: { completed: 3, total: 4 },
//       overallProgress: 85,
//       lastActive: '2024-03-15',
//       parentName: 'Robert Doe',
//       parentMobile: '+91 9876543211',
//       address: '123 Main Street, Mumbai',
//       feeStatus: 'paid',
//       zeroPeriodDays: 0
//     },
//     {
//       id: 2,
//       enrollmentNumber: 'STU002',
//       name: 'Jane Smith',
//       email: 'jane.smith@example.com',
//       mobile: '+91 9876543220',
//       batchId: 1,
//       batchName: 'CS101 Morning Batch',
//       admissionDate: '2024-02-01',
//       status: 'active',
//       admissionStatus: 'admitted',
//       attendance: 88,
//       assignments: { completed: 7, total: 10 },
//       tests: { completed: 3, total: 4 },
//       overallProgress: 78,
//       lastActive: '2024-03-14',
//       parentName: 'Mary Smith',
//       parentMobile: '+91 9876543221',
//       address: '456 Park Avenue, Mumbai',
//       feeStatus: 'paid',
//       zeroPeriodDays: 0
//     },
//     {
//       id: 3,
//       enrollmentNumber: 'STU003',
//       name: 'Mike Johnson',
//       email: 'mike.johnson@example.com',
//       mobile: '+91 9876543230',
//       batchId: 1,
//       batchName: 'CS101 Morning Batch',
//       admissionDate: '2024-02-01',
//       status: 'inactive',
//       admissionStatus: 'dropped',
//       attendance: 45,
//       assignments: { completed: 3, total: 10 },
//       tests: { completed: 1, total: 4 },
//       overallProgress: 35,
//       lastActive: '2024-03-01',
//       parentName: 'David Johnson',
//       parentMobile: '+91 9876543231',
//       address: '789 Lake View, Mumbai',
//       feeStatus: 'unpaid',
//       zeroPeriodDays: 0,
//       dropoutDate: '2024-03-01',
//       dropoutReason: 'Personal reasons'
//     },
//     {
//       id: 4,
//       enrollmentNumber: 'STU004',
//       name: 'Sarah Williams',
//       email: 'sarah.williams@example.com',
//       mobile: '+91 9876543240',
//       batchId: 1,
//       batchName: 'CS101 Morning Batch',
//       admissionDate: '2024-02-15',
//       status: 'active',
//       admissionStatus: 'zeroPeriod',
//       attendance: 0,
//       assignments: { completed: 0, total: 10 },
//       tests: { completed: 0, total: 4 },
//       overallProgress: 0,
//       lastActive: '2024-02-15',
//       parentName: 'Tom Williams',
//       parentMobile: '+91 9876543241',
//       address: '321 Garden Street, Mumbai',
//       feeStatus: 'pending',
//       zeroPeriodDays: 15
//     },
//     {
//       id: 5,
//       enrollmentNumber: 'STU005',
//       name: 'David Brown',
//       email: 'david.brown@example.com',
//       mobile: '+91 9876543250',
//       batchId: 1,
//       batchName: 'CS101 Morning Batch',
//       admissionDate: '2024-02-10',
//       status: 'frozen',
//       admissionStatus: 'batchFreeze',
//       attendance: 75,
//       assignments: { completed: 6, total: 10 },
//       tests: { completed: 2, total: 4 },
//       overallProgress: 65,
//       lastActive: '2024-03-10',
//       parentName: 'Robert Brown',
//       parentMobile: '+91 9876543251',
//       address: '654 Hill Road, Mumbai',
//       feeStatus: 'paid',
//       zeroPeriodDays: 0,
//       freezeDate: '2024-03-10',
//       freezeReason: 'Medical emergency'
//     }
//   ]);

//   // Calculate tab counts
//   const getTabCounts = () => {
//     const counts = {
//       all: students.length,
//       admission: students.filter(s => s.admissionStatus === 'admitted' && s.status === 'active').length,
//       zeroPeriod: students.filter(s => s.admissionStatus === 'zeroPeriod').length,
//       batchFreeze: students.filter(s => s.admissionStatus === 'batchFreeze').length,
//       dropout: students.filter(s => s.admissionStatus === 'dropped').length
//     };
//     return counts;
//   };

//   // Filter students based on selected tab and search query
//   const getFilteredStudents = () => {
//     let filtered = students;

//     // Filter by batch if selectedBatch is provided
//     if (selectedBatch && selectedBatch.id) {
//       filtered = filtered.filter(student => student.batchId === selectedBatch.id);
//     }

//     // Filter by tab
//     switch (activeTab) {
//       case 'admission':
//         filtered = filtered.filter(s => s.admissionStatus === 'admitted' && s.status === 'active');
//         break;
//       case 'zeroPeriod':
//         filtered = filtered.filter(s => s.admissionStatus === 'zeroPeriod');
//         break;
//       case 'batchFreeze':
//         filtered = filtered.filter(s => s.admissionStatus === 'batchFreeze');
//         break;
//       case 'dropout':
//         filtered = filtered.filter(s => s.admissionStatus === 'dropped');
//         break;
//       default:
//         // 'all' tab shows everyone
//         break;
//     }

//     // Apply advanced filters if any
//     if (!isFilterCollapsed) {
//       if (filterData.status) {
//         filtered = filtered.filter(s => s.status === filterData.status);
//       }
//       if (filterData.fromDate) {
//         filtered = filtered.filter(s => new Date(s.admissionDate) >= new Date(filterData.fromDate));
//       }
//       if (filterData.toDate) {
//         filtered = filtered.filter(s => new Date(s.admissionDate) <= new Date(filterData.toDate));
//       }
//     }

//     // Filter by search query
//     if (searchQuery) {
//       filtered = filtered.filter(student => 
//         student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         student.mobile.includes(searchQuery)
//       );
//     }

//     return filtered;
//   };

//   const filteredStudents = getFilteredStudents();
//   const tabCounts = getTabCounts();

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       email: '',
//       mobile: '',
//       enrollmentNumber: '',
//       batchId: selectedBatch?.id || '',
//       admissionDate: '',
//       address: '',
//       parentName: '',
//       parentMobile: '',
//       status: 'active',
//       password: '',
//       confirmPassword: ''
//     });
//   };

//   const handleAdd = () => {
//     setEditingStudent(null);
//     resetForm();
//     setShowAddForm(true);
//   };

//   const handleEdit = (student) => {
//     setEditingStudent(student);
//     setFormData({
//       name: student.name,
//       email: student.email,
//       mobile: student.mobile,
//       enrollmentNumber: student.enrollmentNumber,
//       batchId: student.batchId,
//       admissionDate: student.admissionDate,
//       address: student.address,
//       parentName: student.parentName,
//       parentMobile: student.parentMobile,
//       status: student.status,
//       password: '',
//       confirmPassword: ''
//     });
//     setShowEditForm(true);
//   };

//   const handleDelete = (student) => {
//     setStudentToDelete(student);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = () => {
//     setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
//     setShowDeleteModal(false);
//     setStudentToDelete(null);
//   };

//   const handleSubmit = () => {
//     if (!formData.name.trim() || !formData.email.trim() || !formData.enrollmentNumber.trim()) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     if (!editingStudent && formData.password !== formData.confirmPassword) {
//       alert('Passwords do not match');
//       return;
//     }

//     if (editingStudent) {
//       // Edit existing student
//       setStudents(prev => prev.map(s => 
//         s.id === editingStudent.id 
//           ? { 
//               ...s, 
//               ...formData,
//               batchName: selectedBatch?.name || s.batchName
//             }
//           : s
//       ));
//       setShowEditForm(false);
//     } else {
//       // Add new student
//       const newStudent = {
//         id: Date.now(),
//         ...formData,
//         batchName: selectedBatch?.name || 'Unassigned',
//         attendance: 0,
//         assignments: { completed: 0, total: 10 },
//         tests: { completed: 0, total: 4 },
//         overallProgress: 0,
//         lastActive: new Date().toISOString().split('T')[0],
//         admissionStatus: 'admitted',
//         feeStatus: 'pending',
//         zeroPeriodDays: 0
//       };
//       setStudents(prev => [...prev, newStudent]);
//       setShowAddForm(false);
//     }
    
//     resetForm();
//     setEditingStudent(null);
//   };

//   const handleViewDetails = (student) => {
//     setSelectedStudent(student);
//     setShowDetailsModal(true);
//   };

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilterData({ ...filterData, [name]: value });
//   };

//   const closeModal = () => {
//     setShowAddForm(false);
//     setShowEditForm(false);
//     resetForm();
//     setEditingStudent(null);
//   };

//   const getStatusColor = (status) => {
//     switch(status) {
//       case 'active': return 'success';
//       case 'inactive': return 'danger';
//       case 'frozen': return 'warning';
//       default: return 'secondary';
//     }
//   };

//   const getAdmissionStatusBadge = (student) => {
//     switch(student.admissionStatus) {
//       case 'admitted':
//         return <span className="badge bg-success">Admitted</span>;
//       case 'zeroPeriod':
//         return <span className="badge bg-warning">Zero Period ({student.zeroPeriodDays} days)</span>;
//       case 'batchFreeze':
//         return <span className="badge bg-info">Batch Freeze</span>;
//       case 'dropped':
//         return <span className="badge bg-danger">Dropout</span>;
//       default:
//         return null;
//     }
//   };

//   const getProgressColor = (progress) => {
//     if (progress >= 80) return 'success';
//     if (progress >= 60) return 'warning';
//     return 'danger';
//   };

//   // Statistics for current tab
//   const getTabStatistics = () => {
//     const stats = {
//       all: {
//         total: filteredStudents.length,
//         avgAttendance: filteredStudents.length > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.attendance, 0) / filteredStudents.length) : 0,
//         avgProgress: filteredStudents.length > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.overallProgress, 0) / filteredStudents.length) : 0,
//         feesPaid: filteredStudents.filter(s => s.feeStatus === 'paid').length
//       }
//     };
//     return stats[activeTab] || stats.all;
//   };

//   const tabStats = getTabStatistics();

//   const GridView = () => (
//     <div className="row">
//       {filteredStudents.map(student => (
//         <div key={student.id} className="col-md-6 mb-4">
//           <div className="card h-100 border rounded shadow-sm">
//             <div className="card-body">
//               <div className="d-flex justify-content-between align-items-start mb-3">
//                 <div className="d-flex align-items-center">
//                   <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
//                        style={{ width: '50px', height: '50px' }}>
//                     <i className="bi bi-person-fill fs-4 text-primary"></i>
//                   </div>
//                   <div>
//                     <h5 className="card-title mb-1">{student.name}</h5>
//                     <p className="text-muted mb-0">{student.enrollmentNumber}</p>
//                   </div>
//                 </div>
//                 <div className="d-flex flex-column gap-1">
//                   <span className={`badge bg-${getStatusColor(student.status)}`}>
//                     {student.status}
//                   </span>
//                   {getAdmissionStatusBadge(student)}
//                 </div>
//               </div>

//               <div className="mb-3">
//                 <p className="small mb-1">
//                   <i className="bi bi-envelope me-2"></i>{student.email}
//                 </p>
//                 <p className="small mb-1">
//                   <i className="bi bi-phone me-2"></i>{student.mobile}
//                 </p>
//                 {selectedBatch && (
//                   <p className="small mb-1">
//                     <i className="bi bi-people me-2"></i>{student.batchName}
//                   </p>
//                 )}
//                 <p className="small mb-1">
//                   <i className="bi bi-calendar me-2"></i>Admitted: {new Date(student.admissionDate).toLocaleDateString()}
//                 </p>
//               </div>

//               {/* Progress Indicators - Show based on status */}
//               {student.admissionStatus !== 'dropped' && (
//                 <div className="mb-3">
//                   <div className="mb-2">
//                     <div className="d-flex justify-content-between small text-muted mb-1">
//                       <span>Attendance</span>
//                       <span>{student.attendance}%</span>
//                     </div>
//                     <div className="progress" style={{ height: '6px' }}>
//                       <div 
//                         className={`progress-bar bg-${getProgressColor(student.attendance)}`}
//                         role="progressbar" 
//                         style={{ width: `${student.attendance}%` }}
//                       ></div>
//                     </div>
//                   </div>

//                    <div className="mb-2">
//                      <div className="d-flex justify-content-between small text-muted mb-1">
//                        <span>Assignments</span>
//                        <span>{student.assignments.completed}/{student.assignments.total}</span>
//                      </div>
//                      <div className="progress" style={{ height: '6px' }}>
//                      <div 
//                         className="progress-bar bg-info"
//                         role="progressbar" 
//                         style={{ width: `${(student.assignments.completed / student.assignments.total) * 100}%` }}
//                       ></div>
//                     </div>
//                   </div>

//                    <div>
//                      <div className="d-flex justify-content-between small text-muted mb-1">
//                        <span>Overall Progress</span>
//                        <span>{student.overallProgress}%</span>
//                      </div>
//                      <div className="progress" style={{ height: '6px' }}>
//                        <div 
//                         className={`progress-bar bg-${getProgressColor(student.overallProgress)}`}
//                         role="progressbar" 
//                         style={{ width: `${student.overallProgress}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Special Status Information */}
//               {student.admissionStatus === 'dropped' && (
//                 <div className="alert alert-danger py-2 mb-3">
//                   <small>
//                     <strong>Dropped on:</strong> {new Date(student.dropoutDate).toLocaleDateString()}<br/>
//                     <strong>Reason:</strong> {student.dropoutReason}
//                   </small>
//                 </div>
//               )}

//               {student.admissionStatus === 'batchFreeze' && (
//                 <div className="alert alert-info py-2 mb-3">
//                   <small>
//                     <strong>Frozen on:</strong> {new Date(student.freezeDate).toLocaleDateString()}<br/>
//                     <strong>Reason:</strong> {student.freezeReason}
//                   </small>
//                 </div>
//               )}

//                {student.admissionStatus === 'zeroPeriod' && (
//                 <div className="alert alert-warning py-2 mb-3">
//                   <small>
//                     <strong>Zero Period:</strong> {student.zeroPeriodDays} days<br/>
//                     <strong>Fee Status:</strong> {student.feeStatus}
//                   </small>
//                 </div>
//               )}

//               <div className="d-flex justify-content-between align-items-center">
//                 <small className="text-muted">
//                   Last active: {new Date(student.lastActive).toLocaleDateString()}
//                 </small>
//                 <div>
//                   <button 
//                     className="btn btn-sm btn-light me-1" 
//                     title="View Details"
//                     onClick={() => handleViewDetails(student)}
//                   >
//                     <i className="bi bi-eye"></i>
//                   </button>
//                   <button 
//                     className="btn btn-sm btn-light me-1" 
//                     title="Edit"
//                     onClick={() => handleEdit(student)}
//                   >
//                     <i className="bi bi-pencil-square"></i>
//                   </button>
//                   <button 
//                     className="btn btn-sm btn-light text-danger" 
//                     title="Delete"
//                     onClick={() => handleDelete(student)}
//                   >
//                     <i className="bi bi-trash"></i>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   const ListView = () => (
//     <div className="table-responsive">
//       <table className="table table-hover">
//         <thead>
//           <tr>
//             <th>Student</th>
//             <th>Contact</th>
//             <th>Batch</th>
//             <th>Status</th>
//             <th>Attendance</th>
//             <th>Progress</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredStudents.map(student => (
//             <tr key={student.id}>
//               <td>
//                 <div>
//                   <strong>{student.name}</strong>
//                   <br />
//                   <small className="text-muted">{student.enrollmentNumber}</small>
//                 </div>
//               </td>
//               <td>
//                 <small>
//                   {student.email}<br />
//                   {student.mobile}
//                 </small>
//               </td>
//               <td>{student.batchName}</td>
//               <td>
//                 <div className="d-flex flex-column gap-1">
//                   <span className={`badge bg-${getStatusColor(student.status)}`}>
//                     {student.status}
//                   </span>
//                   {getAdmissionStatusBadge(student)}
//                 </div>
//               </td>
//               <td>
//                 <div className="progress" style={{ height: '20px', width: '100px' }}>
//                   <div 
//                     className={`progress-bar bg-${getProgressColor(student.attendance)}`}
//                     role="progressbar" 
//                     style={{ width: `${student.attendance}%` }}
//                   >
//                     {student.attendance}%
//                   </div>
//                 </div>
//               </td>
//               <td>
//                 <div className="progress" style={{ height: '20px', width: '100px' }}>
//                   <div 
//                     className={`progress-bar bg-${getProgressColor(student.overallProgress)}`}
//                     role="progressbar" 
//                     style={{ width: `${student.overallProgress}%` }}
//                   >
//                     {student.overallProgress}%
//                   </div>
//                 </div>
//               </td>
//               <td>
//                 <button 
//                   className="btn btn-sm btn-light me-1"
//                   onClick={() => handleViewDetails(student)}
//                 >
//                   <i className="bi bi-eye"></i>
//                 </button>
//                 <button 
//                   className="btn btn-sm btn-light me-1"
//                   onClick={() => handleEdit(student)}
//                 >
//                   <i className="bi bi-pencil-square"></i>
//                 </button>
//                 <button 
//                   className="btn btn-sm btn-light text-danger"
//                   onClick={() => handleDelete(student)}
//                 >
//                   <i className="bi bi-trash"></i>
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const StudentDetailsModal = () => {
//     if (!showDetailsModal || !selectedStudent) return null;

//     return (
//       <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//         <div className="modal-dialog modal-lg modal-dialog-centered">
//           <div className="modal-content">
//             <div className="modal-header bg-primary text-white">
//               <h5 className="modal-title">Student Details</h5>
//               <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailsModal(false)}></button>
//             </div>
//             <div className="modal-body">
//               <div className="row">
//                 <div className="col-md-4 text-center">
//                   <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
//                        style={{ width: '100px', height: '100px' }}>
//                     <i className="bi bi-person-fill fs-1 text-primary"></i>
//                   </div>
//                   <h5>{selectedStudent.name}</h5>
//                   <p className="text-muted">{selectedStudent.enrollmentNumber}</p>
//                   <div className="d-flex flex-column gap-2 align-items-center">
//                     <span className={`badge bg-${getStatusColor(selectedStudent.status)}`}>
//                       {selectedStudent.status}
//                     </span>
//                     {getAdmissionStatusBadge(selectedStudent)}
//                   </div>
//                 </div>
//                 <div className="col-md-8">
//                   <h6 className="mb-3">Personal Information</h6>
//                   <div className="row mb-3">
//                     <div className="col-6">
//                       <small className="text-muted">Email</small>
//                       <p className="mb-2">{selectedStudent.email}</p>
//                     </div>
//                     <div className="col-6">
//                       <small className="text-muted">Mobile</small>
//                       <p className="mb-2">{selectedStudent.mobile}</p>
//                     </div>
//                     <div className="col-6">
//                       <small className="text-muted">Admission Date</small>
//                       <p className="mb-2">{new Date(selectedStudent.admissionDate).toLocaleDateString()}</p>
//                     </div>
//                     <div className="col-6">
//                       <small className="text-muted">Batch</small>
//                       <p className="mb-2">{selectedStudent.batchName}</p>
//                     </div>
//                     <div className="col-6">
//                       <small className="text-muted">Fee Status</small>
//                       <p className="mb-2">
//                         <span className={`badge bg-${selectedStudent.feeStatus === 'paid' ? 'success' : 'warning'}`}>
//                           {selectedStudent.feeStatus}
//                         </span>
//                       </p>
//                     </div>
//                   </div>

//                   <h6 className="mb-3">Parent/Guardian Information</h6>
//                   <div className="row mb-3">
//                     <div className="col-6">
//                       <small className="text-muted">Parent Name</small>
//                       <p className="mb-2">{selectedStudent.parentName}</p>
//                     </div>
//                     <div className="col-6">
//                       <small className="text-muted">Parent Mobile</small>
//                       <p className="mb-2">{selectedStudent.parentMobile}</p>
//                     </div>
//                     <div className="col-12">
//                       <small className="text-muted">Address</small>
//                       <p className="mb-2">{selectedStudent.address}</p>
//                     </div>
//                   </div>

//                   {selectedStudent.admissionStatus !== 'dropped' && (
//                     <>
//                       <h6 className="mb-3">Academic Performance</h6>
//                       <div className="row">
//                         <div className="col-4 text-center">
//                           <div className="fw-bold text-primary fs-4">{selectedStudent.attendance}%</div>
//                           <small className="text-muted">Attendance</small>
//                         </div>
//                         <div className="col-4 text-center">
//                           <div className="fw-bold text-info fs-4">
//                             {selectedStudent.assignments.completed}/{selectedStudent.assignments.total}
//                           </div>
//                           <small className="text-muted">Assignments</small>
//                         </div>
//                         <div className="col-4 text-center">
//                           <div className="fw-bold text-success fs-4">
//                             {selectedStudent.tests.completed}/{selectedStudent.tests.total}
//                           </div>
//                           <small className="text-muted">Tests</small>
//                         </div>
//                       </div>
//                     </>
//                   )}

//                   {/* Special Status Details */}
//                   {selectedStudent.admissionStatus === 'dropped' && (
//                     <div className="alert alert-danger mt-3">
//                       <h6>Dropout Information</h6>
//                       <p className="mb-1"><strong>Date:</strong> {new Date(selectedStudent.dropoutDate).toLocaleDateString()}</p>
//                       <p className="mb-0"><strong>Reason:</strong> {selectedStudent.dropoutReason}</p>
//                     </div>
//                   )}

//                   {selectedStudent.admissionStatus === 'batchFreeze' && (
//                     <div className="alert alert-info mt-3">
//                       <h6>Batch Freeze Information</h6>
//                       <p className="mb-1"><strong>Date:</strong> {new Date(selectedStudent.freezeDate).toLocaleDateString()}</p>
//                       <p className="mb-0"><strong>Reason:</strong> {selectedStudent.freezeReason}</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="modal-footer">
//               <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
//                 Close
//               </button>
//               <button type="button" className="btn btn-primary" onClick={() => {
//                 setShowDetailsModal(false);
//                 handleEdit(selectedStudent);
//               }}>
//                 Edit Student
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const DeleteModal = () => {
//     if (!showDeleteModal || !studentToDelete) return null;

//     return (
//       <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//         <div className="modal-dialog modal-dialog-centered">
//           <div className="modal-content">
//             <div className="modal-header bg-danger text-white">
//               <h5 className="modal-title">Confirm Delete</h5>
//               <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
//             </div>
//             <div className="modal-body">
//               <p>Are you sure you want to delete the student <strong>{studentToDelete.name}</strong>?</p>
//               <p className="text-muted">This action cannot be undone and will remove all associated data including attendance records and test results.</p>
//             </div>
//             <div className="modal-footer">
//               <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
//                 Cancel
//               </button>
//               <button type="button" className="btn btn-danger" onClick={confirmDelete}>
//                 Delete Student
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };



//   return (
//     <div className="container py-4">
//       {/* Header with Breadcrumbs */}
//       <div className="bg-white shadow-sm border-bottom mb-3 sticky-top">
//         <div className="container-fluid py-2">
//           <div className="row align-items-center">
//             <div className="col-md-6">
//               <div className="d-flex align-items-center">
//                 <h4 className="fw-bold text-dark mb-0 me-3">Students Management</h4>
//                 <nav aria-label="breadcrumb">
//                   <ol className="breadcrumb mb-0 small">
//                     {onBackToCenters && selectedCenter && (
//                       <li className="breadcrumb-item">
//                         <button 
//                           className="btn btn-link p-0 text-decoration-none"
//                           onClick={onBackToCenters}
//                         >
//                           Centers
//                         </button>
//                       </li>
//                     )}
//                     {onBackToCourses && selectedCourse && (
//                       <li className="breadcrumb-item">
//                         <button 
//                           className="btn btn-link p-0 text-decoration-none"
//                           onClick={onBackToCourses}
//                         >
//                           Courses
//                         </button>
//                       </li>
//                     )}
//                     {onBackToBatches && selectedBatch && (
//                       <li className="breadcrumb-item">
//                         <button 
//                           className="btn btn-link p-0 text-decoration-none"
//                           onClick={onBackToBatches}
//                         >
//                           Batches
//                         </button>
//                       </li>
//                     )}
//                     <li className="breadcrumb-item active" aria-current="page">
//                       Students {selectedBatch && `- ${selectedBatch.name}`}
//                     </li>
//                   </ol>
//                 </nav>
//               </div>
//             </div>
//             <div className="col-md-6">
//               <div className="d-flex justify-content-end align-items-center gap-2">
//                 {/* <div className="input-group" style={{ maxWidth: '300px' }}>
//                   <span className="input-group-text bg-white border-end-0">
//                     <i className="bi bi-search text-muted"></i>
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control border-start-0"
//                     placeholder="Search students..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                 </div> */}
//                 <button
//                   onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
//                   className="btn btn-outline-primary"
//                 >
//                   <i className="bi bi-funnel me-1"></i>
//                   Filters
//                 </button>
//                 <div className="btn-group">
//                   <button
//                     onClick={() => setViewMode('grid')}
//                     className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
//                   >
//                     <i className="bi bi-grid"></i>
//                   </button>
//                   <button
//                     onClick={() => setViewMode('list')}
//                     className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
//                   >
//                     <i className="bi bi-list"></i>
//                   </button>
//                 </div>
//                 {onBackToBatches && (
//                   <button className="btn btn-outline-secondary" onClick={onBackToBatches}>
//                     <i className="bi bi-arrow-left"></i> Back
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Advanced Filters */}
//       {!isFilterCollapsed && (
//         <div className="bg-white border-bottom mb-3">
//           <div className="container-fluid py-3">
//             <div className="d-flex justify-content-between align-items-center mb-3">
//               <h6 className="fw-bold mb-0">Advanced Filters</h6>
//               <button
//                 className="btn btn-sm btn-outline-secondary"
//                 onClick={() => setIsFilterCollapsed(true)}
//               >
//                 <i className="bi bi-x"></i>
//               </button>
//             </div>

//             <div className="row g-3">
//               <div className="col-md-3">
//                 <label className="form-label small fw-medium">Status</label>
//                 <select
//                   className="form-select form-select-sm"
//                   name="status"
//                   value={filterData.status}
//                   onChange={handleFilterChange}
//                 >
//                   <option value="">All Status</option>
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                   <option value="frozen">Frozen</option>
//                 </select>
//               </div>

//               <div className="col-md-3">
//                 <label className="form-label small fw-medium">From Date</label>
//                 <input
//                   type="date"
//                   className="form-control form-control-sm"
//                   name="fromDate"
//                   value={filterData.fromDate}
//                   onChange={handleFilterChange}
//                 />
//               </div>

//               <div className="col-md-3">
//                 <label className="form-label small fw-medium">To Date</label>
//                 <input
//                   type="date"
//                   className="form-control form-control-sm"
//                   name="toDate"
//                   value={filterData.toDate}
//                   onChange={handleFilterChange}
//                 />
//               </div>

//               <div className="col-md-3 d-flex align-items-end gap-2">
//                 <button
//                   className="btn btn-sm btn-outline-secondary flex-fill"
//                   onClick={() => {
//                     setFilterData({
//                       course: '',
//                       batch: '',
//                       status: '',
//                       fromDate: '',
//                       toDate: '',
//                       center: ''
//                     });
//                   }}
//                 >
//                   Reset
//                 </button>
//                 <button
//                   className="btn btn-sm btn-primary flex-fill"
//                   onClick={() => setIsFilterCollapsed(true)}
//                 >
//                   Apply
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//        {/* Tab Navigation */}
//        <div className="card mb-3">
//          <div className="card-body p-3">
//            <div className="d-flex flex-wrap gap-2 align-items-center scrollable-tabs">
//              {tabs.map((tab) => (
//               <button
//                 key={tab.key}
//                 className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'} position-relative`}
//                 onClick={() => setActiveTab(tab.key)}
//               >
//                 <i className={`${tab.icon} me-1`}></i>
//                 {tab.label}
//                 <span className={`ms-1 ${activeTab === tab.key ? 'text-white' : 'text-dark'}`}>
//                   ({tabCounts[tab.key] || 0})
//                 </span>
//               </button>
//             ))}
//             <div className="ms-auto">
//               <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setShowBulkUpload(true)}>
//                 <i className="bi bi-upload"></i> Bulk Upload
//               </button>
             
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Statistics Cards */}
//       <div className="row mb-4">
//         <div className="col-md-3">
//           <div className="card text-center">
//             <div className="card-body">
//               <h5 className="card-title text-primary">{tabStats.total}</h5>
//               <p className="card-text text-muted">Total Students</p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card text-center">
//             <div className="card-body">
//               <h5 className="card-title text-warning">{tabStats.avgAttendance}%</h5>
//               <p className="card-text text-muted">Avg Attendance</p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card text-center">
//             <div className="card-body">
//               <h5 className="card-title text-info">{tabStats.avgProgress}%</h5>
//               <p className="card-text text-muted">Avg Progress</p>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card text-center">
//             <div className="card-body">
//               <h5 className="card-title text-success">{tabStats.feesPaid}</h5>
//               <p className="card-text text-muted">Fees Paid</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Student List */}
//       {viewMode === 'grid' ? <GridView /> : <ListView />}

//       {filteredStudents.length === 0 && (
//         <div className="text-center py-5">
//           <i className="bi bi-person fs-1 text-muted"></i>
//           <h5 className="text-muted mt-3">No students found</h5>
//           <p className="text-muted">
//             {activeTab === 'all' 
//               ? 'Try adjusting your search or filter criteria'
//               : `No students in the ${tabs.find(t => t.key === activeTab)?.label || ''}`
//             }
//           </p>
//         </div>
//       )}

//       {/* Modals */}
//       <DeleteModal />
//       <StudentDetailsModal />

//       {/* Bulk Upload Modal */}
//       {showBulkUpload && (
//         <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content">
//               <div className="modal-header bg-primary text-white">
//                 <h5 className="modal-title">Bulk Student Upload</h5>
//                 <button type="button" className="btn-close btn-close-white" onClick={() => setShowBulkUpload(false)}></button>
//               </div>
//               <div className="modal-body">
//                 <div className="alert alert-info">
//                   <h6 className="alert-heading">Instructions:</h6>
//                   <ul className="mb-0">
//                     <li>Upload a CSV file with student data</li>
//                     <li>Required columns: Name, Email, Mobile, Enrollment Number</li>
//                     <li>Optional columns: Admission Date, Address, Parent Name, Parent Mobile</li>
//                     <li>Maximum 100 students per upload</li>
//                   </ul>
//                 </div>

//                 <div className="border border-2 border-dashed rounded p-5 text-center">
//                   <i className="bi bi-cloud-upload fs-1 text-muted mb-3"></i>
//                   <p className="mb-2">Drag and drop your CSV file here, or click to browse</p>
//                   <input
//                     type="file"
//                     className="form-control mx-auto"
//                     accept=".csv"
//                     style={{ maxWidth: '300px' }}
//                   />
//                 </div>

//                 <div className="mt-3">
//                   <button className="btn btn-link p-0">
//                     <i className="bi bi-download me-2"></i>
//                     Download sample CSV template
//                   </button>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" className="btn btn-secondary" onClick={() => setShowBulkUpload(false)}>
//                   Cancel
//                 </button>
//                 <button type="button" className="btn btn-primary">
//                   <i className="bi bi-upload me-2"></i>
//                   Upload Students
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       <style>
//         {
//           `
//           @media (max-width: 767px) {
//   .scrollable-tabs {
//     overflow-x: auto;
//     white-space: nowrap;
//     flex-wrap: nowrap!important;
//   }
// }


//           `
//         }
//       </style>
//     </div>
//   );
// };

// export default Student;
