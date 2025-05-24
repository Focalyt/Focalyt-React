import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, UserPlus, Edit, Trash2, Search, Filter, Download, Upload,
  Mail, Phone, Calendar, MapPin, BookOpen, Award, AlertTriangle,
  FileText, Eye, X, Save, ChevronDown, Clock, CheckCircle,
  Building, Layers, GraduationCap, User, MoreVertical
} from 'lucide-react';

const Student = () => {
  // ------- STATE MANAGEMENT -------
  // Tab state
  const [activeTab, setActiveTab] = useState('students');
  
  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  
  // Editing states
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Form states
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    mobile: '',
    enrollmentNumber: '',
    courseId: '',
    batchId: '',
    centerId: '',
    admissionDate: '',
    address: '',
    parentName: '',
    parentMobile: '',
    status: 'active',
    password: '',
    confirmPassword: ''
  });

  const [passwordMismatch, setPasswordMismatch] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    course: '',
    batch: '',
    center: '',
    status: ''
  });
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  // Selected students for bulk actions
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Data states
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [centers, setCenters] = useState([]);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedStudents: 0,
    droppedStudents: 0
  });

  // ------- LIFECYCLE HOOKS -------
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'analytics') {
      fetchStatistics();
    }
  }, [activeTab, filterOptions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-toggle')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ------- API CALLS -------
  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchCourses(),
        fetchBatches(),
        fetchCenters(),
        fetchStudents()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;
      const collegeId = userData.collegeId;

      const params = new URLSearchParams({
        collegeId,
        ...filterOptions
      });

      const response = await axios.get(`${backendUrl}/college/students?${params}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        const fetchedStudents = response.data.students.map((student, index) => ({
          _id: student._id,
          id: index + 1,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          enrollmentNumber: student.enrollmentNumber,
          course: student.courseId?.name || 'N/A',
          courseId: student.courseId?._id,
          batch: student.batchId?.name || 'N/A',
          batchId: student.batchId?._id,
          center: student.centerId?.name || 'N/A',
          centerId: student.centerId?._id,
          admissionDate: student.admissionDate,
          status: student.status || 'active',
          attendance: student.attendance || 0,
          performance: student.performance || 'N/A',
          lastActive: student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'N/A',
          address: student.address,
          parentName: student.parentName,
          parentMobile: student.parentMobile
        }));

        setStudents(fetchedStudents);
        updateStatistics(fetchedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to fetch students');
    }
  };

  const fetchCourses = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/courses/list`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/batches/list`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        setBatches(response.data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchCenters = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/centers/list`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        setCenters(response.data.centers);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      const token = userData.token;

      const response = await axios.get(`${backendUrl}/college/students/statistics`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // ------- HELPER FUNCTIONS -------
  const updateStatistics = (studentsList) => {
    const stats = {
      totalStudents: studentsList.length,
      activeStudents: studentsList.filter(s => s.status === 'active').length,
      completedStudents: studentsList.filter(s => s.status === 'completed').length,
      droppedStudents: studentsList.filter(s => s.status === 'dropped').length
    };
    setStatistics(stats);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'completed':
        return 'bg-info';
      case 'dropped':
        return 'bg-danger';
      case 'on-hold':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  const handleDropdownToggle = (id) => {
    setOpenDropdownId(prev => (prev === id ? null : id));
  };

  // ------- EVENT HANDLERS -------
  const handleOpenStudentModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        enrollmentNumber: student.enrollmentNumber,
        courseId: student.courseId || '',
        batchId: student.batchId || '',
        centerId: student.centerId || '',
        admissionDate: student.admissionDate || '',
        address: student.address || '',
        parentName: student.parentName || '',
        parentMobile: student.parentMobile || '',
        status: student.status || 'active',
        password: '',
        confirmPassword: ''
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        name: '',
        email: '',
        mobile: '',
        enrollmentNumber: '',
        courseId: '',
        batchId: '',
        centerId: '',
        admissionDate: '',
        address: '',
        parentName: '',
        parentMobile: '',
        status: 'active',
        password: '',
        confirmPassword: ''
      });
    }
    setShowStudentModal(true);
  };

  const handleStudentFormChange = (e) => {
    const { id, value } = e.target;
    const updatedForm = {
      ...studentForm,
      [id]: value
    };

    if ((id === "password" || id === "confirmPassword") &&
        updatedForm.password && updatedForm.confirmPassword) {
      setPasswordMismatch(updatedForm.password !== updatedForm.confirmPassword);
    }

    setStudentForm(updatedForm);
  };

  const handleSaveStudent = async () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    const payload = {
      ...studentForm,
      collegeId: userData.collegeId
    };

    try {
      if (editingStudent) {
        const response = await axios.put(
          `${backendUrl}/college/students/${editingStudent._id}`,
          payload,
          { headers: { 'x-auth': token } }
        );
        if (response.data.success) {
          alert("Student updated successfully");
          fetchStudents();
        }
      } else {
        const response = await axios.post(
          `${backendUrl}/college/students/add`,
          payload,
          { headers: { 'x-auth': token } }
        );
        if (response.data.success) {
          alert("Student added successfully");
          fetchStudents();
        }
      }
      setShowStudentModal(false);
      resetStudentForm();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Something went wrong");
    }
  };

  const handleDeleteStudent = async () => {
    if (!itemToDelete) return;

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    try {
      const response = await axios.delete(
        `${backendUrl}/college/students/${itemToDelete.item._id}`,
        { headers: { 'x-auth': token } }
      );

      if (response.data.success) {
        alert('Student deleted successfully!');
        fetchStudents();
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to delete student");
    }
  };

  const handleViewStudent = (student) => {
    setViewingStudent(student);
    setShowViewModal(true);
  };

  const handleBulkAction = (action) => {
    if (selectedStudents.length === 0) {
      alert('Please select students first');
      return;
    }

    switch (action) {
      case 'assignBatch':
        setShowBatchAssignModal(true);
        break;
      case 'export':
        handleExportStudents();
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) {
          handleBulkDelete();
        }
        break;
      default:
        break;
    }
  };

  const handleExportStudents = () => {
    // Implement CSV export functionality
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Mobile,Enrollment Number,Course,Batch,Center,Status\n"
      + students.map(s => 
          `${s.name},${s.email},${s.mobile},${s.enrollmentNumber},${s.course},${s.batch},${s.center},${s.status}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    // Implement bulk delete functionality
    console.log('Bulk delete:', selectedStudents);
  };

  const resetStudentForm = () => {
    setStudentForm({
      name: '',
      email: '',
      mobile: '',
      enrollmentNumber: '',
      courseId: '',
      batchId: '',
      centerId: '',
      admissionDate: '',
      address: '',
      parentName: '',
      parentMobile: '',
      status: 'active',
      password: '',
      confirmPassword: ''
    });
    setEditingStudent(null);
    setPasswordMismatch(false);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s._id));
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // ------- RENDER FUNCTIONS -------
  const renderStudentsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-semibold">Student Management</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary d-flex align-items-center"
            onClick={() => setShowBulkUploadModal(true)}
          >
            <Upload className="me-2" size={16} />
            Bulk Upload
          </button>
          
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">All</p>
                  <h3 className="mb-0">{statistics.totalStudents}</h3>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Admission List</p>
                  <h3 className="mb-0 text-success">{statistics.activeStudents}</h3>
                </div>
                <CheckCircle className="text-success" size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Zero Period List</p>
                  <h3 className="mb-0 text-info">{statistics.completedStudents}</h3>
                </div>
                <Award className="text-info" size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Batch Freez List</p>
                  <h3 className="mb-0 text-danger">{statistics.droppedStudents}</h3>
                </div>
                <AlertTriangle className="text-danger" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-4">
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                  <Search className="text-secondary" size={20} />
                </div>
                <input
                  type="text"
                  className="form-control ps-5 m-0"
                  placeholder="Search students by name, email, or enrollment number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filterOptions.course}
                onChange={(e) => setFilterOptions({...filterOptions, course: e.target.value})}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filterOptions.batch}
                onChange={(e) => setFilterOptions({...filterOptions, batch: e.target.value})}
              >
                <option value="">All Batches</option>
                {batches.map(batch => (
                  <option key={batch._id} value={batch._id}>{batch.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filterOptions.center}
                onChange={(e) => setFilterOptions({...filterOptions, center: e.target.value})}
              >
                <option value="">All Centers</option>
                {centers.map(center => (
                  <option key={center._id} value={center._id}>{center.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filterOptions.status}
                onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
          <span>{selectedStudents.length} students selected</span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleBulkAction('assignBatch')}
            >
              Assign Batch
            </button>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => handleBulkAction('export')}
            >
              Export Selected
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleBulkAction('delete')}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedStudents.length === students.length && students.length > 0}
                    onChange={toggleAllStudents}
                  />
                </th>
                <th>Student</th>
                <th>Enrollment No.</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Center</th>
                <th>Status</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudentSelection(student._id)}
                    />
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle text-primary fw-semibold" 
                           style={{ width: "40px", height: "40px" }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ms-3">
                        <div className="fw-medium">{student.name}</div>
                        <div className="text-muted small">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.enrollmentNumber}</td>
                  <td>{student.course}</td>
                  <td>{student.batch}</td>
                  <td>{student.center}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <div className="progress" style={{ height: '20px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${student.attendance}%` }}
                        aria-valuenow={student.attendance} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        {student.attendance}%
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2 align-items-center">
                      <button
                        className="btn btn-sm btn-link text-info p-0 border-0"
                        onClick={() => handleViewStudent(student)}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-link text-primary p-0 border-0"
                        onClick={() => handleOpenStudentModal(student)}
                        title="Edit student"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-link text-danger p-0 border-0"
                        onClick={() => {
                          setItemToDelete({ type: 'student', item: student });
                          setShowDeleteModal(true);
                        }}
                        title="Delete student"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="position-relative">
                        <button
                          className="btn btn-sm btn-link text-dark p-0 border-0 dropdown-toggle"
                          onClick={() => handleDropdownToggle(student._id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openDropdownId === student._id && (
                          <div 
                            className="dropdown-menu show position-absolute"
                            style={{ 
                              top: '100%', 
                              right: '0',
                              zIndex: 1000
                            }}
                          >
                            <button className="dropdown-item">
                              <FileText className="me-2" size={14} />
                              Generate Report
                            </button>
                            <button className="dropdown-item">
                              <Mail className="me-2" size={14} />
                              Send Email
                            </button>
                            <button className="dropdown-item">
                              <Award className="me-2" size={14} />
                              View Certificates
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-5 text-muted">
              <Users size={48} className="mb-3 opacity-50" />
              <p>No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-semibold">Student Analytics</h1>
        <button className="btn btn-outline-primary d-flex align-items-center">
          <Download className="me-2" size={16} />
          Export Report
        </button>
      </div>

      {/* Performance Overview */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Course-wise Distribution</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Total Students</th>
                      <th>Active</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => {
                      const courseStudents = students.filter(s => s.courseId === course._id);
                      return (
                        <tr key={course._id}>
                          <td>{course.name}</td>
                          <td>{courseStudents.length}</td>
                          <td className="text-success">
                            {courseStudents.filter(s => s.status === 'active').length}
                          </td>
                          <td className="text-info">
                            {courseStudents.filter(s => s.status === 'completed').length}
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

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Center-wise Distribution</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Center</th>
                      <th>Total Students</th>
                      <th>Average Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centers.map(center => {
                      const centerStudents = students.filter(s => s.centerId === center._id);
                      const avgAttendance = centerStudents.length > 0
                        ? Math.round(centerStudents.reduce((sum, s) => sum + s.attendance, 0) / centerStudents.length)
                        : 0;
                      return (
                        <tr key={center._id}>
                          <td>{center.name}</td>
                          <td>{centerStudents.length}</td>
                          <td>
                            <div className="progress" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${avgAttendance}%` }}
                              >
                                {avgAttendance}%
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

      {/* Additional Analytics */}
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Batch Performance</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {batches.slice(0, 5).map(batch => {
                  const batchStudents = students.filter(s => s.batchId === batch._id);
                  return (
                    <div key={batch._id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{batch.name}</h6>
                          <small className="text-muted">{batchStudents.length} students</small>
                        </div>
                        <span className="badge bg-primary">{batch.status || 'Active'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Enrollments</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {students
                  .sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate))
                  .slice(0, 5)
                  .map(student => (
                    <div key={student._id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{student.name}</h6>
                          <small className="text-muted">{student.course}</small>
                        </div>
                        <small className="text-muted">
                          {new Date(student.admissionDate).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Top Performers</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {students
                  .filter(s => s.attendance >= 90)
                  .sort((a, b) => b.attendance - a.attendance)
                  .slice(0, 5)
                  .map(student => (
                    <div key={student._id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{student.name}</h6>
                          <small className="text-muted">{student.course}</small>
                        </div>
                        <div className="text-end">
                          <div className="text-success fw-bold">{student.attendance}%</div>
                          <small className="text-muted">Attendance</small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ------- MODALS -------


  const renderViewModal = () => (
    <div className={`modal ${showViewModal ? 'd-block' : ''}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Student Details</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => {
                setShowViewModal(false);
                setViewingStudent(null);
              }}
            ></button>
          </div>
          <div className="modal-body">
            {viewingStudent && (
              <div>
                <div className="row mb-4">
                  <div className="col-md-4 text-center">
                    <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle text-primary fw-bold mx-auto mb-3" 
                         style={{ width: "100px", height: "100px", fontSize: "2rem" }}>
                      {viewingStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <h5>{viewingStudent.name}</h5>
                    <span className={`badge ${getStatusBadgeClass(viewingStudent.status)}`}>
                      {viewingStudent.status}
                    </span>
                  </div>
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="text-muted small">Email</label>
                        <div className="fw-medium">{viewingStudent.email}</div>
                      </div>
                      <div className="col-6 mb-3">
                        <label className="text-muted small">Mobile</label>
                        <div className="fw-medium">{viewingStudent.mobile}</div>
                      </div>
                      <div className="col-6 mb-3">
                        <label className="text-muted small">Enrollment Number</label>
                        <div className="fw-medium">{viewingStudent.enrollmentNumber}</div>
                      </div>
                      <div className="col-6 mb-3">
                        <label className="text-muted small">Admission Date</label>
                        <div className="fw-medium">
                          {new Date(viewingStudent.admissionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Course</label>
                    <div className="fw-medium">{viewingStudent.course}</div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Batch</label>
                    <div className="fw-medium">{viewingStudent.batch}</div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Center</label>
                    <div className="fw-medium">{viewingStudent.center}</div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Parent/Guardian Name</label>
                    <div className="fw-medium">{viewingStudent.parentName || 'N/A'}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Parent/Guardian Mobile</label>
                    <div className="fw-medium">{viewingStudent.parentMobile || 'N/A'}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-muted small">Address</label>
                  <div className="fw-medium">{viewingStudent.address || 'N/A'}</div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Attendance</label>
                    <div className="progress" style={{ height: '25px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${viewingStudent.attendance}%` }}
                      >
                        {viewingStudent.attendance}%
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Performance</label>
                    <div className="fw-medium">{viewingStudent.performance}</div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Last Active</label>
                    <div className="fw-medium">{viewingStudent.lastActive}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowViewModal(false);
                handleOpenStudentModal(viewingStudent);
              }}
            >
              <Edit className="me-2" size={16} />
              Edit Student
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setShowViewModal(false);
                setViewingStudent(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeleteModal = () => (
    <div className={`modal ${showDeleteModal ? 'd-block' : ''}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Delete</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => {
                setShowDeleteModal(false);
                setItemToDelete(null);
              }}
            ></button>
          </div>
          <div className="modal-body">
            <div className="text-center">
              <AlertTriangle className="text-danger mb-3" size={48} />
              <p>Are you sure you want to delete this student?</p>
              {itemToDelete && (
                <p className="fw-semibold">{itemToDelete.item.name}</p>
              )}
              <p className="text-muted">This action cannot be undone.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setShowDeleteModal(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteStudent}
            >
              Delete Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBulkUploadModal = () => (
    <div className={`modal ${showBulkUploadModal ? 'd-block' : ''}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bulk Student Upload</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowBulkUploadModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info">
              <h6 className="alert-heading">Instructions:</h6>
              <ul className="mb-0">
                <li>Upload a CSV file with student data</li>
                <li>Required columns: Name, Email, Mobile, Enrollment Number, Course</li>
                <li>Optional columns: Batch, Center, Admission Date, Address, Parent Name, Parent Mobile</li>
                <li>Maximum 500 students per upload</li>
              </ul>
            </div>

            <div className="border-2 border-dashed rounded p-5 text-center">
              <Upload className="mx-auto mb-3 text-muted" size={48} />
              <p className="mb-2">Drag and drop your CSV file here, or click to browse</p>
              <input
                type="file"
                className="form-control"
                accept=".csv"
                onChange={(e) => console.log('File selected:', e.target.files[0])}
              />
            </div>

            <div className="mt-3">
              <button className="btn btn-link p-0">
                <Download className="me-2" size={16} />
                Download sample CSV template
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowBulkUploadModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
            >
              <Upload className="me-2" size={16} />
              Upload Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ------- MAIN RENDER -------
  return (
    <div className="container-fluid p-4">
      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users className="me-2" size={16} />
            Students
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <GraduationCap className="me-2" size={16} />
            Analytics
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'students' && renderStudentsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Modals */}
      {showViewModal && renderViewModal()}
      {showDeleteModal && renderDeleteModal()}
      {showBulkUploadModal && renderBulkUploadModal()}
    </div>
  );
};

export default Student;