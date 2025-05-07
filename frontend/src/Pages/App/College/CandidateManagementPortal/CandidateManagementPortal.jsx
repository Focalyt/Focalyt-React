import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  Search,
  Filter,
  Download,
  UserPlus,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CandidateManagementPortal = () => {
  const [activeTab, setActiveTab] = useState('candidates');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [viewMode, setViewMode] = useState('centers'); 
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({});

  // Sample data
  const [centers, setCenters] = useState([
    { id: 1, name: 'Delhi Center', candidates: 150, address: 'Block A, Connaught Place, Delhi', contact: '+91 9876543210' },
    { id: 2, name: 'Mumbai Center', candidates: 200, address: 'Bandra West, Mumbai', contact: '+91 9988776655' },
    { id: 3, name: 'PSD Chandauli Center', candidates: 75, address: 'Main Road, Chandauli', contact: '+91 9876123450' },
    { id: 4, name: 'Bangalore Center', candidates: 180, address: 'Electronic City, Bangalore', contact: '+91 8765432109' }
  ]);

  const [courses, setCourses] = useState([
    { id: 1, name: 'Hotel Management', duration: '6 months', students: 85, centerId: 3, description: 'Advanced hospitality training for front desk and housekeeping roles' },
    { id: 2, name: 'Data Science', duration: '4 months', students: 65, centerId: 1, description: 'Python, statistics, and machine learning fundamentals' },
    { id: 3, name: 'Retail Management', duration: '3 months', students: 45, centerId: 2, description: 'Inventory management and customer service excellence' },
    { id: 4, name: 'Hotel Management', duration: '6 months', students: 65, centerId: 1, description: 'Hospitality training with focus on restaurant management' },
    { id: 5, name: 'Data Science', duration: '4 months', students: 75, centerId: 4, description: 'Data analysis and visualization with R and Tableau' },
  ]);

  const [batches, setBatches] = useState([
    { id: 1, name: 'Batch A-2025', startDate: '2025-01-15', endDate: '2025-07-15', students: 30, status: 'active', courseId: 1 },
    { id: 2, name: 'Batch B-2025', startDate: '2025-02-01', endDate: '2025-08-01', students: 25, status: 'active', courseId: 2 },
    { id: 3, name: 'Batch C-2024', startDate: '2024-09-01', endDate: '2025-03-01', students: 35, status: 'completed', courseId: 3 },
    { id: 4, name: 'Batch D-2025', startDate: '2025-01-20', endDate: '2025-07-20', students: 28, status: 'active', courseId: 4 },
    { id: 5, name: 'Batch E-2025', startDate: '2025-02-15', endDate: '2025-06-15', students: 32, status: 'active', courseId: 5 },
  ]);

  const [candidates, setCandidates] = useState([
    {
      id: 1,
      name: 'Akash Gaurav',
      phone: '9027486847',
      email: 'akash.g@example.com',
      address: 'Chandauli, Uttar Pradesh',
      center: 'PSD Chandauli Center',
      centerId: 3,
      course: 'Hotel Management',
      courseId: 1,
      batch: 'Batch A-2025',
      batchId: 1,
      status: 'pursuing',
      enrollmentDate: '2025-01-15'
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul.s@example.com',
      address: 'Rohini, Delhi',
      center: 'Delhi Center',
      centerId: 1,
      course: 'Data Science',
      courseId: 2,
      batch: 'Batch B-2025',
      batchId: 2,
      status: 'completed',
      enrollmentDate: '2025-02-01'
    },
    {
      id: 3,
      name: 'Priya Singh',
      phone: '8765432109',
      email: 'priya.s@example.com',
      address: 'Andheri, Mumbai',
      center: 'Mumbai Center',
      centerId: 2,
      course: 'Retail Management',
      courseId: 3,
      batch: 'Batch C-2024',
      batchId: 3,
      status: 'dropout',
      enrollmentDate: '2024-09-15'
    },
    {
      id: 4,
      name: 'Vikram Patel',
      phone: '7654321098',
      email: 'vikram.p@example.com',
      address: 'Dwarka, Delhi',
      center: 'Delhi Center',
      centerId: 1,
      course: 'Hotel Management',
      courseId: 4,
      batch: 'Batch D-2025',
      batchId: 4,
      status: 'pursuing',
      enrollmentDate: '2025-01-20'
    },
    {
      id: 5,
      name: 'Sneha Gupta',
      phone: '6543210987',
      email: 'sneha.g@example.com',
      address: 'Whitefield, Bangalore',
      center: 'Bangalore Center',
      centerId: 4,
      course: 'Data Science',
      courseId: 5,
      batch: 'Batch E-2025',
      batchId: 5,
      status: 'pursuing',
      enrollmentDate: '2025-02-15'
    }
  ]);

  // Status filters with counts
  const statusFilters = [
    { value: 'all', label: 'All', count: candidates.length, color: 'status-all' },
    { value: 'pursuing', label: 'Pursuing', count: candidates.filter(c => c.status === 'pursuing').length, color: 'status-pursuing' },
    { value: 'completed', label: 'Completed', count: candidates.filter(c => c.status === 'completed').length, color: 'status-completed' },
    { value: 'dropout', label: 'Dropout', count: candidates.filter(c => c.status === 'dropout').length, color: 'status-dropout' }
  ];

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (mode) => {
    setViewMode(mode);
    if (mode === 'centers') {
      setSelectedCenter(null);
      setSelectedCourse(null);
      setSelectedBatch(null);
    } else if (mode === 'courses') {
      setSelectedCourse(null);
      setSelectedBatch(null);
    } else if (mode === 'batches') {
      setSelectedBatch(null);
    }
  };

  // Filter candidates based on selected status, center, course, batch, and search query
  const getFilteredCandidates = () => {
    return candidates
      .filter(candidate => selectedStatus === 'all' || candidate.status === selectedStatus)
      .filter(candidate => !selectedCenter || candidate.centerId === selectedCenter.id)
      .filter(candidate => !selectedCourse || candidate.courseId === selectedCourse.id)
      .filter(candidate => !selectedBatch || candidate.batchId === selectedBatch.id)
      .filter(candidate =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.phone.includes(searchQuery) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  // Get filtered courses based on selected center
  const getFilteredCourses = () => {
    if (!selectedCenter) return courses;
    return courses.filter(course => course.centerId === selectedCenter.id);
  };

  // Get filtered batches based on selected course
  const getFilteredBatches = () => {
    if (!selectedCourse) return batches;
    return batches.filter(batch => batch.courseId === selectedCourse.id);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open modal with specific type
  const openModal = (type, data = {}) => {
    setModalType(type);
    setFormData(data);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setFormData({});
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Logic based on modal type
    if (modalType === 'addCenter') {
      const newCenter = {
        id: centers.length + 1,
        name: formData.name,
        candidates: 0,
        address: formData.address,
        contact: formData.contact
      };
      setCenters([...centers, newCenter]);
      showNotification('Center added successfully!');
    } 
    else if (modalType === 'editCenter') {
      setCenters(centers.map(center => 
        center.id === formData.id ? { ...center, ...formData } : center
      ));
      showNotification('Center updated successfully!');
    }
    else if (modalType === 'addCourse') {
      const newCourse = {
        id: courses.length + 1,
        name: formData.name,
        duration: formData.duration,
        students: 0,
        centerId: selectedCenter ? selectedCenter.id : parseInt(formData.centerId),
        description: formData.description
      };
      setCourses([...courses, newCourse]);
      showNotification('Course added successfully!');
    }
    else if (modalType === 'editCourse') {
      setCourses(courses.map(course => 
        course.id === formData.id ? { ...course, ...formData } : course
      ));
      showNotification('Course updated successfully!');
    }
    else if (modalType === 'addBatch') {
      const newBatch = {
        id: batches.length + 1,
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        students: 0,
        status: 'active',
        courseId: selectedCourse ? selectedCourse.id : parseInt(formData.courseId)
      };
      setBatches([...batches, newBatch]);
      showNotification('Batch added successfully!');
    }
    else if (modalType === 'editBatch') {
      setBatches(batches.map(batch => 
        batch.id === formData.id ? { ...batch, ...formData } : batch
      ));
      showNotification('Batch updated successfully!');
    }
    else if (modalType === 'addStudent') {
      const newStudent = {
        id: candidates.length + 1,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        centerId: selectedCenter ? selectedCenter.id : parseInt(formData.centerId),
        center: selectedCenter ? selectedCenter.name : centers.find(c => c.id === parseInt(formData.centerId))?.name,
        courseId: selectedCourse ? selectedCourse.id : parseInt(formData.courseId),
        course: selectedCourse ? selectedCourse.name : courses.find(c => c.id === parseInt(formData.courseId))?.name,
        batchId: selectedBatch ? selectedBatch.id : parseInt(formData.batchId),
        batch: selectedBatch ? selectedBatch.name : batches.find(b => b.id === parseInt(formData.batchId))?.name,
        status: 'pursuing',
        enrollmentDate: formData.enrollmentDate || new Date().toISOString().split('T')[0]
      };
      setCandidates([...candidates, newStudent]);
      showNotification('Student added successfully!');
    }
    else if (modalType === 'editStudent') {
      setCandidates(candidates.map(candidate => {
        if (candidate.id === formData.id) {
          // Update center, course, and batch names if IDs changed
          const centerId = parseInt(formData.centerId) || candidate.centerId;
          const courseId = parseInt(formData.courseId) || candidate.courseId;
          const batchId = parseInt(formData.batchId) || candidate.batchId;
          
          return {
            ...candidate,
            ...formData,
            centerId,
            courseId,
            batchId,
            center: centers.find(c => c.id === centerId)?.name || candidate.center,
            course: courses.find(c => c.id === courseId)?.name || candidate.course,
            batch: batches.find(b => b.id === batchId)?.name || candidate.batch
          };
        }
        return candidate;
      }));
      showNotification('Student updated successfully!');
    }
    
    closeModal();
  };

  // Handle delete
  // const handleDelete = (type, id) => {
  //   if (confirm('Are you sure you want to delete this item?')) {
  //     if (type === 'center') {
  //       setCenters(centers.filter(center => center.id !== id));
  //       // Also remove related courses, batches and students
  //       setCourses(courses.filter(course => course.centerId !== id));
  //       setCandidates(candidates.filter(candidate => candidate.centerId !== id));
  //       showNotification('Center deleted successfully!');
  //     } 
  //     else if (type === 'course') {
  //       setCourses(courses.filter(course => course.id !== id));
  //       // Remove related batches and students
  //       setBatches(batches.filter(batch => batch.courseId !== id));
  //       setCandidates(candidates.filter(candidate => candidate.courseId !== id));
  //       showNotification('Course deleted successfully!');
  //     }
  //     else if (type === 'batch') {
  //       setBatches(batches.filter(batch => batch.id !== id));
  //       // Remove related students
  //       setCandidates(candidates.filter(candidate => candidate.batchId !== id));
  //       showNotification('Batch deleted successfully!');
  //     }
  //     else if (type === 'student') {
  //       setCandidates(candidates.filter(candidate => candidate.id !== id));
  //       showNotification('Student deleted successfully!');
  //     }
  //   }
  // };

  // Dashboard component
  const Dashboard = () => (
    <div className="dashboard">
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon students-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Students</p>
            <h3 className="stat-value">{candidates.length}</h3>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '75%' }}></div>
              </div>
              <span className="progress-text">+12% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon centers-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Centers</p>
            <h3 className="stat-value">{centers.length}</h3>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
              <span className="progress-text">+1 this quarter</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon courses-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Courses</p>
            <h3 className="stat-value">{courses.length}</h3>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '90%' }}></div>
              </div>
              <span className="progress-text">+3 new courses</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon batches-icon">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Batches</p>
            <h3 className="stat-value">{batches.filter(b => b.status === 'active').length}</h3>
            <div className="stat-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '80%' }}></div>
              </div>
              <span className="progress-text">2 starting next month</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card dashboard-chart">
          <div className="card-header">
            <h2 className="card-title">Student Enrollment</h2>
            <div className="card-actions">
              <select className="select-period">
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>All time</option>
              </select>
            </div>
          </div>
          <div className="card-content chart-container">
            <div className="chart-placeholder">
              {/* Chart placeholder */}
              <div className="mock-chart">
                <div className="chart-bar" style={{ height: '30%' }}><span>Jan</span></div>
                <div className="chart-bar" style={{ height: '45%' }}><span>Feb</span></div>
                <div className="chart-bar" style={{ height: '60%' }}><span>Mar</span></div>
                <div className="chart-bar" style={{ height: '40%' }}><span>Apr</span></div>
                <div className="chart-bar" style={{ height: '75%' }}><span>May</span></div>
                <div className="chart-bar accent" style={{ height: '85%' }}><span>Jun</span></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card dashboard-stats">
          <div className="card-header">
            <h2 className="card-title">Student Status</h2>
          </div>
          <div className="card-content">
            <div className="status-stats">
              <div className="status-item">
                <div className="status-info">
                  <span className="status-label">Pursuing</span>
                  <span className="status-value">{candidates.filter(c => c.status === 'pursuing').length}</span>
                </div>
                <div className="status-bar">
                  <div className="status-fill pursuing" style={{ width: `${candidates.filter(c => c.status === 'pursuing').length / candidates.length * 100}%` }}></div>
                </div>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span className="status-label">Completed</span>
                  <span className="status-value">{candidates.filter(c => c.status === 'completed').length}</span>
                </div>
                <div className="status-bar">
                  <div className="status-fill completed" style={{ width: `${candidates.filter(c => c.status === 'completed').length / candidates.length * 100}%` }}></div>
                </div>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span className="status-label">Dropout</span>
                  <span className="status-value">{candidates.filter(c => c.status === 'dropout').length}</span>
                </div>
                <div className="status-bar">
                  <div className="status-fill dropout" style={{ width: `${candidates.filter(c => c.status === 'dropout').length / candidates.length * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Center Overview</h2>
          <button className="btn-primary" onClick={() => openModal('addCenter')}>Add Center</button>
        </div>
        <div className="card-content">
          <div className="center-grid">
            {centers.map(center => (
              <div key={center.id} className="center-card" onClick={() => {
                setSelectedCenter(center);
                setViewMode('courses');
              }}>
                <div className="center-header">
                  <h3 className="center-name">{center.name}</h3>
                  <div className="center-actions">
                    <button className="btn-icon" onClick={(e) => {
                      e.stopPropagation();
                      openModal('editCenter', center);
                    }}>
                      <Edit size={16} />
                    </button>
                    {/* <button className="btn-icon" onClick={(e) => {
                      e.stopPropagation();
                      handleDelete('center', center.id);
                    }}>
                      <Trash2 size={16} />
                    </button> */}
                  </div>
                </div>
                <p className="center-stats">{center.candidates} Students</p>
                <p className="center-address">{center.address}</p>
                <div className="card-footer">
                  <span className="small-text">
                    {courses.filter(c => c.centerId === center.id).length} Courses
                  </span>
                  <button className="btn-text">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Centers list view
  const CentersView = () => (
    <div className="card">
      <div className="card-header">
        <div className='d-flex align-items-center gap-2'>
      <button className='btn-primary'><i className="fas fa-arrow-left"></i></button>
        <h2 className="card-title">Centers</h2>
        </div>
        <button className="btn-primary" onClick={() => openModal('addCenter')}>
          Add Center
        </button>
        
      </div>
      <div className="card-content">
        <div className="center-grid">
          {centers.map(center => (
            <div key={center.id} className="center-card hover-card" onClick={() => {
              setSelectedCenter(center);
              setViewMode('courses');
            }}>
              <div className="card-header-flex">
                <div>
                  <h3 className="center-name">{center.name}</h3>
                  <p className="center-stats">{center.candidates} Students</p>
                  <p className="center-address">{center.address}</p>
                  <p className="center-contact">{center.contact}</p>
                </div>
                <ChevronRight className="icon-chevron" size={20} />
              </div>
              <div className="card-footer">
                <span className="small-text">
                  {courses.filter(c => c.centerId === center.id).length} Courses
                </span>
                <div className="button-group">
                  <button className="btn-icon" onClick={(e) => {
                    e.stopPropagation();
                    openModal('editCenter', center);
                  }}>
                    <Edit size={16} />
                  </button>
                  {/* <button className="btn-icon" onClick={(e) => {
                    e.stopPropagation();
                    handleDelete('center', center.id);
                  }}>
                    <Trash2 size={16} />
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Courses list view
  const CoursesView = () => (
    <div className="card">
      <div className="card-header">
        <div className='d-flex align-items-center gap-2'>
        <button className="btn-primary"><i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="card-title">
          Courses {selectedCenter && `- ${selectedCenter.name}`}
        </h2>
        </div>
        <button className="btn-primary" onClick={() => openModal('addCourse')}>
          Add Course
        </button>
      </div>
      <div className="card-content">
        <div className="course-grid">
          {getFilteredCourses().map(course => (
            <div key={course.id} className="course-card hover-card" onClick={() => {
              setSelectedCourse(course);
              setViewMode('batches');
            }}>
              <div className="card-header-flex">
                <div>
                  <h3 className="course-name">{course.name}</h3>
                  <p className="course-duration">Duration: {course.duration}</p>
                  <p className="course-description">{course.description}</p>
                </div>
                <ChevronRight className="icon-chevron" size={20} />
              </div>
              <div className="card-footer">
                <span className="small-text">
                  {course.students} Students
                </span>
                <div className="button-group">
                  <button className="btn-icon" onClick={(e) => {
                    e.stopPropagation();
                    openModal('editCourse', course);
                  }}>
                    <Edit size={16} />
                  </button>
                  {/* <button className="btn-icon" onClick={(e) => {
                    e.stopPropagation();
                    handleDelete('course', course.id);
                  }}>
                    <Trash2 size={16} />
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Batches list view
  const BatchesView = () => (
    <div className="card">
      <div className="card-header">
        <div className='d-flex align-items-center gap-2'>
        <button className='btn-primary'><i className="fas fa-arrow-left"></i></button>
        <h2 className="card-title">
          Batches {selectedCourse && `- ${selectedCourse.name}`}
        </h2>
        </div>
        <button className="btn-primary" onClick={() => openModal('addBatch')}>
          Add Batch
        </button>
      </div>
      <div className="card-content">
        <div className="batch-grid">
          {getFilteredBatches().map(batch => (
            <div key={batch.id} className="batch-card hover-card" onClick={() => {
              setSelectedBatch(batch);
              setViewMode('candidates');
            }}>
              <div className="card-header-flex">
                <div>
                  <h3 className="batch-name">{batch.name}</h3>
                  <div className="badge-container">
                    <span className={`position-relative badge status-${batch.status}`}>
                      {batch.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="icon-chevron" size={20} />
              </div>
              <div className="batch-dates">
                <p className="small-text">Start: {batch.startDate}</p>
                <p className="small-text">End: {batch.endDate}</p>
              </div>
              <div className="card-footer">
                <span className="small-text">
                  {batch.students} Students
                </span>
                <div className="button-group">
                  <button className="btn-icon" onClick={(e) => {
                    e.stopPropagation();
                    openModal('editBatch', batch);
                  }}>
                    <Edit size={16} />
                  </button>
                  {/* <button className="btn-icon" onClick={(e) => {
                    e.stopPropagation();
                    handleDelete('batch', batch.id);
                  }}>
                    <Trash2 size={16} />
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Candidate list component
  const CandidateList = () => (
    <>
    <div className="card">
      {/* Header with filters */}
      <div className="card-header candidate-header">
        <div className="filters-container">
          <div className="status-filters">
            <h2 className="candidate-title">Students</h2>
            <div className="filter-buttons">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`btn-filter ${filter.color} ${selectedStatus === filter.value ? 'active' : ''}`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
          <div className="search-actions">
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search students by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
                          <button className="btn-icon">
                <Download size={18} />
              </button>
              <button className="btn-primary" onClick={() => openModal('addStudent')}>
                <UserPlus size={18} className="icon-left" />
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* // Breadcrumb navigation */}
       {(selectedCenter || selectedCourse || selectedBatch) && (
        <div className="breadcrumb">
          <span className="breadcrumb-item clickable" onClick={() => handleBreadcrumbClick('centers')}>
            Centers
          </span>
        </div>
      )}

      
      <div className="card-content">
        <div className="candidate-table">
          <div className="table-header">
            <div className="table-cell">Student</div>
            <div className="table-cell">Contact</div>
            <div className="table-cell">Center</div>
            <div className="table-cell">Course</div>
            <div className="table-cell">Batch</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Enrollment Date</div>
            <div className="table-cell">Actions</div>
          </div>
          {getFilteredCandidates().length > 0 ? (
            getFilteredCandidates().map(candidate => (
              <div className="table-row" key={candidate.id}>
                <div className="table-cell">
                  <div className="student-info">
                    <div className="student-avatar">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="student-name">{candidate.name}</div>
                      <div className="student-address">{candidate.address}</div>
                    </div>
                  </div>
                </div>
                <div className="table-cell">
                  <div>{candidate.phone}</div>
                  <div className="student-email">{candidate.email}</div>
                </div>
                <div className="table-cell">{candidate.center}</div>
                <div className="table-cell">{candidate.course}</div>
                <div className="table-cell">{candidate.batch}</div>
                <div className="table-cell">
                  <span className={`position-relative badge status-${candidate.status}`}>{candidate.status}</span>
                </div>
                <div className="table-cell">{candidate.enrollmentDate}</div>
                <div className="table-cell">
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openModal('viewStudent', candidate)}>
                      <Eye size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => openModal('editStudent', candidate)}>
                      <Edit size={16} />
                    </button>
                    {/* <button className="btn-icon" onClick={() => handleDelete('student', candidate.id)}>
                      <Trash2 size={16} />
                    </button> */}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Users size={48} />
              </div>
              <h3>No students found</h3>
              <p>Try adjusting your filters or add a new student</p>
              <button className="btn-primary" onClick={() => openModal('addStudent')}>
                <UserPlus size={18} className="icon-left" />
                Add Student
              </button>
            </div>
          )}
        </div>
      </div>
      </>
  );

  // Form Modal Component
  const FormModal = () => {
    // Determine form fields based on modal type
    let formFields = [];
    let modalTitle = '';

    if (modalType === 'addCenter' || modalType === 'editCenter') {
      modalTitle = modalType === 'addCenter' ? 'Add New Center' : 'Edit Center';
      formFields = [
        { name: 'name', label: 'Center Name', type: 'text', placeholder: 'Enter center name', required: true },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter center address', required: true },
        { name: 'contact', label: 'Contact Number', type: 'text', placeholder: 'Enter contact number', required: true }
      ];
    }
    else if (modalType === 'addCourse' || modalType === 'editCourse') {
      modalTitle = modalType === 'addCourse' ? 'Add New Course' : 'Edit Course';
      formFields = [
        { name: 'name', label: 'Course Name', type: 'text', placeholder: 'Enter course name', required: true },
        { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 6 months', required: true },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter course description', required: true }
      ];

      // Add center selection if not in a specific center context
      if (!selectedCenter) {
        formFields.push({
          name: 'centerId',
          label: 'Center',
          type: 'select',
          options: centers.map(center => ({ value: center.id, label: center.name })),
          required: true
        });
      }
    }
    else if (modalType === 'addBatch' || modalType === 'editBatch') {
      modalTitle = modalType === 'addBatch' ? 'Add New Batch' : 'Edit Batch';
      formFields = [
        { name: 'name', label: 'Batch Name', type: 'text', placeholder: 'Enter batch name', required: true },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'upcoming', label: 'Upcoming' }
        ], required: true }
      ];

      // Add course selection if not in a specific course context
      if (!selectedCourse) {
        formFields.push({
          name: 'courseId',
          label: 'Course',
          type: 'select',
          options: courses.map(course => ({ value: course.id, label: course.name })),
          required: true
        });
      }
    }
    else if (modalType === 'addStudent' || modalType === 'editStudent') {
      modalTitle = modalType === 'addStudent' ? 'Add New Student' : 'Edit Student';
      formFields = [
        { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter full name', required: true },
        { name: 'phone', label: 'Phone Number', type: 'text', placeholder: 'Enter phone number', required: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address', required: true },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter address', required: true },
        { name: 'enrollmentDate', label: 'Enrollment Date', type: 'date', required: true }
      ];

      // Add center, course, batch selections if not in specific contexts
      if (!selectedCenter) {
        formFields.push({
          name: 'centerId',
          label: 'Center',
          type: 'select',
          options: centers.map(center => ({ value: center.id, label: center.name })),
          required: true
        });
      }

      if (!selectedCourse) {
        formFields.push({
          name: 'courseId',
          label: 'Course',
          type: 'select',
          options: selectedCenter 
            ? courses.filter(course => course.centerId === selectedCenter.id).map(course => ({ value: course.id, label: course.name }))
            : courses.map(course => ({ value: course.id, label: course.name })),
          required: true
        });
      }

      if (!selectedBatch) {
        formFields.push({
          name: 'batchId',
          label: 'Batch',
          type: 'select',
          options: selectedCourse 
            ? batches.filter(batch => batch.courseId === selectedCourse.id).map(batch => ({ value: batch.id, label: batch.name }))
            : batches.map(batch => ({ value: batch.id, label: batch.name })),
          required: true
        });
      }

      if (modalType === 'editStudent') {
        formFields.push({
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'pursuing', label: 'Pursuing' },
            { value: 'completed', label: 'Completed' },
            { value: 'dropout', label: 'Dropout' }
          ],
          required: true
        });
      }
    }
    else if (modalType === 'viewStudent') {
      modalTitle = 'Student Details';
      // This is just a view mode, no form fields needed
    }

    return (
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">{modalTitle}</h3>
            <button className="btn-close" onClick={closeModal}>
              <X size={20} />
            </button>
          </div>
          
          {modalType === 'viewStudent' ? (
            <div className="modal-body">
              <div className="student-profile">
                <div className="student-profile-header">
                  <div className="student-avatar large">
                    {formData.name?.charAt(0)}
                  </div>
                  <div className="student-profile-info">
                    <h2 className="student-profile-name">{formData.name}</h2>
                    <div className="student-profile-detail">
                      <span className={`position-relative badge status-${formData.status}`}>{formData.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="student-details">
                  <div className="detail-section">
                    <h4 className="detail-heading">Contact Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Phone</div>
                        <div className="detail-value">{formData.phone}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{formData.email}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Address</div>
                        <div className="detail-value">{formData.address}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4 className="detail-heading">Education Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Center</div>
                        <div className="detail-value">{formData.center}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Course</div>
                        <div className="detail-value">{formData.course}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Batch</div>
                        <div className="detail-value">{formData.batch}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Enrolled On</div>
                        <div className="detail-value">{formData.enrollmentDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={closeModal}>Close</button>
                  <button className="btn-primary" onClick={() => {
                    closeModal();
                    openModal('editStudent', formData);
                  }}>Edit Student</button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formFields.map(field => (
                  <div className="form-group" key={field.name}>
                    <label htmlFor={field.name} className="form-label">{field.label}</label>
                    
                    {field.type === 'select' ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleFormChange}
                        className="form-select"
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleFormChange}
                        placeholder={field.placeholder}
                        className="form-textarea"
                        required={field.required}
                      ></textarea>
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleFormChange}
                        placeholder={field.placeholder}
                        className="form-input"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {modalType.startsWith('add') ? 'Add' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Main content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return <Dashboard />;
      case 'centers':
        return <CentersView />;
      case 'courses':
        return <CoursesView />;
      case 'batches':
        return <BatchesView />;
      case 'candidates':
        return <CandidateList />;
      default:
        return <Dashboard />;
    }
  };

  // Notification component
  const Notification = () => {
    if (!notification) return null;

    return (
      <div className={`notification notification-${notification.type}`}>
        {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span>{notification.message}</span>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="app-title">Our Students</h1>
            
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="main-nav">
        <div className="container">
          <div className="nav-tabs">
            <button
              onClick={() => {
                setActiveTab('overview');
                setViewMode('dashboard');
              }}
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('candidates');
                setViewMode('centers');
              }}
              className={`nav-link ${activeTab === 'candidates' ? 'active' : ''}`}
            >
              Details
            </button>
            
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {renderContent()}
        </div>
      </main>

      {/* Modal */}
      {showModal && <FormModal />}

      {/* Notification */}
      <Notification />

      <style jsx>{`
        /* Reset and Base Styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        body {
          background-color: #f5f7fa;
          color: #333;
          line-height: 1.6;
        }
        
        button {
          cursor: pointer;
          font-family: inherit;
        }
        
        /* App Container */
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        /* Header Styles */
        .header {
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          padding: 15px 0;
   
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .app-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }
        
        .user-profile {
          display: flex;
          align-items: center;
        }
        
        .btn-profile {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          padding: 0;
        }
        
       
        
        /* Navigation Styles */
        .main-nav {
          background-color: #fff;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }
        
        .nav-tabs {
          display: flex;
          gap: 20px;
        }
        
        .nav-link {
          background: none;
          border: none;
          padding: 15px 0;
          font-size: 1rem;
          color: #64748b;
          position: relative;
          transition: color 0.3s;
        }
        
        .nav-link:hover {
          color: #3b82f6;
        }
        
        .nav-link.active {
          color: #3b82f6;
          font-weight: 500;
        }
        
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #3b82f6;
        }
        
        /* Main Content */
        .main-content {
          flex: 1;
          padding: 20px 0 40px;
        }
        
        /* Card Styles */
        .card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }
        
        .card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }
        
        .card-content {
          padding: 20px;
        }
        
        /* Button Styles */
        .btn-primary {
          background-color: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }
        
        .btn-primary:hover {
          background-color: #2563eb;
        }
        
        .btn-secondary {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-secondary:hover {
          background-color: #e5e7eb;
        }
        
        .btn-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background-color: #fff;
          color: #64748b;
          transition: all 0.2s;
        }
        
        .btn-icon:hover {
          background-color: #f3f4f6;
          color: #3b82f6;
        }
        
        .btn-text {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0;
          transition: color 0.2s;
        }
        
        .btn-text:hover {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .icon-left {
          margin-right: 4px;
        }

        .btn-close {
          background: none;
          border: none;
          padding: 4px;
          color: #64748b;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-close:hover {
          background-color: #f3f4f6;
        }
        
        /* Dashboard Styles */
        .dashboard {
          margin-bottom: 30px;
        }
        
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 20px;
          display: flex;
          align-items: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }
        
        .students-icon {
          background-color: rgba(124, 58, 237, 0.1);
          color: #7c3aed;
        }
        
        .centers-icon {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .courses-icon {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .batches-icon {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .stat-info {
          flex: 1;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 8px 0;
        }
        
        .stat-progress {
          margin-top: 8px;
        }
        
        .progress-bar {
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #3b82f6;
          border-radius: 2px;
        }
        
        .progress-text {
          font-size: 0.75rem;
          color: #10b981;
        }
        
        /* Dashboard Layout */
        .dashboard-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .dashboard-chart {
          height: 300px;
        }
        
        .dashboard-stats {
          height: 300px;
        }
        
        .chart-container {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chart-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 20px;
        }
        
        .mock-chart {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        
        .chart-bar {
          width: 40px;
          background-color: #e5e7eb;
          border-radius: 4px 4px 0 0;
          position: relative;
          transition: height 0.3s;
        }
        
        .chart-bar.accent {
          background-color: #3b82f6;
        }
        
        .chart-bar span {
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .chart-bar:hover {
          opacity: 0.8;
        }
        
        /* Status Stats */
        .status-stats {
          padding: 10px 0;
        }
        
        .status-item {
          margin-bottom: 20px;
        }
        
        .status-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .status-label {
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .status-value {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .status-bar {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .status-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }
        
        .status-fill.pursuing {
          background-color: #3b82f6;
        }
        
        .status-fill.completed {
          background-color: #10b981;
        }
        
        .status-fill.dropout {
          background-color: #ef4444;
        }
        
        /* Grid Layouts */
        .center-grid,
        .course-grid,
        .batch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .center-card,
        .course-card,
        .batch-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.3s;
        }
        
        .hover-card {
          cursor: pointer;
        }
        
        .hover-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        
        .center-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .center-name,
        .course-name,
        .batch-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
        }
        
        .center-stats,
        .course-duration {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 6px;
        }
        
        .center-address,
        .center-contact,
        .course-description {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        
        .icon-chevron {
          color: #94a3b8;
          margin-top: 4px;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        
        .small-text {
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .batch-dates {
          margin: 10px 0;
        }
        
        .center-actions {
          display: flex;
          gap: 8px;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
        }
        
        /* Badge Styles */
        .badge-container {
          margin-top: 5px;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .status-all {
          background-color: #f3f4f6;
          color: #4b5563;
        }
        
        .status-pursuing {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .status-completed {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-dropout {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .status-active {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-upcoming {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        /* Filters and Search Styles */
        .filters-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .status-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
        }
        
        .candidate-title {
          margin: 0;
        }
        
        .filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .btn-filter {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          border: 1px solid transparent;
          background-color: transparent;
          transition: all 0.2s;
        }
        
        .btn-filter.active {
          font-weight: 600;
          border-color: currentColor;
        }
        
        .search-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        
        .search-container {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        
        
        
        .candidate-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }
        
        /* Select styling */
        .select-period {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #4b5563;
          background-color: #fff;
        }
        
        /* Breadcrumb Styles */
        .breadcrumb {
          padding: 0 20px 12px;
          font-size: 0.875rem;
          color: #64748b;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .breadcrumb-item {
          color: #64748b;
        }
        
        .breadcrumb-item.clickable {
          color: #3b82f6;
          cursor: pointer;
        }
        
        .breadcrumb-item.clickable:hover {
          text-decoration: underline;
        }
        
        .breadcrumb-separator {
          margin: 0 8px;
          color: #94a3b8;
        }
        
        /* Table Styles */
        .candidate-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .table-header {
          background-color: #f8fafc;
          font-weight: 600;
          color: #334155;
          font-size: 0.875rem;
          text-align: left;
          display: flex;
        }
        
        .table-row {
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          transition: background-color 0.2s;
        }
        
        .table-row:hover {
          background-color: #f8fafc;
        }
        
        .table-cell {
          padding: 12px 16px;
          font-size: 0.875rem;
          color: #1e293b;
          flex: 1;
          min-width: 120px;
          display: flex;
          align-items: center;
        }
        
        .student-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .student-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #3b82f6;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .student-avatar.large {
          width: 64px;
          height: 64px;
          font-size: 24px;
        }
        
        .student-name {
          font-weight: 500;
          color: #1e293b;
        }
        
        .student-address,
        .student-email {
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        /* Empty state */
        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #64748b;
        }
        
        .empty-icon {
          margin: 0 auto 20px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        
        .empty-state h3 {
          margin-bottom: 8px;
          color: #334155;
        }
        
        .empty-state p {
          margin-bottom: 20px;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
        }
        
        .modal-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        .modal-content {
          background-color: #fff;
          border-radius: 8px;
          width: 95%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: scale(0.9);
          transition: transform 0.3s;
        }
        
        .modal-overlay.active .modal-content {
          transform: scale(1);
        }
        
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        /* Form Styles */
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
        }
        
        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #1e293b;
          transition: border-color 0.2s;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #3b82f6;
          outline: none;
        }
        
        /* Student Profile */
        .student-profile {
          width: 100%;
        }
        
        .student-profile-header {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .student-profile-info {
          flex: 1;
        }
        
        .student-profile-name {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        
        .student-profile-detail {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .detail-section {
          margin-bottom: 24px;
        }
        
        .detail-heading {
          font-size: 1rem;
          font-weight: 600;
          color: #334155;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .detail-item {
          margin-bottom: 8px;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .detail-value {
          font-size: 0.875rem;
          color: #1e293b;
          font-weight: 500;
        }
        
        /* Notification */
        .notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 16px;
          background-color: #fff;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
          animation: slide-in 0.3s ease-out;
        }
        
        .notification-success {
          border-left: 4px solid #10b981;
        }
        
        .notification-error {
          border-left: 4px solid #ef4444;
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .stats-container,
          .dashboard-row {
            grid-template-columns: 1fr;
          }
          
          .center-grid,
          .course-grid,
          .batch-grid {
            grid-template-columns: 1fr;
          }
          
          .table-header,
          .table-row {
            display: block;
          }
          
          .table-cell {
            display: flex;
            justify-content: space-between;
            padding: 8px 16px;
          }
          
          .table-cell:before {
            content: attr(data-label);
            font-weight: 600;
          }
          
          .search-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-container {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidateManagementPortal;