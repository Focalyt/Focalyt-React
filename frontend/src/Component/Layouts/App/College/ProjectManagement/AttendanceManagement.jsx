import React, { useState, useEffect } from 'react';

const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBulkControls, setShowBulkControls] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState('');
  const [leaveFilter, setLeaveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('today'); // today, week, month, year, custom
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Enhanced student data with comprehensive tracking
  const [students, setStudents] = useState([
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
      profileImage: null,
      parentName: 'Tom Williams',
      parentMobile: '+91 9876543241',
      
      // Course Information
      courseStartDate: '2024-02-15',
      courseEndDate: '2024-08-15',
      totalCourseDays: 180,
      courseDuration: '6 months',
      
      // Enhanced attendance tracking
      attendanceStats: {
        presentDays: 145,
        absentDays: 12,
        lateDays: 8,
        leaveDays: 5,
        halfDays: 3,
        shortLeaveDays: 7,
        totalWorkingDays: 180,
        attendancePercentage: 85.5,
        punctualityScore: 88.2,
        
        // Monthly breakdown
        monthlyStats: {
          '2024-02': { present: 12, absent: 2, late: 1, leave: 0, halfDay: 0, shortLeave: 1 },
          '2024-03': { present: 20, absent: 3, late: 2, leave: 1, halfDay: 1, shortLeave: 2 },
          '2024-04': { present: 18, absent: 1, late: 1, leave: 2, halfDay: 0, shortLeave: 1 },
          '2024-05': { present: 22, absent: 2, late: 1, leave: 1, halfDay: 1, shortLeave: 1 },
          '2024-06': { present: 19, absent: 1, late: 2, leave: 0, halfDay: 0, shortLeave: 1 }
        }
      },
      
      // Leave records
      leaves: [
        {
          id: 1,
          date: '2024-03-05',
          type: 'sick',
          leaveType: 'full',
          reason: 'Fever and cold',
          status: 'approved',
          appliedDate: '2024-03-04',
          approvedBy: 'Teacher Name',
          documents: ['medical_certificate.pdf'],
          duration: 1
        },
        {
          id: 2,
          date: '2024-03-12',
          type: 'personal',
          leaveType: 'half',
          reason: 'Family function',
          status: 'approved',
          appliedDate: '2024-03-10',
          approvedBy: 'Principal',
          duration: 0.5
        },
        {
          id: 3,
          date: '2024-04-15',
          type: 'emergency',
          leaveType: 'short',
          reason: 'Doctor appointment',
          status: 'approved',
          appliedDate: '2024-04-15',
          approvedBy: 'Teacher Name',
          timeOut: '10:30',
          timeIn: '12:00',
          duration: 1.5 // hours
        }
      ],
      
      // Daily attendance records
      dailyAttendance: [
        { date: '2024-06-20', status: 'present', timeIn: '09:00', timeOut: '17:00', notes: '', lateMinutes: 0 },
        { date: '2024-06-19', status: 'late', timeIn: '09:15', timeOut: '17:00', notes: 'Traffic jam', lateMinutes: 15 },
        { date: '2024-06-18', status: 'present', timeIn: '08:55', timeOut: '17:00', notes: '', lateMinutes: 0 },
        { date: '2024-06-17', status: 'absent', reason: 'Sick leave', notes: 'Fever' },
        { date: '2024-06-16', status: 'halfDay', timeIn: '09:00', timeOut: '13:00', notes: 'Medical appointment' }
      ]
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
      profileImage: null,
      parentName: 'Robert Brown',
      parentMobile: '+91 9876543251',
      
      courseStartDate: '2024-02-10',
      courseEndDate: '2024-08-10',
      totalCourseDays: 180,
      courseDuration: '6 months',
      
      attendanceStats: {
        presentDays: 130,
        absentDays: 25,
        lateDays: 15,
        leaveDays: 8,
        halfDays: 5,
        shortLeaveDays: 12,
        totalWorkingDays: 180,
        attendancePercentage: 75.2,
        punctualityScore: 70.5,
        
        monthlyStats: {
          '2024-02': { present: 10, absent: 4, late: 3, leave: 1, halfDay: 1, shortLeave: 2 },
          '2024-03': { present: 18, absent: 5, late: 3, leave: 2, halfDay: 1, shortLeave: 3 },
          '2024-04': { present: 16, absent: 3, late: 2, leave: 2, halfDay: 1, shortLeave: 2 },
          '2024-05': { present: 20, absent: 4, late: 3, leave: 1, halfDay: 1, shortLeave: 2 },
          '2024-06': { present: 17, absent: 3, late: 2, leave: 1, halfDay: 0, shortLeave: 2 }
        }
      },
      
      leaves: [
        {
          id: 4,
          date: '2024-02-20',
          type: 'sick',
          leaveType: 'full',
          reason: 'Stomach infection',
          status: 'approved',
          appliedDate: '2024-02-19',
          approvedBy: 'Teacher Name',
          duration: 2
        }
      ],
      
      dailyAttendance: [
        { date: '2024-06-20', status: 'present', timeIn: '09:05', timeOut: '17:00', notes: '', lateMinutes: 5 },
        { date: '2024-06-19', status: 'absent', reason: 'Personal work', notes: 'Family emergency' },
        { date: '2024-06-18', status: 'late', timeIn: '09:25', timeOut: '17:00', notes: 'Bus delay', lateMinutes: 25 }
      ]
    }
  ]);

  // Today's attendance state
  const [todayAttendance, setTodayAttendance] = useState({});

  // Leave application state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    studentId: '',
    date: '',
    type: 'sick',
    leaveType: 'full', // full, half, short
    reason: '',
    timeOut: '',
    timeIn: '',
    documents: null
  });

  // Initialize today's attendance
  useEffect(() => {
    const initialAttendance = {};
    students.forEach(student => {
      initialAttendance[student.id] = {
        status: '',
        timeIn: '',
        timeOut: '',
        notes: '',
        isMarked: false,
        lateMinutes: 0
      };
    });
    setTodayAttendance(initialAttendance);
  }, [selectedDate]);

  // Filter students
  const getFilteredStudents = () => {
    let filtered = students.filter(s => s.admissionStatus === 'zeroPeriod');
    
    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get filtered attendance data based on time filter
  const getFilteredAttendanceData = (student) => {
    const today = new Date();
    let startDate, endDate;

    switch (timeFilter) {
      case 'today':
        startDate = endDate = selectedDate;
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = dateRange.fromDate;
        endDate = dateRange.toDate;
        break;
      default:
        return student.attendanceStats;
    }

    // Filter daily attendance based on date range
    const filteredAttendance = student.dailyAttendance.filter(record => {
      const recordDate = record.date;
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Calculate statistics for filtered data
    const stats = {
      presentDays: filteredAttendance.filter(r => r.status === 'present').length,
      absentDays: filteredAttendance.filter(r => r.status === 'absent').length,
      lateDays: filteredAttendance.filter(r => r.status === 'late').length,
      leaveDays: filteredAttendance.filter(r => r.status === 'leave').length,
      halfDays: filteredAttendance.filter(r => r.status === 'halfDay').length,
      shortLeaveDays: filteredAttendance.filter(r => r.status === 'shortLeave').length,
      totalDays: filteredAttendance.length
    };

    stats.attendancePercentage = stats.totalDays > 0 ? 
      Math.round(((stats.presentDays + stats.lateDays + stats.halfDays * 0.5) / stats.totalDays) * 100) : 0;

    return stats;
  };

  // Get all leaves with filtering and sorting
  const getFilteredLeaves = () => {
    let allLeaves = [];
    students.forEach(student => {
      student.leaves.forEach(leave => {
        allLeaves.push({
          ...leave,
          studentName: student.name,
          studentId: student.id,
          enrollmentNumber: student.enrollmentNumber
        });
      });
    });

    // Filter by status
    if (leaveFilter !== 'all') {
      allLeaves = allLeaves.filter(leave => leave.status === leaveFilter);
    }

    // Filter by date range
    if (dateRange.fromDate) {
      allLeaves = allLeaves.filter(leave => new Date(leave.date) >= new Date(dateRange.fromDate));
    }
    if (dateRange.toDate) {
      allLeaves = allLeaves.filter(leave => new Date(leave.date) <= new Date(dateRange.toDate));
    }

    // Sort by date (newest first)
    allLeaves.sort((a, b) => new Date(b.date) - new Date(a.date));

    return allLeaves;
  };

  const filteredStudents = getFilteredStudents();
  const filteredLeaves = getFilteredLeaves();

  // Mark individual attendance
  const markIndividualAttendance = (studentId, status) => {
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let lateMinutes = 0;
    if (status === 'late') {
      const standardTime = new Date(`2024-01-01 09:00`);
      const currentFullTime = new Date(`2024-01-01 ${currentTime}`);
      lateMinutes = Math.max(0, (currentFullTime - standardTime) / (1000 * 60));
    }

    setTodayAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status,
        timeIn: status !== 'absent' && status !== 'leave' ? 
          (prev[studentId]?.timeIn || currentTime) : '',
        timeOut: prev[studentId]?.timeOut || '',
        isMarked: true,
        lateMinutes: lateMinutes
      }
    }));

    // Update student's daily attendance record
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId) {
          const newDailyAttendance = [...student.dailyAttendance];
          const existingIndex = newDailyAttendance.findIndex(record => record.date === selectedDate);
          
          const attendanceRecord = {
            date: selectedDate,
            status: status,
            timeIn: status !== 'absent' && status !== 'leave' ? currentTime : '',
            timeOut: '',
            notes: '',
            lateMinutes: lateMinutes
          };

          if (existingIndex >= 0) {
            newDailyAttendance[existingIndex] = attendanceRecord;
          } else {
            newDailyAttendance.push(attendanceRecord);
          }

          // Update overall stats
          const newStats = { ...student.attendanceStats };
          
          switch(status) {
            case 'present':
              newStats.presentDays += 1;
              break;
            case 'absent':
              newStats.absentDays += 1;
              break;
            case 'late':
              newStats.lateDays += 1;
              newStats.presentDays += 1;
              break;
            case 'leave':
              newStats.leaveDays += 1;
              break;
            case 'halfDay':
              newStats.halfDays += 1;
              break;
            case 'shortLeave':
              newStats.shortLeaveDays += 1;
              break;
          }
          
          newStats.totalWorkingDays += 1;
          newStats.attendancePercentage = Math.round(
            ((newStats.presentDays + newStats.lateDays + newStats.halfDays * 0.5) / newStats.totalWorkingDays) * 100
          );
          
          return {
            ...student,
            attendanceStats: newStats,
            dailyAttendance: newDailyAttendance
          };
        }
        return student;
      })
    );
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
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const applyBulkAttendance = () => {
    if (!bulkAttendanceStatus || selectedStudents.size === 0) return;
    
    selectedStudents.forEach(studentId => {
      markIndividualAttendance(studentId, bulkAttendanceStatus);
    });
    
    setSelectedStudents(new Set());
    setBulkAttendanceStatus('');
    setShowBulkControls(false);
    alert(`Bulk attendance marked for ${selectedStudents.size} students`);
  };

  // Leave management functions
  const handleLeaveApplication = (studentId) => {
    setLeaveForm({
      ...leaveForm,
      studentId: studentId,
      date: selectedDate
    });
    setShowLeaveModal(true);
  };

  const submitLeaveApplication = () => {
    if (!leaveForm.reason.trim()) {
      alert('Please provide a reason for leave');
      return;
    }

    const newLeave = {
      id: Date.now(),
      date: leaveForm.date,
      type: leaveForm.type,
      leaveType: leaveForm.leaveType,
      reason: leaveForm.reason,
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      timeOut: leaveForm.timeOut,
      timeIn: leaveForm.timeIn,
      duration: leaveForm.leaveType === 'full' ? 1 : 
                leaveForm.leaveType === 'half' ? 0.5 : 
                calculateHours(leaveForm.timeOut, leaveForm.timeIn)
    };

    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === parseInt(leaveForm.studentId)) {
          return {
            ...student,
            leaves: [...student.leaves, newLeave]
          };
        }
        return student;
      })
    );

    setShowLeaveModal(false);
    setLeaveForm({
      studentId: '',
      date: '',
      type: 'sick',
      leaveType: 'full',
      reason: '',
      timeOut: '',
      timeIn: '',
      documents: null
    });
    alert('Leave application submitted successfully');
  };

  const calculateHours = (timeOut, timeIn) => {
    if (!timeOut || !timeIn) return 0;
    const out = new Date(`2024-01-01 ${timeOut}`);
    const inn = new Date(`2024-01-01 ${timeIn}`);
    return Math.abs(inn - out) / (1000 * 60 * 60);
  };

  const approveLeave = (studentId, leaveId) => {
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            leaves: student.leaves.map(leave => 
              leave.id === leaveId 
                ? { ...leave, status: 'approved', approvedBy: 'Current User' }
                : leave
            )
          };
        }
        return student;
      })
    );
  };

  const rejectLeave = (studentId, leaveId) => {
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            leaves: student.leaves.map(leave => 
              leave.id === leaveId 
                ? { ...leave, status: 'rejected' }
                : leave
            )
          };
        }
        return student;
      })
    );
  };

  // Save attendance
  const saveAllAttendance = () => {
    const markedCount = Object.values(todayAttendance).filter(a => a.isMarked).length;
    alert(`Attendance saved for ${markedCount} students on ${new Date(selectedDate).toLocaleDateString()}`);
  };

  // Export functions
  const exportAttendanceReport = () => {
    const csvContent = generateCSVContent();
    downloadCSV(csvContent, `attendance_report_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateCSVContent = () => {
    let csv = 'Student Name,Enrollment No,Present Days,Absent Days,Late Days,Leave Days,Half Days,Short Leave Days,Total Days,Attendance %,Punctuality Score\n';
    
    filteredStudents.forEach(student => {
      const stats = getFilteredAttendanceData(student);
      csv += `${student.name},${student.enrollmentNumber},${stats.presentDays},${stats.absentDays},${stats.lateDays},${stats.leaveDays},${stats.halfDays},${stats.shortLeaveDays},${stats.totalDays},${stats.attendancePercentage}%,${student.attendanceStats.punctualityScore}%\n`;
    });
    
    return csv;
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      case 'leave': return 'info';
      case 'halfDay': return 'primary';
      case 'shortLeave': return 'secondary';
      default: return 'secondary';
    }
  };

  const getLeaveStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 85) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 65) return 'warning';
    return 'danger';
  };

  const formatDuration = (student) => {
    const start = new Date(student.courseStartDate);
    const end = new Date(student.courseEndDate);
    const today = new Date();
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    
    return {
      total: totalDays,
      elapsed: elapsedDays,
      remaining: remainingDays,
      progressPercent: Math.round((elapsedDays / totalDays) * 100)
    };
  };

  // Tab definitions
  const tabs = [
    { key: 'attendance', label: 'Mark Attendance', icon: 'fas fa-check-circle' },
    { key: 'leaves', label: 'Leave Management', icon: 'fas fa-calendar-times' },
    { key: 'reports', label: 'Attendance Reports', icon: 'fas fa-chart-bar' },
    { key: 'analytics', label: 'Analytics', icon: 'fas fa-analytics' },
    { key: 'calendar', label: 'Calendar View', icon: 'fas fa-calendar' }
  ];

  return (
    <div className="container-fluid">
      {/* Enhanced Header */}
      <div className="site-header--sticky--attendance">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <h4 className="fw-bold text-dark mb-0 me-3">Advanced Attendance System</h4>
                <span className="badge bg-warning">{filteredStudents.length} Students</span>
              </div>
            </div>

            <div className="col-md-9">
              <div className="d-flex justify-content-end align-items-center gap-2">
                {/* Time Filter */}
                <div className="d-flex align-items-center me-2">
                  <label className="form-label me-2 mb-0 small fw-bold">Period:</label>
                  <select
                    className="form-select form-select-sm"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Date Picker */}
                <div className="d-flex align-items-center me-2">
                  <label className="form-label me-2 mb-0 small fw-bold">Date:</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '150px' }}
                  />
                </div>

                {/* Custom Date Range */}
                {timeFilter === 'custom' && (
                  <>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      placeholder="From"
                      value={dateRange.fromDate}
                      onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
                      style={{ width: '140px' }}
                    />
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      placeholder="To"
                      value={dateRange.toDate}
                      onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
                      style={{ width: '140px' }}
                    />
                  </>
                )}

                {/* Search */}
                <div className="input-group" style={{ maxWidth: '200px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                {activeTab === 'attendance' && (
                  <>
                    <button
                      onClick={() => setShowBulkControls(!showBulkControls)}
                      className={`btn btn-sm ${showBulkControls ? 'btn-primary' : 'btn-outline-primary'}`}
                    >
                      <i className="fas fa-users me-1"></i>
                      Bulk
                    </button>
                    <button className="btn btn-sm btn-success" onClick={saveAllAttendance}>
                      <i className="fas fa-save me-1"></i>
                      Save
                    </button>
                  </>
                )}

                {/* Export Button */}
                <button className="btn btn-sm btn-info" onClick={exportAttendanceReport}>
                  <i className="fas fa-download me-1"></i>
                  Export
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="col-12 mt-3">
              <ul className="nav nav-pills">
                {tabs.map((tab) => (
                  <li className="nav-item" key={tab.key}>
                    <button
                      className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <i className={`${tab.icon} me-2`}></i>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bulk Controls Panel */}
            {showBulkControls && activeTab === 'attendance' && (
              <div className="col-12 mt-3 p-3 bg-light rounded">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={selectAllStudents}
                    />
                    <label className="form-check-label fw-bold">
                      Select All ({selectedStudents.size}/{filteredStudents.length})
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
                          style={{ width: '150px' }}
                        >
                          <option value="">Select Status</option>
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Leave</option>
                          <option value="halfDay">Half Day</option>
                          <option value="shortLeave">Short Leave</option>
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
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-body" style={{marginTop: showBulkControls ? '280px' : '200px'}}>
        
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <section className="list-view">
            <div className='row'>
              <div className="col-12">
                <div className="card px-3">
                  <div className="row">
                    {filteredStudents.map((student, studentIndex) => {
                      const courseInfo = formatDuration(student);
                      const filteredStats = getFilteredAttendanceData(student);
                      
                      return (
                        <div className="card-content transition-col mb-2" key={studentIndex}>
                          {/* Enhanced Student Header Card */}
                          <div className="card border-0 shadow-sm mb-0 mt-2">
                            <div className="card-body px-3 py-3">
                              <div className="row align-items-center">
                                {/* Student Info */}
                                <div className="col-md-3">
                                  <div className="d-flex align-items-center">
                                    {showBulkControls && (
                                      <div className="form-check me-3">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={selectedStudents.has(student.id)}
                                          onChange={() => toggleStudentSelection(student.id)}
                                        />
                                      </div>
                                    )}
                                    
                                    <div className="me-3">
                                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                                           style={{ width: '50px', height: '50px' }}>
                                        <i className="bi bi-person-fill fs-4 text-primary"></i>
                                      </div>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 fw-bold">{student.name}</h6>
                                      <small className="text-muted">{student.enrollmentNumber}</small>
                                      <div className="mt-1">
                                        {todayAttendance[student.id]?.isMarked && (
                                          <span className={`badge bg-${getStatusColor(todayAttendance[student.id]?.status)} me-1`}>
                                            <i className={`fas ${todayAttendance[student.id]?.status === 'present' ? 'fa-check' : 
                                              todayAttendance[student.id]?.status === 'late' ? 'fa-clock' : 
                                              todayAttendance[student.id]?.status === 'halfDay' ? 'fa-clock-o' :
                                              todayAttendance[student.id]?.status === 'shortLeave' ? 'fa-sign-out-alt' :
                                              todayAttendance[student.id]?.status === 'leave' ? 'fa-calendar' : 'fa-times'} me-1`}></i>
                                            {todayAttendance[student.id]?.status?.toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Enhanced Attendance Controls */}
                                <div className="col-md-5">
                                  <div className="attendance-controls">
                                    <h6 className="text-dark mb-2 small fw-bold">
                                      <i className="fas fa-calendar-check me-1"></i>
                                      Today's Attendance - {new Date(selectedDate).toLocaleDateString()}
                                    </h6>
                                    <div className="row mb-2">
                                      <div className="col-12">
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
                                        <div className="btn-group btn-group-sm w-100" role="group">
                                          <button
                                            type="button"
                                            className={`btn ${todayAttendance[student.id]?.status === 'leave' ? 'btn-info' : 'btn-outline-info'}`}
                                            onClick={() => markIndividualAttendance(student.id, 'leave')}
                                          >
                                            <i className="fas fa-calendar"></i> Leave
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn ${todayAttendance[student.id]?.status === 'halfDay' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => markIndividualAttendance(student.id, 'halfDay')}
                                          >
                                            <i className="fas fa-clock-o"></i> Half Day
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn ${todayAttendance[student.id]?.status === 'shortLeave' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                            onClick={() => markIndividualAttendance(student.id, 'shortLeave')}
                                          >
                                            <i className="fas fa-sign-out-alt"></i> Short Leave
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Time Fields */}
                                    {todayAttendance[student.id]?.status && 
                                     todayAttendance[student.id]?.status !== 'absent' && 
                                     todayAttendance[student.id]?.status !== 'leave' && (
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

                                    {/* Late Minutes Display */}
                                    {todayAttendance[student.id]?.status === 'late' && todayAttendance[student.id]?.lateMinutes > 0 && (
                                      <div className="mt-2">
                                        <small className="text-warning">
                                          <i className="fas fa-exclamation-triangle me-1"></i>
                                          Late by {Math.round(todayAttendance[student.id].lateMinutes)} minutes
                                        </small>
                                      </div>
                                    )}

                                    {/* Apply Leave Button */}
                                    <div className="mt-2">
                                      <button
                                        className="btn btn-sm btn-outline-info w-100"
                                        onClick={() => handleLeaveApplication(student.id)}
                                      >
                                        <i className="fas fa-plus me-1"></i>
                                        Apply Leave
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Enhanced Statistics & Course Info */}
                                <div className="col-md-4">
                                  <div className="row">
                                    {/* Course Progress */}
                                    <div className="col-12 mb-3">
                                      <div className="card bg-light">
                                        <div className="card-body p-2">
                                          <h6 className="card-title small mb-2">
                                            <i className="fas fa-graduation-cap me-1"></i>
                                            Course Progress ({student.courseDuration})
                                          </h6>
                                          <div className="d-flex justify-content-between small text-muted mb-1">
                                            <span>Duration</span>
                                            <span>{courseInfo.elapsed}/{courseInfo.total} days</span>
                                          </div>
                                          <div className="progress mb-2" style={{ height: '8px' }}>
                                            <div 
                                              className="progress-bar bg-info"
                                              style={{ width: `${courseInfo.progressPercent}%` }}
                                            ></div>
                                          </div>
                                          <div className="row text-center small">
                                            <div className="col-6">
                                              <div className="fw-bold text-info">{courseInfo.elapsed}</div>
                                              <div className="text-muted">Elapsed</div>
                                            </div>
                                            <div className="col-6">
                                              <div className="fw-bold text-warning">{courseInfo.remaining}</div>
                                              <div className="text-muted">Remaining</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Attendance Statistics */}
                                    <div className="col-12">
                                      <div className="text-center">
                                        <div className="mb-2">
                                          <span className="badge bg-warning" style={{ fontSize: '10px', padding: '4px 8px' }}>
                                            {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Period
                                          </span>
                                        </div>
                                        
                                        {/* Enhanced Statistics Grid */}
                                        <div className="row text-center mb-2 small">
                                          <div className="col-4">
                                            <div className="fw-bold text-success">{filteredStats.presentDays}</div>
                                            <div className="text-muted">Present</div>
                                          </div>
                                          <div className="col-4">
                                            <div className="fw-bold text-danger">{filteredStats.absentDays}</div>
                                            <div className="text-muted">Absent</div>
                                          </div>
                                          <div className="col-4">
                                            <div className="fw-bold text-warning">{filteredStats.lateDays}</div>
                                            <div className="text-muted">Late</div>
                                          </div>
                                        </div>

                                        <div className="row text-center mb-2 small">
                                          <div className="col-4">
                                            <div className="fw-bold text-info">{filteredStats.leaveDays}</div>
                                            <div className="text-muted">Leaves</div>
                                          </div>
                                          <div className="col-4">
                                            <div className="fw-bold text-primary">{filteredStats.halfDays}</div>
                                            <div className="text-muted">Half Days</div>
                                          </div>
                                          <div className="col-4">
                                            <div className="fw-bold text-secondary">{filteredStats.shortLeaveDays}</div>
                                            <div className="text-muted">Short Leave</div>
                                          </div>
                                        </div>

                                        <div className="d-flex justify-content-between small text-muted mb-1">
                                          <span>Attendance</span>
                                          <span>{filteredStats.attendancePercentage}%</span>
                                        </div>
                                        <div className="progress mb-2" style={{ height: '10px' }}>
                                          <div 
                                            className={`progress-bar bg-${getProgressColor(filteredStats.attendancePercentage)}`}
                                            style={{ width: `${filteredStats.attendancePercentage}%` }}
                                          ></div>
                                        </div>

                                        <div className="d-flex justify-content-between small text-muted mb-1">
                                          <span>Punctuality</span>
                                          <span>{student.attendanceStats.punctualityScore}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                          <div 
                                            className={`progress-bar bg-${getProgressColor(student.attendanceStats.punctualityScore)}`}
                                            style={{ width: `${student.attendanceStats.punctualityScore}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Notes Section */}
                              {todayAttendance[student.id]?.isMarked && (
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Leave Management Tab */}
        {activeTab === 'leaves' && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <h5 className="mb-0">
                        <i className="fas fa-calendar-times me-2"></i>
                        Leave Management
                      </h5>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-2 justify-content-end">
                        {/* Leave Status Filter */}
                        <select
                          className="form-select form-select-sm"
                          value={leaveFilter}
                          onChange={(e) => setLeaveFilter(e.target.value)}
                          style={{ width: '150px' }}
                        >
                          <option value="all">All Leaves</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        {/* Date Range Filters */}
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          placeholder="From Date"
                          value={dateRange.fromDate}
                          onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
                          style={{ width: '150px' }}
                        />
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          placeholder="To Date"
                          value={dateRange.toDate}
                          onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
                          style={{ width: '150px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {filteredLeaves.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-calendar-times fs-1 text-muted"></i>
                      <h5 className="text-muted mt-3">No Leave Applications Found</h5>
                      <p className="text-muted">No leave applications match your current filters.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Leave Type</th>
                            <th>Duration</th>
                            <th>Reason</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaves.map((leave, index) => (
                            <tr key={index}>
                              <td>
                                <div>
                                  <strong>{leave.studentName}</strong>
                                  <br />
                                  <small className="text-muted">{leave.enrollmentNumber}</small>
                                </div>
                              </td>
                              <td>{new Date(leave.date).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge bg-secondary`}>
                                  {leave.type}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${leave.leaveType === 'full' ? 'bg-danger' : 
                                  leave.leaveType === 'half' ? 'bg-warning' : 'bg-info'}`}>
                                  {leave.leaveType}
                                </span>
                              </td>
                              <td>
                                {leave.leaveType === 'full' ? '1 Day' : 
                                 leave.leaveType === 'half' ? '0.5 Day' : 
                                 `${leave.duration || 0} Hours`}
                              </td>
                              <td className="text-wrap" style={{ maxWidth: '200px' }}>
                                {leave.reason}
                              </td>
                              <td>{new Date(leave.appliedDate).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge bg-${getLeaveStatusColor(leave.status)}`}>
                                  {leave.status}
                                </span>
                                {leave.approvedBy && (
                                  <small className="d-block text-muted">
                                    by {leave.approvedBy}
                                  </small>
                                )}
                              </td>
                              <td>
                                {leave.status === 'pending' && (
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-success"
                                      onClick={() => approveLeave(leave.studentId, leave.id)}
                                    >
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      onClick={() => rejectLeave(leave.studentId, leave.id)}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Reports Tab */}
        {activeTab === 'reports' && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-chart-bar me-2"></i>
                      Detailed Attendance Reports
                    </h5>
                    <button className="btn btn-primary btn-sm" onClick={exportAttendanceReport}>
                      <i className="fas fa-download me-1"></i>
                      Export Report
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {/* Overall Statistics */}
                  <div className="row mb-4">
                    <div className="col-md-2">
                      <div className="card text-center bg-success text-white">
                        <div className="card-body">
                          <h5 className="card-title">
                            {students.reduce((sum, s) => sum + getFilteredAttendanceData(s).presentDays, 0)}
                          </h5>
                          <p className="card-text">Present Days</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="card text-center bg-danger text-white">
                        <div className="card-body">
                          <h5 className="card-title">
                            {students.reduce((sum, s) => sum + getFilteredAttendanceData(s).absentDays, 0)}
                          </h5>
                          <p className="card-text">Absent Days</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="card text-center bg-warning text-white">
                        <div className="card-body">
                          <h5 className="card-title">
                            {students.reduce((sum, s) => sum + getFilteredAttendanceData(s).lateDays, 0)}
                          </h5>
                          <p className="card-text">Late Days</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="card text-center bg-info text-white">
                        <div className="card-body">
                          <h5 className="card-title">
                            {students.reduce((sum, s) => sum + getFilteredAttendanceData(s).leaveDays, 0)}
                          </h5>
                          <p className="card-text">Leave Days</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="card text-center bg-primary text-white">
                        <div className="card-body">
                          <h5 className="card-title">
                            {students.reduce((sum, s) => sum + getFilteredAttendanceData(s).halfDays, 0)}
                          </h5>
                          <p className="card-text">Half Days</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="card text-center bg-secondary text-white">
                        <div className="card-body">
                          <h5 className="card-title">
                            {students.reduce((sum, s) => sum + getFilteredAttendanceData(s).shortLeaveDays, 0)}
                          </h5>
                          <p className="card-text">Short Leaves</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student-wise Report */}
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Course Progress</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Late</th>
                          <th>Leaves</th>
                          <th>Half Days</th>
                          <th>Short Leaves</th>
                          <th>Total Days</th>
                          <th>Attendance %</th>
                          <th>Punctuality %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const stats = getFilteredAttendanceData(student);
                          const courseInfo = formatDuration(student);
                          
                          return (
                            <tr key={student.id}>
                              <td>
                                <strong>{student.name}</strong>
                                <br />
                                <small className="text-muted">{student.enrollmentNumber}</small>
                              </td>
                              <td>
                                <div className="progress" style={{ width: '100px', height: '20px' }}>
                                  <div 
                                    className="progress-bar bg-info"
                                    style={{ width: `${courseInfo.progressPercent}%` }}
                                  >
                                    {courseInfo.progressPercent}%
                                  </div>
                                </div>
                                <small className="text-muted">{courseInfo.elapsed}/{courseInfo.total} days</small>
                              </td>
                              <td>
                                <span className="badge bg-success">
                                  {stats.presentDays}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-danger">
                                  {stats.absentDays}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-warning">
                                  {stats.lateDays}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-info">
                                  {stats.leaveDays}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-primary">
                                  {stats.halfDays}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-secondary">
                                  {stats.shortLeaveDays}
                                </span>
                              </td>
                              <td>{stats.totalDays}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress me-2" style={{ width: '60px', height: '20px' }}>
                                    <div 
                                      className={`progress-bar bg-${getProgressColor(stats.attendancePercentage)}`}
                                      style={{ width: `${stats.attendancePercentage}%` }}
                                    >
                                      {stats.attendancePercentage}%
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress me-2" style={{ width: '60px', height: '20px' }}>
                                    <div 
                                      className={`progress-bar bg-${getProgressColor(student.attendanceStats.punctualityScore)}`}
                                      style={{ width: `${student.attendanceStats.punctualityScore}%` }}
                                    >
                                      {student.attendanceStats.punctualityScore}%
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-analytics me-2"></i>
                    Advanced Analytics
                  </h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <h6>Advanced Analytics Dashboard</h6>
                    <p className="mb-0">
                      This section would contain detailed charts and graphs showing:
                    </p>
                    <ul className="mt-2 mb-0">
                      <li>Monthly attendance trends</li>
                      <li>Student performance comparison</li>
                      <li>Punctuality analysis</li>
                      <li>Leave pattern analysis</li>
                      <li>Course completion predictions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar View Tab */}
        {activeTab === 'calendar' && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-calendar me-2"></i>
                    Calendar View
                  </h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <h6>Calendar View</h6>
                    <p className="mb-0">
                      This section would display a calendar interface showing:
                    </p>
                    <ul className="mt-2 mb-0">
                      <li>Daily attendance status for each student</li>
                      <li>Leave applications and approvals</li>
                      <li>Holidays and working days</li>
                      <li>Important events and deadlines</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Leave Application Modal */}
      {showLeaveModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply for Leave</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowLeaveModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={leaveForm.date}
                      onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Leave Type</label>
                    <select
                      className="form-select"
                      value={leaveForm.type}
                      onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                    >
                      <option value="sick">Sick Leave</option>
                      <option value="personal">Personal Leave</option>
                      <option value="emergency">Emergency Leave</option>
                      <option value="medical">Medical Leave</option>
                      <option value="family">Family Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Duration Type</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          value="full"
                          checked={leaveForm.leaveType === 'full'}
                          onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                        />
                        <label className="form-check-label">
                          Full Day
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          value="half"
                          checked={leaveForm.leaveType === 'half'}
                          onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                        />
                        <label className="form-check-label">
                          Half Day
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          value="short"
                          checked={leaveForm.leaveType === 'short'}
                          onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                        />
                        <label className="form-check-label">
                          Short Leave (Hours)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time fields for short leave */}
                {leaveForm.leaveType === 'short' && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Time Out</label>
                      <input
                        type="time"
                        className="form-control"
                        value={leaveForm.timeOut}
                        onChange={(e) => setLeaveForm({...leaveForm, timeOut: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Time In</label>
                      <input
                        type="time"
                        className="form-control"
                        value={leaveForm.timeIn}
                        onChange={(e) => setLeaveForm({...leaveForm, timeIn: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    placeholder="Please provide a detailed reason for leave..."
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label">Supporting Documents (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setLeaveForm({...leaveForm, documents: e.target.files})}
                  />
                  <small className="text-muted">
                    Accepted formats: PDF, JPG, PNG. Max size: 5MB per file.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={submitLeaveApplication}
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 && activeTab === 'attendance' && (
        <div className="text-center py-5">
          <i className="bi bi-person fs-1 text-muted"></i>
          <h5 className="text-muted mt-3">No Zero Period Students Found</h5>
          <p className="text-muted">No students are currently in the zero period trial phase.</p>
        </div>
      )}

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .site-header--sticky--attendance {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 15px 0;
        }
        
        .attendance-controls {
          border: 1px solid #e3f2fd;
          border-radius: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .btn-group-sm .btn {
          font-size: 0.75rem;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
        }
        
        .progress {
          border-radius: 10px;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .card {
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        
        .card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .card-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid #dee2e6;
          border-radius: 12px 12px 0 0;
        }
        
        .nav-pills .nav-link {
          font-size: 0.9rem;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          margin-right: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .nav-pills .nav-link.active {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }
        
        .nav-pills .nav-link:hover:not(.active) {
          background-color: #f8f9fa;
          transform: translateY(-1px);
        }
        
        .table th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: none;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 1rem;
        }
        
        .table td {
          border: none;
          padding: 1rem;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .table tbody tr:hover {
          background-color: #f8f9ff;
          transform: scale(1.01);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .badge {
          font-size: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-weight: 500;
        }
        
        .transition-col {
          transition: all 0.3s ease;
        }
        
        .btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .form-control, .form-select {
          border-radius: 8px;
          border: 1px solid #e1e5e9;
          transition: all 0.3s ease;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .modal-content {
          border-radius: 15px;
          border: none;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        
        .modal-header {
          border-bottom: 1px solid #e9ecef;
          border-radius: 15px 15px 0 0;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        
        @media (max-width: 768px) {
          .site-header--sticky--attendance {
            left: 0;
            right: 0;
            padding: 10px;
          }
          
          .btn-group-sm .btn {
            font-size: 0.65rem;
            padding: 0.3rem 0.4rem;
          }
          
          .attendance-controls {
            padding: 10px;
          }
          
          .card-body {
            padding: 1rem;
          }
          
          .table-responsive {
            font-size: 0.875rem;
          }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .card, .modal-content {
          animation: fadeIn 0.5s ease-out;
        }
        
        .content-body {
          padding: 2rem 1rem;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;



// import React, { useState, useEffect } from 'react';

// const AttendanceManagement = () => {
//   const [activeTab, setActiveTab] = useState('attendance');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
//   const [showBulkControls, setShowBulkControls] = useState(false);
//   const [selectedStudents, setSelectedStudents] = useState(new Set());
//   const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState('');
//   const [leaveFilter, setLeaveFilter] = useState('all');
//   const [dateRange, setDateRange] = useState({
//     fromDate: '',
//     toDate: ''
//   });

//   // Enhanced student data with leave tracking
//   const [students, setStudents] = useState([
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
//       profileImage: null,
//       parentName: 'Tom Williams',
//       parentMobile: '+91 9876543241',
//       zeroPeriodDays: 15,
//       trialStartDate: '2024-03-01',
//       trialEndDate: '2024-03-16',
//       totalTrialDays: 16,
//       // Enhanced attendance tracking
//       attendanceStats: {
//         presentDays: 12,
//         absentDays: 2,
//         lateDays: 1,
//         leaveDays: 1,
//         totalDays: 16,
//         attendancePercentage: 75
//       },
//       leaves: [
//         {
//           id: 1,
//           date: '2024-03-05',
//           type: 'sick',
//           reason: 'Fever',
//           status: 'approved',
//           appliedDate: '2024-03-04',
//           approvedBy: 'Teacher Name'
//         },
//         {
//           id: 2,
//           date: '2024-03-12',
//           type: 'personal',
//           reason: 'Family function',
//           status: 'pending',
//           appliedDate: '2024-03-10'
//         }
//       ]
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
//       status: 'active',
//       admissionStatus: 'zeroPeriod',
//       profileImage: null,
//       parentName: 'Robert Brown',
//       parentMobile: '+91 9876543251',
//       zeroPeriodDays: 20,
//       trialStartDate: '2024-02-25',
//       trialEndDate: '2024-03-17',
//       totalTrialDays: 20,
//       attendanceStats: {
//         presentDays: 13,
//         absentDays: 5,
//         lateDays: 2,
//         leaveDays: 0,
//         totalDays: 20,
//         attendancePercentage: 65
//       },
//       leaves: []
//     },
//     {
//       id: 6,
//       enrollmentNumber: 'STU006',
//       name: 'Emily Johnson',
//       email: 'emily.johnson@example.com',
//       mobile: '+91 9876543260',
//       batchId: 1,
//       batchName: 'CS101 Morning Batch',
//       admissionDate: '2024-03-01',
//       status: 'active',
//       admissionStatus: 'zeroPeriod',
//       profileImage: null,
//       parentName: 'Michael Johnson',
//       parentMobile: '+91 9876543261',
//       zeroPeriodDays: 10,
//       trialStartDate: '2024-03-05',
//       trialEndDate: '2024-03-20',
//       totalTrialDays: 15,
//       attendanceStats: {
//         presentDays: 8,
//         absentDays: 1,
//         lateDays: 1,
//         leaveDays: 0,
//         totalDays: 10,
//         attendancePercentage: 80
//       },
//       leaves: [
//         {
//           id: 3,
//           date: '2024-03-15',
//           type: 'emergency',
//           reason: 'Medical emergency',
//           status: 'approved',
//           appliedDate: '2024-03-15',
//           approvedBy: 'Principal'
//         }
//       ]
//     }
//   ]);

//   // Today's attendance state
//   const [todayAttendance, setTodayAttendance] = useState({});

//   // Leave application state
//   const [showLeaveModal, setShowLeaveModal] = useState(false);
//   const [leaveForm, setLeaveForm] = useState({
//     studentId: '',
//     date: '',
//     type: 'sick',
//     reason: '',
//     documents: null
//   });

//   // Initialize today's attendance
//   useEffect(() => {
//     const initialAttendance = {};
//     students.forEach(student => {
//       initialAttendance[student.id] = {
//         status: '',
//         timeIn: '',
//         timeOut: '',
//         notes: '',
//         isMarked: false
//       };
//     });
//     setTodayAttendance(initialAttendance);
//   }, [selectedDate]);

//   // Filter students
//   const getFilteredStudents = () => {
//     let filtered = students.filter(s => s.admissionStatus === 'zeroPeriod');
    
//     if (searchQuery) {
//       filtered = filtered.filter(student => 
//         student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }
    
//     return filtered;
//   };

//   // Get all leaves with filtering and sorting
//   const getFilteredLeaves = () => {
//     let allLeaves = [];
//     students.forEach(student => {
//       student.leaves.forEach(leave => {
//         allLeaves.push({
//           ...leave,
//           studentName: student.name,
//           studentId: student.id,
//           enrollmentNumber: student.enrollmentNumber
//         });
//       });
//     });

//     // Filter by status
//     if (leaveFilter !== 'all') {
//       allLeaves = allLeaves.filter(leave => leave.status === leaveFilter);
//     }

//     // Filter by date range
//     if (dateRange.fromDate) {
//       allLeaves = allLeaves.filter(leave => new Date(leave.date) >= new Date(dateRange.fromDate));
//     }
//     if (dateRange.toDate) {
//       allLeaves = allLeaves.filter(leave => new Date(leave.date) <= new Date(dateRange.toDate));
//     }

//     // Sort by date (newest first)
//     allLeaves.sort((a, b) => new Date(b.date) - new Date(a.date));

//     return allLeaves;
//   };

//   const filteredStudents = getFilteredStudents();
//   const filteredLeaves = getFilteredLeaves();

//   // Mark individual attendance
//   const markIndividualAttendance = (studentId, status) => {
//     setTodayAttendance(prev => ({
//       ...prev,
//       [studentId]: {
//         ...prev[studentId],
//         status: status,
//         timeIn: status !== 'absent' && status !== 'leave' ? 
//           (prev[studentId]?.timeIn || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })) : '',
//         timeOut: prev[studentId]?.timeOut || '',
//         isMarked: true
//       }
//     }));

//     // Update student attendance stats
//     setStudents(prevStudents => 
//       prevStudents.map(student => {
//         if (student.id === studentId) {
//           const newStats = { ...student.attendanceStats };
//           newStats.totalDays += 1;
          
//           switch(status) {
//             case 'present':
//               newStats.presentDays += 1;
//               break;
//             case 'absent':
//               newStats.absentDays += 1;
//               break;
//             case 'late':
//               newStats.lateDays += 1;
//               newStats.presentDays += 1; // Late is considered present
//               break;
//             case 'leave':
//               newStats.leaveDays += 1;
//               break;
//           }
          
//           // Recalculate percentage
//           newStats.attendancePercentage = Math.round(
//             ((newStats.presentDays + newStats.lateDays) / newStats.totalDays) * 100
//           );
          
//           return {
//             ...student,
//             attendanceStats: newStats
//           };
//         }
//         return student;
//       })
//     );
//   };

//   // Bulk attendance functions
//   const toggleStudentSelection = (studentId) => {
//     const newSelected = new Set(selectedStudents);
//     if (newSelected.has(studentId)) {
//       newSelected.delete(studentId);
//     } else {
//       newSelected.add(studentId);
//     }
//     setSelectedStudents(newSelected);
//   };

//   const selectAllStudents = () => {
//     if (selectedStudents.size === filteredStudents.length) {
//       setSelectedStudents(new Set());
//     } else {
//       setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
//     }
//   };

//   const applyBulkAttendance = () => {
//     if (!bulkAttendanceStatus || selectedStudents.size === 0) return;
    
//     selectedStudents.forEach(studentId => {
//       markIndividualAttendance(studentId, bulkAttendanceStatus);
//     });
    
//     setSelectedStudents(new Set());
//     setBulkAttendanceStatus('');
//     setShowBulkControls(false);
//     alert(`Bulk attendance marked for ${selectedStudents.size} students`);
//   };

//   // Leave management functions
//   const handleLeaveApplication = (studentId) => {
//     setLeaveForm({
//       ...leaveForm,
//       studentId: studentId,
//       date: selectedDate
//     });
//     setShowLeaveModal(true);
//   };

//   const submitLeaveApplication = () => {
//     if (!leaveForm.reason.trim()) {
//       alert('Please provide a reason for leave');
//       return;
//     }

//     const newLeave = {
//       id: Date.now(),
//       date: leaveForm.date,
//       type: leaveForm.type,
//       reason: leaveForm.reason,
//       status: 'pending',
//       appliedDate: new Date().toISOString().split('T')[0]
//     };

//     setStudents(prevStudents =>
//       prevStudents.map(student => {
//         if (student.id === parseInt(leaveForm.studentId)) {
//           return {
//             ...student,
//             leaves: [...student.leaves, newLeave]
//           };
//         }
//         return student;
//       })
//     );

//     setShowLeaveModal(false);
//     setLeaveForm({
//       studentId: '',
//       date: '',
//       type: 'sick',
//       reason: '',
//       documents: null
//     });
//     alert('Leave application submitted successfully');
//   };

//   const approveLeave = (studentId, leaveId) => {
//     setStudents(prevStudents =>
//       prevStudents.map(student => {
//         if (student.id === studentId) {
//           return {
//             ...student,
//             leaves: student.leaves.map(leave => 
//               leave.id === leaveId 
//                 ? { ...leave, status: 'approved', approvedBy: 'Current User' }
//                 : leave
//             )
//           };
//         }
//         return student;
//       })
//     );
//   };

//   const rejectLeave = (studentId, leaveId) => {
//     setStudents(prevStudents =>
//       prevStudents.map(student => {
//         if (student.id === studentId) {
//           return {
//             ...student,
//             leaves: student.leaves.map(leave => 
//               leave.id === leaveId 
//                 ? { ...leave, status: 'rejected' }
//                 : leave
//             )
//           };
//         }
//         return student;
//       })
//     );
//   };

//   // Save attendance
//   const saveAllAttendance = () => {
//     const markedCount = Object.values(todayAttendance).filter(a => a.isMarked).length;
//     alert(`Attendance saved for ${markedCount} students on ${new Date(selectedDate).toLocaleDateString()}`);
//   };

//   // Utility functions
//   const getStatusColor = (status) => {
//     switch(status) {
//       case 'present': return 'success';
//       case 'late': return 'warning';
//       case 'absent': return 'danger';
//       case 'leave': return 'info';
//       default: return 'secondary';
//     }
//   };

//   const getLeaveStatusColor = (status) => {
//     switch(status) {
//       case 'approved': return 'success';
//       case 'pending': return 'warning';
//       case 'rejected': return 'danger';
//       default: return 'secondary';
//     }
//   };

//   const getProgressColor = (progress) => {
//     if (progress >= 80) return 'success';
//     if (progress >= 60) return 'warning';
//     return 'danger';
//   };

//   // Tab definitions
//   const tabs = [
//     { key: 'attendance', label: 'Mark Attendance', icon: 'fas fa-check-circle' },
//     { key: 'leaves', label: 'Leave Management', icon: 'fas fa-calendar-times' },
//     { key: 'reports', label: 'Attendance Reports', icon: 'fas fa-chart-bar' }
//   ];

//   return (
//     <div className="container-fluid">
//       {/* Header */}
//       <div className="site-header--sticky--attendance">
//         <div className="container-fluid">
//           <div className="row align-items-center">
//             <div className="col-md-4">
//               <div className="d-flex align-items-center">
//                 <h4 className="fw-bold text-dark mb-0 me-3">Enhanced Attendance System</h4>
//                 <span className="badge bg-warning">{filteredStudents.length} Students</span>
//               </div>
//             </div>

//             <div className="col-md-8">
//               <div className="d-flex justify-content-end align-items-center gap-2">
//                 {/* Date Picker */}
//                 <div className="d-flex align-items-center me-3">
//                   <label className="form-label me-2 mb-0 small fw-bold">Date:</label>
//                   <input
//                     type="date"
//                     className="form-control form-control-sm"
//                     value={selectedDate}
//                     onChange={(e) => setSelectedDate(e.target.value)}
//                     style={{ width: '150px' }}
//                   />
//                 </div>

//                 {/* Search */}
//                 <div className="input-group" style={{ maxWidth: '250px' }}>
//                   <span className="input-group-text bg-white border-end-0">
//                     <i className="fas fa-search text-muted"></i>
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control border-start-0"
//                     placeholder="Search students..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                 </div>

//                 {/* Bulk Controls Toggle */}
//                 {activeTab === 'attendance' && (
//                   <button
//                     onClick={() => setShowBulkControls(!showBulkControls)}
//                     className={`btn btn-sm ${showBulkControls ? 'btn-primary' : 'btn-outline-primary'}`}
//                   >
//                     <i className="fas fa-users me-1"></i>
//                     Bulk Actions
//                   </button>
//                 )}

//                 {/* Save Button */}
//                 {activeTab === 'attendance' && (
//                   <button className="btn btn-sm btn-success" onClick={saveAllAttendance}>
//                     <i className="fas fa-save me-1"></i>
//                     Save All
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Tab Navigation */}
//             <div className="col-12 mt-3">
//               <ul className="nav nav-pills">
//                 {tabs.map((tab) => (
//                   <li className="nav-item" key={tab.key}>
//                     <button
//                       className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
//                       onClick={() => setActiveTab(tab.key)}
//                     >
//                       <i className={`${tab.icon} me-2`}></i>
//                       {tab.label}
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Bulk Controls Panel */}
//             {showBulkControls && activeTab === 'attendance' && (
//               <div className="col-12 mt-3 p-3 bg-light rounded">
//                 <div className="d-flex align-items-center gap-3 flex-wrap">
//                   <div className="d-flex align-items-center">
//                     <input
//                       type="checkbox"
//                       className="form-check-input me-2"
//                       checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
//                       onChange={selectAllStudents}
//                     />
//                     <label className="form-check-label fw-bold">
//                       Select All ({selectedStudents.size}/{filteredStudents.length})
//                     </label>
//                   </div>

//                   {selectedStudents.size > 0 && (
//                     <>
//                       <div className="d-flex align-items-center gap-2">
//                         <label className="form-label mb-0 small fw-bold">Mark as:</label>
//                         <select
//                           className="form-select form-select-sm"
//                           value={bulkAttendanceStatus}
//                           onChange={(e) => setBulkAttendanceStatus(e.target.value)}
//                           style={{ width: '130px' }}
//                         >
//                           <option value="">Select Status</option>
//                           <option value="present">Present</option>
//                           <option value="late">Late</option>
//                           <option value="absent">Absent</option>
//                           <option value="leave">Leave</option>
//                         </select>
//                       </div>

//                       <button
//                         onClick={applyBulkAttendance}
//                         className="btn btn-primary btn-sm"
//                         disabled={!bulkAttendanceStatus}
//                       >
//                         <i className="fas fa-check me-1"></i>
//                         Apply to {selectedStudents.size} Students
//                       </button>

//                       <button
//                         onClick={() => {
//                           setSelectedStudents(new Set());
//                           setBulkAttendanceStatus('');
//                         }}
//                         className="btn btn-outline-secondary btn-sm"
//                       >
//                         <i className="fas fa-times me-1"></i>
//                         Clear Selection
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="content-body" style={{marginTop: showBulkControls ? '250px' : '180px'}}>
        
//         {/* Attendance Tab */}
//         {activeTab === 'attendance' && (
//           <section className="list-view">
//             <div className='row'>
//               <div className="col-12">
//                 <div className="card px-3">
//                   <div className="row">
//                     {filteredStudents.map((student, studentIndex) => (
//                       <div className="card-content transition-col mb-2" key={studentIndex}>
//                         {/* Enhanced Student Header Card with Attendance */}
//                         <div className="card border-0 shadow-sm mb-0 mt-2">
//                           <div className="card-body px-3 py-3">
//                             <div className="row align-items-center">
//                               {/* Student Info with Checkbox */}
//                               <div className="col-md-4">
//                                 <div className="d-flex align-items-center">
//                                   {/* Bulk Selection Checkbox */}
//                                   {showBulkControls && (
//                                     <div className="form-check me-3">
//                                       <input
//                                         className="form-check-input"
//                                         type="checkbox"
//                                         checked={selectedStudents.has(student.id)}
//                                         onChange={() => toggleStudentSelection(student.id)}
//                                       />
//                                     </div>
//                                   )}
                                  
//                                   <div className="me-3">
//                                     <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
//                                          style={{ width: '50px', height: '50px' }}>
//                                       <i className="bi bi-person-fill fs-4 text-primary"></i>
//                                     </div>
//                                   </div>
//                                   <div>
//                                     <h6 className="mb-0 fw-bold">{student.name}</h6>
//                                     <small className="text-muted">{student.enrollmentNumber}</small>
//                                     <div className="mt-1">
//                                       {todayAttendance[student.id]?.isMarked && (
//                                         <span className={`badge bg-${getStatusColor(todayAttendance[student.id]?.status)} me-1`}>
//                                           <i className={`fas ${todayAttendance[student.id]?.status === 'present' ? 'fa-check' : 
//                                             todayAttendance[student.id]?.status === 'late' ? 'fa-clock' : 
//                                             todayAttendance[student.id]?.status === 'leave' ? 'fa-calendar' : 'fa-times'} me-1`}></i>
//                                           {todayAttendance[student.id]?.status?.toUpperCase()}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* Enhanced Attendance Marking Controls */}
//                               <div className="col-md-5">
//                                 <div className="attendance-controls">
//                                   <h6 className="text-dark mb-2 small fw-bold">
//                                     <i className="fas fa-calendar-check me-1"></i>
//                                     Today's Attendance - {new Date(selectedDate).toLocaleDateString()}
//                                   </h6>
//                                   <div className="btn-group btn-group-sm w-100 mb-2" role="group">
//                                     <button
//                                       type="button"
//                                       className={`btn ${todayAttendance[student.id]?.status === 'present' ? 'btn-success' : 'btn-outline-success'}`}
//                                       onClick={() => markIndividualAttendance(student.id, 'present')}
//                                     >
//                                       <i className="fas fa-check"></i> Present
//                                     </button>
//                                     <button
//                                       type="button"
//                                       className={`btn ${todayAttendance[student.id]?.status === 'late' ? 'btn-warning' : 'btn-outline-warning'}`}
//                                       onClick={() => markIndividualAttendance(student.id, 'late')}
//                                     >
//                                       <i className="fas fa-clock"></i> Late
//                                     </button>
//                                     <button
//                                       type="button"
//                                       className={`btn ${todayAttendance[student.id]?.status === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
//                                       onClick={() => markIndividualAttendance(student.id, 'absent')}
//                                     >
//                                       <i className="fas fa-times"></i> Absent
//                                     </button>
//                                     <button
//                                       type="button"
//                                       className={`btn ${todayAttendance[student.id]?.status === 'leave' ? 'btn-info' : 'btn-outline-info'}`}
//                                       onClick={() => markIndividualAttendance(student.id, 'leave')}
//                                     >
//                                       <i className="fas fa-calendar"></i> Leave
//                                     </button>
//                                   </div>

//                                   {/* Time Fields */}
//                                   {todayAttendance[student.id]?.status && 
//                                    todayAttendance[student.id]?.status !== 'absent' && 
//                                    todayAttendance[student.id]?.status !== 'leave' && (
//                                     <div className="row">
//                                       <div className="col-6">
//                                         <label className="form-label small mb-1">Time In</label>
//                                         <input
//                                           type="time"
//                                           className="form-control form-control-sm"
//                                           value={todayAttendance[student.id]?.timeIn || ''}
//                                           onChange={(e) => setTodayAttendance(prev => ({
//                                             ...prev,
//                                             [student.id]: { ...prev[student.id], timeIn: e.target.value }
//                                           }))}
//                                         />
//                                       </div>
//                                       <div className="col-6">
//                                         <label className="form-label small mb-1">Time Out</label>
//                                         <input
//                                           type="time"
//                                           className="form-control form-control-sm"
//                                           value={todayAttendance[student.id]?.timeOut || ''}
//                                           onChange={(e) => setTodayAttendance(prev => ({
//                                             ...prev,
//                                             [student.id]: { ...prev[student.id], timeOut: e.target.value }
//                                           }))}
//                                         />
//                                       </div>
//                                     </div>
//                                   )}

//                                   {/* Leave Application Button */}
//                                   <div className="mt-2">
//                                     <button
//                                       className="btn btn-sm btn-outline-info w-100"
//                                       onClick={() => handleLeaveApplication(student.id)}
//                                     >
//                                       <i className="fas fa-plus me-1"></i>
//                                       Apply Leave
//                                     </button>
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* Enhanced Student Stats */}
//                               <div className="col-md-3">
//                                 <div className="text-center">
//                                   <div className="mb-2">
//                                     <span className="badge bg-warning" style={{ fontSize: '10px', padding: '4px 8px' }}>
//                                       Zero Period ({student.zeroPeriodDays} days)
//                                     </span>
//                                   </div>
                                  
//                                   {/* Enhanced Statistics */}
//                                   <div className="row text-center mb-2">
//                                     <div className="col-3">
//                                       <div className="small fw-bold text-success">{student.attendanceStats.presentDays}</div>
//                                       <div className="small text-muted">Present</div>
//                                     </div>
//                                     <div className="col-3">
//                                       <div className="small fw-bold text-danger">{student.attendanceStats.absentDays}</div>
//                                       <div className="small text-muted">Absent</div>
//                                     </div>
//                                     <div className="col-3">
//                                       <div className="small fw-bold text-warning">{student.attendanceStats.lateDays}</div>
//                                       <div className="small text-muted">Late</div>
//                                     </div>
//                                     <div className="col-3">
//                                       <div className="small fw-bold text-info">{student.attendanceStats.leaveDays}</div>
//                                       <div className="small text-muted">Leaves</div>
//                                     </div>
//                                   </div>

//                                   <div className="d-flex justify-content-between small text-muted mb-1">
//                                     <span>Attendance</span>
//                                     <span>{student.attendanceStats.attendancePercentage}%</span>
//                                   </div>
//                                   <div className="progress" style={{ height: '8px' }}>
//                                     <div 
//                                       className={`progress-bar bg-${getProgressColor(student.attendanceStats.attendancePercentage)}`}
//                                       role="progressbar" 
//                                       style={{ width: `${student.attendanceStats.attendancePercentage}%` }}
//                                     ></div>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>

//                             {/* Notes Section */}
//                             {todayAttendance[student.id]?.isMarked && (
//                               <div className="row mt-3">
//                                 <div className="col-12">
//                                   <label className="form-label small mb-1">Notes (Optional)</label>
//                                   <input
//                                     type="text"
//                                     className="form-control form-control-sm"
//                                     placeholder="Add notes for today's attendance..."
//                                     value={todayAttendance[student.id]?.notes || ''}
//                                     onChange={(e) => setTodayAttendance(prev => ({
//                                       ...prev,
//                                       [student.id]: { ...prev[student.id], notes: e.target.value }
//                                     }))}
//                                   />
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Leave Management Tab */}
//         {activeTab === 'leaves' && (
//           <div className="row">
//             <div className="col-12">
//               <div className="card">
//                 <div className="card-header">
//                   <div className="row align-items-center">
//                     <div className="col-md-6">
//                       <h5 className="mb-0">
//                         <i className="fas fa-calendar-times me-2"></i>
//                         Leave Management
//                       </h5>
//                     </div>
//                     <div className="col-md-6">
//                       <div className="d-flex align-items-center gap-2 justify-content-end">
//                         {/* Leave Status Filter */}
//                         <select
//                           className="form-select form-select-sm"
//                           value={leaveFilter}
//                           onChange={(e) => setLeaveFilter(e.target.value)}
//                           style={{ width: '150px' }}
//                         >
//                           <option value="all">All Leaves</option>
//                           <option value="pending">Pending</option>
//                           <option value="approved">Approved</option>
//                           <option value="rejected">Rejected</option>
//                         </select>

//                         {/* Date Range Filters */}
//                         <input
//                           type="date"
//                           className="form-control form-control-sm"
//                           placeholder="From Date"
//                           value={dateRange.fromDate}
//                           onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
//                           style={{ width: '150px' }}
//                         />
//                         <input
//                           type="date"
//                           className="form-control form-control-sm"
//                           placeholder="To Date"
//                           value={dateRange.toDate}
//                           onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
//                           style={{ width: '150px' }}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="card-body">
//                   {filteredLeaves.length === 0 ? (
//                     <div className="text-center py-4">
//                       <i className="fas fa-calendar-times fs-1 text-muted"></i>
//                       <h5 className="text-muted mt-3">No Leave Applications Found</h5>
//                       <p className="text-muted">No leave applications match your current filters.</p>
//                     </div>
//                   ) : (
//                     <div className="table-responsive">
//                       <table className="table table-hover">
//                         <thead>
//                           <tr>
//                             <th>Student</th>
//                             <th>Date</th>
//                             <th>Type</th>
//                             <th>Reason</th>
//                             <th>Applied Date</th>
//                             <th>Status</th>
//                             <th>Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {filteredLeaves.map((leave, index) => (
//                             <tr key={index}>
//                               <td>
//                                 <div>
//                                   <strong>{leave.studentName}</strong>
//                                   <br />
//                                   <small className="text-muted">{leave.enrollmentNumber}</small>
//                                 </div>
//                               </td>
//                               <td>{new Date(leave.date).toLocaleDateString()}</td>
//                               <td>
//                                 <span className={`badge bg-secondary`}>
//                                   {leave.type}
//                                 </span>
//                               </td>
//                               <td className="text-wrap" style={{ maxWidth: '200px' }}>
//                                 {leave.reason}
//                               </td>
//                               <td>{new Date(leave.appliedDate).toLocaleDateString()}</td>
//                               <td>
//                                 <span className={`badge bg-${getLeaveStatusColor(leave.status)}`}>
//                                   {leave.status}
//                                 </span>
//                                 {leave.approvedBy && (
//                                   <small className="d-block text-muted">
//                                     by {leave.approvedBy}
//                                   </small>
//                                 )}
//                               </td>
//                               <td>
//                                 {leave.status === 'pending' && (
//                                   <div className="btn-group btn-group-sm">
//                                     <button
//                                       className="btn btn-success"
//                                       onClick={() => approveLeave(leave.studentId, leave.id)}
//                                     >
//                                       <i className="fas fa-check"></i>
//                                     </button>
//                                     <button
//                                       className="btn btn-danger"
//                                       onClick={() => rejectLeave(leave.studentId, leave.id)}
//                                     >
//                                       <i className="fas fa-times"></i>
//                                     </button>
//                                   </div>
//                                 )}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Reports Tab */}
//         {activeTab === 'reports' && (
//           <div className="row">
//             <div className="col-12">
//               <div className="card">
//                 <div className="card-header">
//                   <h5 className="mb-0">
//                     <i className="fas fa-chart-bar me-2"></i>
//                     Attendance Reports
//                   </h5>
//                 </div>
//                 <div className="card-body">
//                   {/* Overall Statistics */}
//                   <div className="row mb-4">
//                     <div className="col-md-3">
//                       <div className="card text-center">
//                         <div className="card-body">
//                           <h5 className="card-title text-success">
//                             {students.reduce((sum, s) => sum + s.attendanceStats.presentDays, 0)}
//                           </h5>
//                           <p className="card-text text-muted">Total Present Days</p>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="col-md-3">
//                       <div className="card text-center">
//                         <div className="card-body">
//                           <h5 className="card-title text-danger">
//                             {students.reduce((sum, s) => sum + s.attendanceStats.absentDays, 0)}
//                           </h5>
//                           <p className="card-text text-muted">Total Absent Days</p>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="col-md-3">
//                       <div className="card text-center">
//                         <div className="card-body">
//                           <h5 className="card-title text-warning">
//                             {students.reduce((sum, s) => sum + s.attendanceStats.lateDays, 0)}
//                           </h5>
//                           <p className="card-text text-muted">Total Late Days</p>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="col-md-3">
//                       <div className="card text-center">
//                         <div className="card-body">
//                           <h5 className="card-title text-info">
//                             {students.reduce((sum, s) => sum + s.attendanceStats.leaveDays, 0)}
//                           </h5>
//                           <p className="card-text text-muted">Total Leave Days</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Student-wise Report */}
//                   <div className="table-responsive">
//                     <table className="table table-striped">
//                       <thead>
//                         <tr>
//                           <th>Student</th>
//                           <th>Present</th>
//                           <th>Absent</th>
//                           <th>Late</th>
//                           <th>Leaves</th>
//                           <th>Total Days</th>
//                           <th>Attendance %</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {filteredStudents.map((student) => (
//                           <tr key={student.id}>
//                             <td>
//                               <strong>{student.name}</strong>
//                               <br />
//                               <small className="text-muted">{student.enrollmentNumber}</small>
//                             </td>
//                             <td>
//                               <span className="badge bg-success">
//                                 {student.attendanceStats.presentDays}
//                               </span>
//                             </td>
//                             <td>
//                               <span className="badge bg-danger">
//                                 {student.attendanceStats.absentDays}
//                               </span>
//                             </td>
//                             <td>
//                               <span className="badge bg-warning">
//                                 {student.attendanceStats.lateDays}
//                               </span>
//                             </td>
//                             <td>
//                               <span className="badge bg-info">
//                                 {student.attendanceStats.leaveDays}
//                               </span>
//                             </td>
//                             <td>{student.attendanceStats.totalDays}</td>
//                             <td>
//                               <div className="d-flex align-items-center">
//                                 <div className="progress me-2" style={{ width: '100px', height: '20px' }}>
//                                   <div 
//                                     className={`progress-bar bg-${getProgressColor(student.attendanceStats.attendancePercentage)}`}
//                                     style={{ width: `${student.attendanceStats.attendancePercentage}%` }}
//                                   >
//                                     {student.attendanceStats.attendancePercentage}%
//                                   </div>
//                                 </div>
//                               </div>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Leave Application Modal */}
//       {showLeaveModal && (
//         <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">Apply for Leave</h5>
//                 <button 
//                   type="button" 
//                   className="btn-close" 
//                   onClick={() => setShowLeaveModal(false)}
//                 ></button>
//               </div>
//               <div className="modal-body">
//                 <div className="mb-3">
//                   <label className="form-label">Date</label>
//                   <input
//                     type="date"
//                     className="form-control"
//                     value={leaveForm.date}
//                     onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})}
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label">Leave Type</label>
//                   <select
//                     className="form-select"
//                     value={leaveForm.type}
//                     onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
//                   >
//                     <option value="sick">Sick Leave</option>
//                     <option value="personal">Personal Leave</option>
//                     <option value="emergency">Emergency Leave</option>
//                     <option value="other">Other</option>
//                   </select>
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label">Reason</label>
//                   <textarea
//                     className="form-control"
//                     rows="3"
//                     value={leaveForm.reason}
//                     onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
//                     placeholder="Please provide a reason for leave..."
//                   ></textarea>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button 
//                   type="button" 
//                   className="btn btn-secondary" 
//                   onClick={() => setShowLeaveModal(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   type="button" 
//                   className="btn btn-primary" 
//                   onClick={submitLeaveApplication}
//                 >
//                   Submit Application
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {filteredStudents.length === 0 && activeTab === 'attendance' && (
//         <div className="text-center py-5">
//           <i className="bi bi-person fs-1 text-muted"></i>
//           <h5 className="text-muted mt-3">No Zero Period Students Found</h5>
//           <p className="text-muted">No students are currently in the zero period trial phase.</p>
//         </div>
//       )}

//       {/* Enhanced CSS Styles */}
//       <style jsx>{`
//         .site-header--sticky--attendance {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           background: white;
//           z-index: 1000;
//           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//           padding: 20px 0;
//         }
        
//         .attendance-controls {
//           border: 1px solid #e3f2fd;
//           border-radius: 12px;
//           padding: 16px;
//           background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
//           box-shadow: 0 2px 8px rgba(0,0,0,0.05);
//         }
        
//         .btn-group-sm .btn {
//           font-size: 0.75rem;
//           padding: 0.5rem 0.75rem;
//           border-radius: 6px;
//         }
        
//         .progress {
//           border-radius: 10px;
//           box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
//         }
        
//         .card {
//           border: none;
//           box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
//           transition: all 0.3s ease;
//           border-radius: 12px;
//         }
        
//         .card:hover {
//           box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
//           transform: translateY(-2px);
//         }
        
//         .card-header {
//           background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
//           border-bottom: 1px solid #dee2e6;
//           border-radius: 12px 12px 0 0;
//         }
        
//         .nav-pills .nav-link {
//           font-size: 0.9rem;
//           padding: 0.75rem 1.5rem;
//           border-radius: 25px;
//           margin-right: 0.5rem;
//           transition: all 0.3s ease;
//         }
        
//         .nav-pills .nav-link.active {
//           background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
//           box-shadow: 0 4px 12px rgba(0,123,255,0.3);
//         }
        
//         .nav-pills .nav-link:hover:not(.active) {
//           background-color: #f8f9fa;
//           transform: translateY(-1px);
//         }
        
//         .table th {
//           background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
//           border: none;
//           font-weight: 600;
//           font-size: 0.875rem;
//           padding: 1rem;
//         }
        
//         .table td {
//           border: none;
//           padding: 1rem;
//           border-bottom: 1px solid #f1f3f4;
//         }
        
//         .table tbody tr:hover {
//           background-color: #f8f9ff;
//           transform: scale(1.01);
//           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//         }
        
//         .badge {
//           font-size: 0.75rem;
//           padding: 0.5rem 0.75rem;
//           border-radius: 8px;
//           font-weight: 500;
//         }
        
//         .transition-col {
//           transition: all 0.3s ease;
//         }
        
//         .btn {
//           border-radius: 8px;
//           font-weight: 500;
//           transition: all 0.3s ease;
//         }
        
//         .btn:hover {
//           transform: translateY(-1px);
//           box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//         }
        
//         .form-control, .form-select {
//           border-radius: 8px;
//           border: 1px solid #e1e5e9;
//           transition: all 0.3s ease;
//         }
        
//         .form-control:focus, .form-select:focus {
//           border-color: #80bdff;
//           box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
//         }
        
//         @media (max-width: 768px) {
//           .site-header--sticky--attendance {
//             left: 0;
//             right: 0;
//             padding: 15px;
//           }
          
//           .btn-group-sm .btn {
//             font-size: 0.7rem;
//             padding: 0.375rem 0.5rem;
//           }
          
//           .attendance-controls {
//             padding: 12px;
//           }
          
//           .card-body {
//             padding: 1rem;
//           }
          
//           .table-responsive {
//             font-size: 0.875rem;
//           }
//         }
        
//         @keyframes fadeIn {
//           from { 
//             opacity: 0; 
//             transform: translateY(-20px); 
//           }
//           to { 
//             opacity: 1; 
//             transform: translateY(0); 
//           }
//         }
        
//         .card, .modal-content {
//           animation: fadeIn 0.5s ease-out;
//         }
        
//         .content-body {
//           padding: 2rem 1rem;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default AttendanceManagement;