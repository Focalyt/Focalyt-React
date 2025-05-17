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
  AlertCircle,
  ArrowLeft,
  Briefcase
} from 'lucide-react';

const CandidateManagementPortal = () => {
  // Tab state variables for each section
  const [verticalActiveTab, setVerticalActiveTab] = useState('active');
  const [projectActiveTab, setProjectActiveTab] = useState('active');
  const [centerActiveTab, setCenterActiveTab] = useState('active');
  const [courseActiveTab, setCourseActiveTab] = useState('active');
  const [batchActiveTab, setBatchActiveTab] = useState('active');

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  // Start with verticals view as the initial view
  const [viewMode, setViewMode] = useState('verticals');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({});
  // Add navigation history to track where user came from
  const [navigationHistory, setNavigationHistory] = useState([]);

  // Sample data for verticals
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [verticals, setVerticals] = useState([
    { id: 1, name: 'FFTL', description: 'Focalyt Future Technology LAbs', projects: 1, status: 'active' },
    { id: 2, name: 'GSE', description: 'Guest Service Associates', projects: 1, status: 'active' },
    { id: 3, name: 'Amber', description: 'Initiatives for rural area development', projects: 0, status: 'inactive' }
  ]);

  // Sample data with verticalId and status
  const [projects, setProjects] = useState([
    { id: 1, name: 'PMKVY 2023', description: 'Pradhan Mantri Kaushal Vikas Yojana', status: 'active', centers: 3, verticalId: 1 },
    { id: 2, name: 'DDU-GKY', description: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana', status: 'active', centers: 1, verticalId: 2 },
    { id: 3, name: 'NULM', description: 'National Urban Livelihood Mission', status: 'inactive', centers: 0, verticalId: 1 }
  ]);

  const [centers, setCenters] = useState([
    { id: 1, name: 'Delhi Center', candidates: 150, address: 'Block A, Connaught Place, Delhi', contact: '+91 9876543210', projectId: 1, status: 'active' },
    { id: 2, name: 'Mumbai Center', candidates: 200, address: 'Bandra West, Mumbai', contact: '+91 9988776655', projectId: 1, status: 'active' },
    { id: 3, name: 'PSD Chandauli Center', candidates: 75, address: 'Main Road, Chandauli', contact: '+91 9876123450', projectId: 1, status: 'active' },
    { id: 4, name: 'Bangalore Center', candidates: 180, address: 'Electronic City, Bangalore', contact: '+91 8765432109', projectId: 2, status: 'inactive' }
  ]);

  const [courses, setCourses] = useState([
    { id: 1, name: 'Hotel Management', duration: '6 months', students: 85, centerId: 3, description: 'Advanced hospitality training for front desk and housekeeping roles', status: 'active' },
    { id: 2, name: 'Data Science', duration: '4 months', students: 65, centerId: 1, description: 'Python, statistics, and machine learning fundamentals', status: 'active' },
    { id: 3, name: 'Retail Management', duration: '3 months', students: 45, centerId: 2, description: 'Inventory management and customer service excellence', status: 'active' },
    { id: 4, name: 'Hotel Management', duration: '6 months', students: 65, centerId: 1, description: 'Hospitality training with focus on restaurant management', status: 'inactive' },
    { id: 5, name: 'Data Science', duration: '4 months', students: 75, centerId: 4, description: 'Data analysis and visualization with R and Tableau', status: 'inactive' },
  ]);

  const [batches, setBatches] = useState([
    { id: 1, name: 'Batch A-2025', startDate: '2025-01-15', endDate: '2025-07-15', students: 30, status: 'active', courseId: 1 },
    { id: 2, name: 'Batch B-2025', startDate: '2025-02-01', endDate: '2025-08-01', students: 25, status: 'active', courseId: 2 },
    { id: 3, name: 'Batch C-2024', startDate: '2024-09-01', endDate: '2025-03-01', students: 35, status: 'completed', courseId: 3 },
    { id: 4, name: 'Batch D-2025', startDate: '2025-01-20', endDate: '2025-07-20', students: 28, status: 'inactive', courseId: 4 },
    { id: 5, name: 'Batch E-2025', startDate: '2025-02-15', endDate: '2025-06-15', students: 32, status: 'inactive', courseId: 5 },
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
    { value: 'all', label: 'All', count: candidates.length, color: 'light' },
    { value: 'pursuing', label: 'Pursuing', count: candidates.filter(c => c.status === 'pursuing').length, color: 'primary' },
    { value: 'completed', label: 'Completed', count: candidates.filter(c => c.status === 'completed').length, color: 'success' },
    { value: 'dropout', label: 'Dropout', count: candidates.filter(c => c.status === 'dropout').length, color: 'danger' }
  ];

  // Navigation function to move to next view with history tracking
  const navigateTo = (mode, selectedItem = null) => {
    // Save current state to history
    setNavigationHistory([...navigationHistory, { 
      viewMode, 
      selectedVertical,
      selectedProject, 
      selectedCenter, 
      selectedCourse, 
      selectedBatch 
    }]);
    
    // Set new view mode
    setViewMode(mode);
    
    // Set selected item based on the view we're navigating to
    if (mode === 'projects') {
      setSelectedVertical(selectedItem);
      setSelectedProject(null);
      setSelectedCenter(null);
      setSelectedCourse(null);
      setSelectedBatch(null);
    } else if (mode === 'centers') {
      setSelectedProject(selectedItem);
      setSelectedCenter(null);
      setSelectedCourse(null);
      setSelectedBatch(null);
    } else if (mode === 'courses') {
      setSelectedCenter(selectedItem);
      setSelectedCourse(null);
      setSelectedBatch(null);
    } else if (mode === 'batches') {
      setSelectedCourse(selectedItem);
      setSelectedBatch(null);
    } else if (mode === 'candidates') {
      setSelectedBatch(selectedItem);
    }
  };

  // Go back to previous view based on history
  const goBack = () => {
    if (navigationHistory.length > 0) {
      // Get the last state from history
      const prevState = navigationHistory[navigationHistory.length - 1];
      
      // Restore previous state
      setViewMode(prevState.viewMode);
      setSelectedVertical(prevState.selectedVertical);
      setSelectedProject(prevState.selectedProject);
      setSelectedCenter(prevState.selectedCenter);
      setSelectedCourse(prevState.selectedCourse);
      setSelectedBatch(prevState.selectedBatch);
      
      // Remove the last state from history
      setNavigationHistory(navigationHistory.slice(0, -1));
    } else {
      // If no history, default to verticals view
      setViewMode('verticals');
      setSelectedVertical(null);
      setSelectedProject(null);
      setSelectedCenter(null);
      setSelectedCourse(null);
      setSelectedBatch(null);
    }
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (mode) => {
     if (mode === 'verticals') {
      // Reset all selections and navigation
      setNavigationHistory([]);
      setViewMode('verticals');
      setSelectedVertical(null);
      setSelectedProject(null);
      setSelectedCenter(null);
      setSelectedCourse(null);
      setSelectedBatch(null);
    }
    else if (mode === 'projects') {
      // Reset to projects view but keep the vertical
      setNavigationHistory([]);
      setViewMode('projects');
      setSelectedProject(null);
      setSelectedCenter(null);
      setSelectedCourse(null);
      setSelectedBatch(null);
    } else if (mode === 'centers') {
      // Reset to centers view but keep the project
      navigateTo('centers', selectedProject);
    } else if (mode === 'courses') {
      // Reset to courses view but keep the project and center
      navigateTo('courses', selectedCenter);
    } else if (mode === 'batches') {
      // Reset to batches view but keep the project, center, and course
      navigateTo('batches', selectedCourse);
    }
  };

  // Get filtered verticals based on active tab
  const getFilteredVerticals = () => {
    return verticals.filter(vertical => 
      verticalActiveTab === 'all' ? true : vertical.status === verticalActiveTab
    );
  };

  // Get filtered projects based on selected vertical and active tab
  const getFilteredProjects = () => {
    let filtered = projects;
    
    if (selectedVertical) {
      filtered = filtered.filter(project => project.verticalId === selectedVertical.id);
    }
    
    return filtered.filter(project => 
      projectActiveTab === 'all' ? true : project.status === projectActiveTab
    );
  };

  // Get filtered centers based on selected project and active tab
  const getFilteredCenters = () => {
    let filtered = centers;
    
    if (selectedProject) {
      filtered = filtered.filter(center => center.projectId === selectedProject.id);
    }
    
    return filtered.filter(center => 
      centerActiveTab === 'all' ? true : center.status === centerActiveTab
    );
  };

  // Get filtered courses based on selected center and active tab
  const getFilteredCourses = () => {
    let filtered = courses;
    
    if (selectedCenter) {
      filtered = filtered.filter(course => course.centerId === selectedCenter.id);
    }
    
    return filtered.filter(course => 
      courseActiveTab === 'all' ? true : course.status === courseActiveTab
    );
  };

  // Get filtered batches based on selected course and active tab
  const getFilteredBatches = () => {
    let filtered = batches;
    
    if (selectedCourse) {
      filtered = filtered.filter(batch => batch.courseId === selectedCourse.id);
    }
    
    return filtered.filter(batch => 
      batchActiveTab === 'all' ? true : batch.status === batchActiveTab
    );
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

  // Handle form input changes
  const handleFormChange = (e) => {
    e.stopPropagation(); // Stop event propagation
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
    e.stopPropagation();
    
    // Logic based on modal type
    if (modalType === 'addVertical') {
      const newVertical = {
        id: verticals.length + 1,
        name: formData.name,
        description: formData.description,
        projects: 0,
        status: formData.status || 'active'
      };
      setVerticals([...verticals, newVertical]);
      showNotification('Vertical added successfully!');
    }
    else if (modalType === 'editVertical') {
      setVerticals(verticals.map(vertical => 
        vertical.id === formData.id ? { ...vertical, ...formData } : vertical
      ));
      showNotification('Vertical updated successfully!');
    }
    else if (modalType === 'addProject') {
      const newProject = {
        id: projects.length + 1,
        name: formData.name,
        description: formData.description,
        status: formData.status || 'active',
        centers: 0,
        verticalId: selectedVertical ? selectedVertical.id : parseInt(formData.verticalId)
      };
      setProjects([...projects, newProject]);
      
      // Update vertical's project count
      if (selectedVertical) {
        setVerticals(verticals.map(vertical =>
          vertical.id === selectedVertical.id ? { ...vertical, projects: vertical.projects + 1 } : vertical
        ));
      }
      
      showNotification('Project added successfully!');
    }
    else if (modalType === 'editProject') {
      setProjects(projects.map(project => 
        project.id === formData.id ? { ...project, ...formData } : project
      ));
      showNotification('Project updated successfully!');
    }
    else if (modalType === 'addCenter') {
      const newCenter = {
        id: centers.length + 1,
        name: formData.name,
        candidates: 0,
        address: formData.address,
        contact: formData.contact,
        status: formData.status || 'active',
        projectId: selectedProject ? selectedProject.id : parseInt(formData.projectId)
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
        status: formData.status || 'active',
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
        status: formData.status || 'active',
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

  // Tab component for all sections
  const TabsComponent = ({ activeTab, setActiveTab, tabs }) => (
    <div className="mb-3 border-bottom">
      <ul className="nav nav-tabs border-0">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.value}>
            <button
              onClick={() => setActiveTab(tab.value)}
              className={`nav-link ${activeTab === tab.value ? 'active text-primary fw-medium border-primary border-top-0 border-start-0 border-end-0 border-3 rounded-0' : 'text-muted'}`}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Verticals list view
  const VerticalsView = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-4">
          <div className="d-flex align-items-center">
            <h5 className="mb-0">Verticals</h5>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addVertical')}>
            Add Vertical
          </button>
        </div>
        
        <TabsComponent 
          activeTab={verticalActiveTab}
          setActiveTab={setVerticalActiveTab}
          tabs={[
            { value: 'active', label: 'Active Verticals' },
            { value: 'inactive', label: 'Inactive Verticals' },
            { value: 'all', label: 'All Verticals' }
          ]}
        />
      </div>
      <div className="card-body">
        <div className="row">
          {getFilteredVerticals().map(vertical => (
            <div key={vertical.id} className="col-md-4 mb-3">
              <div className="card h-100 cursor-pointer border-hover" onClick={() => navigateTo('projects', vertical)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-2">{vertical.name}</h5>
                      <p className="text-muted small mb-3">{vertical.description}</p>
                      <span className={`text-white bg-${vertical.status === 'active' ? 'success' : 'secondary'} mb-3`}>
                        {vertical.status}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="text-muted small">
                      {projects.filter(p => p.verticalId === vertical.id).length} Projects
                    </span>
                    <div>
                      <button className="btn btn-sm btn-light me-1" onClick={(e) => {
                        e.stopPropagation();
                        openModal('editVertical', vertical);
                      }}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {getFilteredVerticals().length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No verticals found. Try changing the filter or add a new vertical.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Dashboard component
  const Dashboard = () => (
    <div className="dashboard">
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex">
              <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                <Users size={24} className="text-primary" />
              </div>
              <div>
                <h6 className="text-muted small mb-1">Total Students</h6>
                <h3 className="fw-bold mb-2">{candidates.length}</h3>
                <div className="progress mb-1" style={{ height: "6px" }}>
                  <div className="progress-bar" style={{ width: '75%' }}></div>
                </div>
                <span className="text-success small">+12% from last month</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex">
              <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                <Building2 size={24} className="text-info" />
              </div>
              <div>
                <h6 className="text-muted small mb-1">Centers</h6>
                <h3 className="fw-bold mb-2">{centers.length}</h3>
                <div className="progress mb-1" style={{ height: "6px" }}>
                  <div className="progress-bar bg-info" style={{ width: '60%' }}></div>
                </div>
                <span className="text-success small">+1 this quarter</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex">
              <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                <BookOpen size={24} className="text-warning" />
              </div>
              <div>
                <h6 className="text-muted small mb-1">Courses</h6>
                <h3 className="fw-bold mb-2">{courses.length}</h3>
                <div className="progress mb-1" style={{ height: "6px" }}>
                  <div className="progress-bar bg-warning" style={{ width: '90%' }}></div>
                </div>
                <span className="text-success small">+3 new courses</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex">
              <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                <GraduationCap size={24} className="text-success" />
              </div>
              <div>
                <h6 className="text-muted small mb-1">Active Batches</h6>
                <h3 className="fw-bold mb-2">{batches.filter(b => b.status === 'active').length}</h3>
                <div className="progress mb-1" style={{ height: "6px" }}>
                  <div className="progress-bar bg-success" style={{ width: '80%' }}></div>
                </div>
                <span className="text-success small">2 starting next month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verticals Overview */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Verticals Overview</h5>
          <button className="btn btn-primary btn-sm" onClick={() => setViewMode('verticals')}>
            View All Verticals
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            {verticals.filter(vertical => vertical.status === 'active').map(vertical => (
              <div key={vertical.id} className="col-md-4 mb-3">
                <div className="card h-100 cursor-pointer" onClick={() => navigateTo('projects', vertical)}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <h5 className="card-title">{vertical.name}</h5>
                      <div>
                        <button className="btn btn-sm btn-light me-1" onClick={(e) => {
                          e.stopPropagation();
                          openModal('editVertical', vertical);
                        }}>
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-muted small mb-3">{vertical.description}</p>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">
                        {projects.filter(p => p.verticalId === vertical.id).length} Projects
                      </span>
                      <span className="text-primary small fw-medium">View Details</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Projects Overview</h5>
          <button className="btn btn-primary btn-sm" onClick={() => navigateTo('projects')}>
            View All Projects
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            {projects.filter(project => project.status === 'active').map(project => (
              <div key={project.id} className="col-md-4 mb-3">
                <div className="card h-100 cursor-pointer" onClick={() => navigateTo('centers', project)}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <h5 className="card-title">{project.name}</h5>
                      <div>
                        <button className="btn btn-sm btn-light me-1" onClick={(e) => {
                          e.stopPropagation();
                          openModal('editProject', project);
                        }}>
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-muted small mb-3">{project.description}</p>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">
                        {centers.filter(c => c.projectId === project.id).length} Centers
                      </span>
                      <span className="text-primary small fw-medium">View Details</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Projects list view
  const ProjectsView = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-4">
          <div className="d-flex align-items-center">
            {selectedVertical && (
              <button className="btn btn-primary btn-sm me-2" onClick={goBack}>
                <ArrowLeft size={16} />
              </button>
            )}
            <h5 className="mb-0">
              Projects {selectedVertical && `- ${selectedVertical.name}`}
            </h5>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addProject')}>
            Add Project
          </button>
        </div>
        
        <TabsComponent 
          activeTab={projectActiveTab}
          setActiveTab={setProjectActiveTab}
          tabs={[
            { value: 'active', label: 'Active Projects' },
            { value: 'inactive', label: 'Inactive Projects' },
            { value: 'all', label: 'All Projects' }
          ]}
        />
      </div>
      <div className="card-body">
        <div className="row">
          {getFilteredProjects().map(project => (
            <div key={project.id} className="col-md-4 mb-3">
              <div className="card h-100 cursor-pointer border-hover" onClick={() => navigateTo('centers', project)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-2">{project.name}</h5>
                      <p className="text-muted small mb-3">{project.description}</p>
                      <span className={`text-white bg-${project.status === 'active' ? 'success' : 'secondary'} mb-3`}>
                        {project.status}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="text-muted small">
                      {centers.filter(c => c.projectId === project.id).length} Centers
                    </span>
                    <div>
                      <button className="btn btn-sm btn-light me-1" onClick={(e) => {
                        e.stopPropagation();
                        openModal('editProject', project);
                      }}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {getFilteredProjects().length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No projects found. Try changing the filter or add a new project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Centers list view
  const CentersView = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-4">
          <div className="d-flex align-items-center">
            <button className="btn btn-primary btn-sm me-2" onClick={goBack}>
              <ArrowLeft size={16} />
            </button>
            <h5 className="mb-0">
              Centers {selectedProject && `- ${selectedProject.name}`}
            </h5>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addCenter')}>
            Add Center
          </button>
        </div>
        
        <TabsComponent 
          activeTab={centerActiveTab}
          setActiveTab={setCenterActiveTab}
          tabs={[
            { value: 'active', label: 'Active Centers' },
            { value: 'inactive', label: 'Inactive Centers' },
            { value: 'all', label: 'All Centers' }
          ]}
        />
      </div>
      <div className="card-body">
        <div className="row">
          {getFilteredCenters().map(center => (
            <div key={center.id} className="col-md-3 mb-3">
              <div className="card h-100 cursor-pointer border-hover" onClick={() => navigateTo('courses', center)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-2">{center.name}</h5>
                      <p className="text-primary mb-1">{center.candidates} Students</p>
                      <p className="text-muted small mb-1">{center.address}</p>
                      <p className="text-muted small mb-3">{center.contact}</p>
                      <span className={`text-white bg-${center.status === 'active' ? 'success' : 'secondary'} mb-3`}>
                        {center.status}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="text-muted small">
                      {courses.filter(c => c.centerId === center.id).length} Courses
                    </span>
                    <div>
                      <button className="btn btn-sm btn-light me-1" onClick={(e) => {
                        e.stopPropagation();
                        openModal('editCenter', center);
                      }}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {getFilteredCenters().length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No centers found. Try changing the filter or add a new center.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Courses list view
  const CoursesView = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-4">
          <div className="d-flex align-items-center">
            <button className="btn btn-primary btn-sm me-2" onClick={goBack}>
              <ArrowLeft size={16} />
            </button>
            <h5 className="mb-0">
              Courses {selectedCenter && `- ${selectedCenter.name}`}
            </h5>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addCourse')}>
            Add Course
          </button>
        </div>
        
        <TabsComponent 
          activeTab={courseActiveTab}
          setActiveTab={setCourseActiveTab}
          tabs={[
            { value: 'active', label: 'Active Courses' },
            { value: 'inactive', label: 'Inactive Courses' },
            { value: 'all', label: 'All Courses' }
          ]}
        />
      </div>
      <div className="card-body">
        <div className="row">
          {getFilteredCourses().map(course => (
            <div key={course.id} className="col-md-4 mb-3">
              <div className="card h-100 cursor-pointer border-hover" onClick={() => navigateTo('batches', course)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-2">{course.name}</h5>
                      <p className="text-muted small mb-1">Duration: {course.duration}</p>
                      <p className="text-muted small mb-3">{course.description}</p>
                      <span className={`text-white bg-${course.status === 'active' ? 'success' : 'secondary'} mb-3`}>
                        {course.status}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="text-muted small">
                      {course.students} Students
                    </span>
                    <div>
                      <button className="btn btn-sm btn-light" onClick={(e) => {
                        e.stopPropagation();
                        openModal('editCourse', course);
                      }}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {getFilteredCourses().length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No courses found. Try changing the filter or add a new course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Batches list view
  const BatchesView = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-4">
          <div className="d-flex align-items-center">
            <button className="btn btn-primary btn-sm me-2" onClick={goBack}>
              <ArrowLeft size={16} />
            </button>
            <h5 className="mb-0">
              Batches {selectedCourse && `- ${selectedCourse.name}`}
            </h5>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addBatch')}>
            Add Batch
          </button>
        </div>
        
        <TabsComponent 
          activeTab={batchActiveTab}
          setActiveTab={setBatchActiveTab}
          tabs={[
            { value: 'active', label: 'Active Batches' },
            { value: 'inactive', label: 'Inactive Batches' },
            { value: 'completed', label: 'Completed Batches' },
            { value: 'all', label: 'All Batches' }
          ]}
        />
      </div>
      <div className="card-body">
        <div className="row">
          {getFilteredBatches().map(batch => (
            <div key={batch.id} className="col-md-4 mb-3">
              <div className="card h-100 cursor-pointer border-hover" onClick={() => navigateTo('candidates', batch)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-2">{batch.name}</h5>
                      <span className={`text-white bg-${batch.status === 'active' ? 'success' : batch.status === 'completed' ? 'secondary' : 'warning'}`}>
                        {batch.status}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-muted" />
                  </div>
                  <div className="mb-3">
                    <p className="text-muted small mb-1">Start: {batch.startDate}</p>
                    <p className="text-muted small mb-1">End: {batch.endDate}</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="text-muted small">
                      {batch.students} Students
                    </span>
                    <div>
                      <button className="btn btn-sm btn-light" onClick={(e) => {
                        e.stopPropagation();
                        openModal('editBatch', batch);
                      }}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {getFilteredBatches().length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No batches found. Try changing the filter or add a new batch.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Candidate list component
  const CandidateList = () => (
    <>
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white p-3">
          <div className="mb-3 d-flex align-items-center">
            <button className="btn btn-primary btn-sm me-2" onClick={goBack}>
              <ArrowLeft size={16} />
            </button>
            <h5 className="mb-0">
              Students {selectedBatch && `- ${selectedBatch.name}`}
            </h5>
          </div>
          <div className="mb-3">
            <div className="btn-group ">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`btn btn-${filter.color} btn-sm ${selectedStatus === filter.value ? 'active' : ''}`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div className="d-flex mb-2 mb-md-0">
              <div className="input-group">
                <span className="input-group-text bg-white" style={{height: '40px'}}>
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Search students by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control m-0"
                />
              </div>
            </div>
            <div className="d-flex">
              <button className="btn btn-light me-2">
                <Download size={18} />
              </button>
             
            </div>
          </div>
        </div>

        {/* Breadcrumb navigation */}
        <nav aria-label="breadcrumb" className="px-3 pt-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <a href="#" onClick={() => handleBreadcrumbClick('verticals')}>Verticals</a>
            </li>
            {selectedVertical && (
              <li className="breadcrumb-item">
                <a href="#" onClick={() => handleBreadcrumbClick('projects')}>{selectedVertical.name}</a>
              </li>
            )}
            {selectedProject && (
              <li className="breadcrumb-item">
                <a href="#" onClick={() => handleBreadcrumbClick('centers')}>{selectedProject.name}</a>
              </li>
            )}
            {selectedCenter && (
              <li className="breadcrumb-item">
                <a href="#" onClick={() => handleBreadcrumbClick('courses')}>{selectedCenter.name}</a>
              </li>
            )}
            {selectedCourse && (
              <li className="breadcrumb-item">
                <a href="#" onClick={() => handleBreadcrumbClick('batches')}>{selectedCourse.name}</a>
              </li>
            )}
            {selectedBatch && (
              <li className="breadcrumb-item active">{selectedBatch.name}</li>
            )}
          </ol>
        </nav>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Center</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Enrollment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredCandidates().length > 0 ? (
                  getFilteredCandidates().map(candidate => (
                    <tr key={candidate.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="student-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "36px", height: "36px" }}>
                            {candidate.name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-medium">{candidate.name}</div>
                            <div className="text-muted small">{candidate.address}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{candidate.phone}</div>
                        <div className="text-muted small">{candidate.email}</div>
                      </td>
                      <td>{candidate.center}</td>
                      <td>{candidate.course}</td>
                      <td>{candidate.batch}</td>
                      <td>
                        <span className={`text-white bg-${candidate.status === 'pursuing' ? 'primary' : candidate.status === 'completed' ? 'success' : 'danger'}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td>{candidate.enrollmentDate}</td>
                      <td>
                        <div className="d-flex">
                          <button className="btn btn-sm btn-light me-1" onClick={() => openModal('viewStudent', candidate)}>
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-sm btn-light me-1" onClick={() => openModal('editStudent', candidate)}>
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div className="py-4">
                        <div className="mb-3">
                          <div className="bg-light d-inline-flex p-3 rounded-circle">
                            <Users size={48} className="text-muted" />
                          </div>
                        </div>
                        <h5>No students found</h5>
                        <p className="text-muted">Try adjusting your filters or add a new student</p>
                        
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  // Form Modal Component
  const FormModal = () => {
    // Determine form fields based on modal type
    let formFields = [];
    let modalTitle = '';

    if (modalType === 'addVertical' || modalType === 'editVertical') {
      modalTitle = modalType === 'addVertical' ? 'Add New Vertical' : 'Edit Vertical';
      formFields = [
        { name: 'name', label: 'Vertical Name', type: 'text', placeholder: 'Enter vertical name', required: true },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter vertical description', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ], required: true }
      ];
    }
    else if (modalType === 'addProject' || modalType === 'editProject') {
      modalTitle = modalType === 'addProject' ? 'Add New Project' : 'Edit Project';
      formFields = [
        { name: 'name', label: 'Project Name', type: 'text', placeholder: 'Enter project name', required: true },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter project description', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ], required: true }
      ];
      
      // Add vertical selection if not in a specific vertical context
      if (!selectedVertical) {
        formFields.push({
          name: 'verticalId',
          label: 'Vertical',
          type: 'select',
          options: verticals.map(vertical => ({ value: vertical.id, label: vertical.name })),
          required: true
        });
      }
    }
    else if (modalType === 'addCenter' || modalType === 'editCenter') {
      modalTitle = modalType === 'addCenter' ? 'Add New Center' : 'Edit Center';
      formFields = [
        { name: 'name', label: 'Center Name', type: 'text', placeholder: 'Enter center name', required: true },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter center address', required: true },
        { name: 'contact', label: 'Contact Number', type: 'text', placeholder: 'Enter contact number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ], required: true }
      ];

      // Add project selection if not in a specific project context
      if (!selectedProject) {
        formFields.push({
          name: 'projectId',
          label: 'Project',
          type: 'select',
          options: projects.map(project => ({ value: project.id, label: project.name })),
          required: true
        });
      }
    }
    else if (modalType === 'addCourse' || modalType === 'editCourse') {
      modalTitle = modalType === 'addCourse' ? 'Add New Course' : 'Edit Course';
      formFields = [
        { name: 'name', label: 'Course Name', type: 'text', placeholder: 'Enter course name', required: true },
        { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 6 months', required: true },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter course description', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ], required: true }
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
          { value: 'inactive', label: 'Inactive' },
          { value: 'completed', label: 'Completed' }
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

    // Modal event handlers to prevent form input focus issues
    const handleModalClick = (e) => {
      e.stopPropagation();
    };

    const handleInputClick = (e) => {
      e.stopPropagation();
    };

    return (
      <div className={`modal ${showModal ? 'd-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
        <div className="modal-dialog modal-dialog-centered" onClick={handleModalClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalTitle}</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            
            {modalType === 'viewStudent' ? (
              <div className="modal-body">
                <div className="text-center mb-3">
                  <div className="student-avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "64px", height: "64px" }}>
                    {formData.name?.charAt(0)}
                  </div>
                  <h4 className="mb-1">{formData.name}</h4>
                  <span className={`text-white bg-${formData.status === 'pursuing' ? 'primary' : formData.status === 'completed' ? 'success' : 'danger'}`}>
                    {formData.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h6 className="border-bottom pb-2 mb-3">Contact Information</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="small text-muted">Phone</div>
                      <div>{formData.phone}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Email</div>
                      <div>{formData.email}</div>
                    </div>
                    <div className="col-12">
                      <div className="small text-muted">Address</div>
                      <div>{formData.address}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h6 className="border-bottom pb-2 mb-3">Education Information</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="small text-muted">Center</div>
                      <div>{formData.center}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Course</div>
                      <div>{formData.course}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Batch</div>
                      <div>{formData.batch}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Enrolled On</div>
                      <div>{formData.enrollmentDate}</div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
                  <button type="button" className="btn btn-primary" onClick={(e) => {
                    e.stopPropagation();
                    closeModal();
                    openModal('editStudent', formData);
                  }}>Edit Student</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formFields.map(field => (
                    <div className="mb-3" key={field.name}>
                      <label htmlFor={field.name} className="form-label">{field.label}</label>
                      
                      {field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleFormChange}
                          onClick={handleInputClick}
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
                          onClick={handleInputClick}
                          placeholder={field.placeholder}
                          className="form-control"
                          rows="3"
                          required={field.required}
                        ></textarea>
                      ) : (
                        <input
                          type={field.type}
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleFormChange}
                          onClick={handleInputClick}
                          placeholder={field.placeholder}
                          className="form-control"
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {modalType.startsWith('add') ? 'Add' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'verticals':
        return <VerticalsView />;
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectsView />;
      case 'centers':
        return <CentersView />;
      case 'courses':
        return <CoursesView />;
      case 'batches':
        return <BatchesView />;
      case 'candidates':
        return <CandidateList />;
      default:
        return <VerticalsView />;
    }
  };

  // Notification component
  const Notification = () => {
    if (!notification) return null;

    return (
      <div className={`position-fixed bottom-0 end-0 p-3`} style={{ zIndex: 1050 }}>
        <div className={`toast show bg-white`}>
          <div className="toast-header bg-white">
            {notification.type === 'success' ? 
              <CheckCircle size={18} className="text-success me-2" /> : 
              <AlertCircle size={18} className="text-danger me-2" />}
            <strong className="me-auto">{notification.type === 'success' ? 'Success' : 'Error'}</strong>
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
          <div className="toast-body">
            {notification.message}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app bg-light min-vh-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container py-3">
          <h1 className="h3 mb-0 fw-bold">Our Students</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-bottom mb-4">
        <div className="container">
          <ul className="nav nav-tabs border-0">
            <li className="nav-item">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setViewMode('dashboard');
                }}
                className={`nav-link ${activeTab === 'overview' ? 'active text-primary fw-medium border-primary border-top-0 border-start-0 border-end-0 border-3 rounded-0' : 'text-muted'}`}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => {
                  setActiveTab('details');
                  setViewMode('verticals');
                  setSelectedVertical(null);
                  setSelectedProject(null);
                  setSelectedCenter(null);
                  setSelectedCourse(null);
                  setSelectedBatch(null);
                  setNavigationHistory([]);
                }}
                className={`nav-link ${activeTab === 'details' ? 'active text-primary fw-medium border-primary border-top-0 border-start-0 border-end-0 border-3 rounded-0' : 'text-muted'}`}
              >
                Details
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-5">
        <div className="container">
          {renderContent()}
        </div>
      </main>

      {/* Modal */}
      {showModal && <FormModal />}

      {/* Notification */}
      <Notification />

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        
        .border-hover:hover {
          border-color: #0d6efd !important;
          box-shadow: 0 0.125rem 0.25rem rgba(13, 110, 253, 0.1) !important;
        }

        .student-avatar {
          font-weight: 500;
        }
        
        /* Custom tab styling */
        .nav-tabs {
          border-bottom: none;
        }
        
        .nav-tabs .nav-link {
          border: none;
          padding: 0.5rem 1rem;
          margin-right: 1rem;
          color: #6c757d;
          font-weight: 500;
          transition: all 0.2s ease-in-out;
        }
        
        .nav-tabs .nav-link:hover {
          color: #0d6efd;
          background-color: transparent;
        }
        
        .nav-tabs .nav-link.active {
          color: #0d6efd;
          background-color: transparent;
          border-bottom: 3px solid #0d6efd;
          font-weight: 600;
        }
        
        /* Modal form styling */
        .modal-dialog {
          max-width: 500px;
        }
        
        .form-control:focus,
        .form-select:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        /* Make sure the font styles are consistent */
        .form-control, 
        .form-select {
          font-size: 0.875rem;
        }
        
        /* Improve input focus visibility */
        .form-control:focus,
        .form-select:focus,
        .form-check-input:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        /* Ensure consistent button styling */
        .btn {
          font-weight: 500;
        }
        
        /* Responsive fixes for mobile */
        @media (max-width: 768px) {
          .nav-tabs .nav-link {
            margin-right: 0.5rem;
            padding: 0.5rem 0.5rem;
          }
          
          .card-header {
            padding: 1rem;
          }
          
          .modal-dialog {
            margin: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidateManagementPortal;




// import React, { useState, useEffect } from 'react';
// import {
//   Users,
//   BookOpen,
//   Building2,
//   Calendar,
//   GraduationCap,
//   Search,
//   Filter,
//   Download,
//   UserPlus,
//   ChevronRight,
//   Edit,
//   Trash2,
//   Eye,
//   X,
//   CheckCircle,
//   AlertCircle
// } from 'lucide-react';

// const CandidateManagementPortal = () => {
//   const [activeTab, setActiveTab] = useState('candidates');
//   const [selectedStatus, setSelectedStatus] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCenter, setSelectedCenter] = useState(null);
//   const [selectedCourse, setSelectedCourse] = useState(null);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [viewMode, setViewMode] = useState('centers'); 
//   const [showModal, setShowModal] = useState(false);
//   const [modalType, setModalType] = useState('');
//   const [notification, setNotification] = useState(null);
//   const [formData, setFormData] = useState({});

//   // Sample data
//   const [centers, setCenters] = useState([
//     { id: 1, name: 'Delhi Center', candidates: 150, address: 'Block A, Connaught Place, Delhi', contact: '+91 9876543210' },
//     { id: 2, name: 'Mumbai Center', candidates: 200, address: 'Bandra West, Mumbai', contact: '+91 9988776655' },
//     { id: 3, name: 'PSD Chandauli Center', candidates: 75, address: 'Main Road, Chandauli', contact: '+91 9876123450' },
//     { id: 4, name: 'Bangalore Center', candidates: 180, address: 'Electronic City, Bangalore', contact: '+91 8765432109' }
//   ]);

//   const [courses, setCourses] = useState([
//     { id: 1, name: 'Hotel Management', duration: '6 months', students: 85, centerId: 3, description: 'Advanced hospitality training for front desk and housekeeping roles' },
//     { id: 2, name: 'Data Science', duration: '4 months', students: 65, centerId: 1, description: 'Python, statistics, and machine learning fundamentals' },
//     { id: 3, name: 'Retail Management', duration: '3 months', students: 45, centerId: 2, description: 'Inventory management and customer service excellence' },
//     { id: 4, name: 'Hotel Management', duration: '6 months', students: 65, centerId: 1, description: 'Hospitality training with focus on restaurant management' },
//     { id: 5, name: 'Data Science', duration: '4 months', students: 75, centerId: 4, description: 'Data analysis and visualization with R and Tableau' },
//   ]);

//   const [batches, setBatches] = useState([
//     { id: 1, name: 'Batch A-2025', startDate: '2025-01-15', endDate: '2025-07-15', students: 30, status: 'active', courseId: 1 },
//     { id: 2, name: 'Batch B-2025', startDate: '2025-02-01', endDate: '2025-08-01', students: 25, status: 'active', courseId: 2 },
//     { id: 3, name: 'Batch C-2024', startDate: '2024-09-01', endDate: '2025-03-01', students: 35, status: 'completed', courseId: 3 },
//     { id: 4, name: 'Batch D-2025', startDate: '2025-01-20', endDate: '2025-07-20', students: 28, status: 'active', courseId: 4 },
//     { id: 5, name: 'Batch E-2025', startDate: '2025-02-15', endDate: '2025-06-15', students: 32, status: 'active', courseId: 5 },
//   ]);

//   const [candidates, setCandidates] = useState([
//     {
//       id: 1,
//       name: 'Akash Gaurav',
//       phone: '9027486847',
//       email: 'akash.g@example.com',
//       address: 'Chandauli, Uttar Pradesh',
//       center: 'PSD Chandauli Center',
//       centerId: 3,
//       course: 'Hotel Management',
//       courseId: 1,
//       batch: 'Batch A-2025',
//       batchId: 1,
//       status: 'pursuing',
//       enrollmentDate: '2025-01-15'
//     },
//     {
//       id: 2,
//       name: 'Rahul Sharma',
//       phone: '9876543210',
//       email: 'rahul.s@example.com',
//       address: 'Rohini, Delhi',
//       center: 'Delhi Center',
//       centerId: 1,
//       course: 'Data Science',
//       courseId: 2,
//       batch: 'Batch B-2025',
//       batchId: 2,
//       status: 'completed',
//       enrollmentDate: '2025-02-01'
//     },
//     {
//       id: 3,
//       name: 'Priya Singh',
//       phone: '8765432109',
//       email: 'priya.s@example.com',
//       address: 'Andheri, Mumbai',
//       center: 'Mumbai Center',
//       centerId: 2,
//       course: 'Retail Management',
//       courseId: 3,
//       batch: 'Batch C-2024',
//       batchId: 3,
//       status: 'dropout',
//       enrollmentDate: '2024-09-15'
//     },
//     {
//       id: 4,
//       name: 'Vikram Patel',
//       phone: '7654321098',
//       email: 'vikram.p@example.com',
//       address: 'Dwarka, Delhi',
//       center: 'Delhi Center',
//       centerId: 1,
//       course: 'Hotel Management',
//       courseId: 4,
//       batch: 'Batch D-2025',
//       batchId: 4,
//       status: 'pursuing',
//       enrollmentDate: '2025-01-20'
//     },
//     {
//       id: 5,
//       name: 'Sneha Gupta',
//       phone: '6543210987',
//       email: 'sneha.g@example.com',
//       address: 'Whitefield, Bangalore',
//       center: 'Bangalore Center',
//       centerId: 4,
//       course: 'Data Science',
//       courseId: 5,
//       batch: 'Batch E-2025',
//       batchId: 5,
//       status: 'pursuing',
//       enrollmentDate: '2025-02-15'
//     }
//   ]);

//   // Status filters with counts
//   const statusFilters = [
//     { value: 'all', label: 'All', count: candidates.length, color: 'status-all' },
//     { value: 'pursuing', label: 'Pursuing', count: candidates.filter(c => c.status === 'pursuing').length, color: 'status-pursuing' },
//     { value: 'completed', label: 'Completed', count: candidates.filter(c => c.status === 'completed').length, color: 'status-completed' },
//     { value: 'dropout', label: 'Dropout', count: candidates.filter(c => c.status === 'dropout').length, color: 'status-dropout' }
//   ];

//   // Handle breadcrumb navigation
//   const handleBreadcrumbClick = (mode) => {
//     setViewMode(mode);
//     if (mode === 'centers') {
//       setSelectedCenter(null);
//       setSelectedCourse(null);
//       setSelectedBatch(null);
//     } else if (mode === 'courses') {
//       setSelectedCourse(null);
//       setSelectedBatch(null);
//     } else if (mode === 'batches') {
//       setSelectedBatch(null);
//     }
//   };

//   // Filter candidates based on selected status, center, course, batch, and search query
//   const getFilteredCandidates = () => {
//     return candidates
//       .filter(candidate => selectedStatus === 'all' || candidate.status === selectedStatus)
//       .filter(candidate => !selectedCenter || candidate.centerId === selectedCenter.id)
//       .filter(candidate => !selectedCourse || candidate.courseId === selectedCourse.id)
//       .filter(candidate => !selectedBatch || candidate.batchId === selectedBatch.id)
//       .filter(candidate =>
//         candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         candidate.phone.includes(searchQuery) ||
//         candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//   };

//   // Get filtered courses based on selected center
//   const getFilteredCourses = () => {
//     if (!selectedCenter) return courses;
//     return courses.filter(course => course.centerId === selectedCenter.id);
//   };

//   // Get filtered batches based on selected course
//   const getFilteredBatches = () => {
//     if (!selectedCourse) return batches;
//     return batches.filter(batch => batch.courseId === selectedCourse.id);
//   };

//   // Handle form input changes
//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
//   };

//   // Open modal with specific type
//   const openModal = (type, data = {}) => {
//     setModalType(type);
//     setFormData(data);
//     setShowModal(true);
//   };

//   // Close modal
//   const closeModal = () => {
//     setShowModal(false);
//     setFormData({});
//   };

//   // Show notification
//   const showNotification = (message, type = 'success') => {
//     setNotification({ message, type });
//     setTimeout(() => {
//       setNotification(null);
//     }, 3000);
//   };

//   // Handle form submission
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // Logic based on modal type
//     if (modalType === 'addCenter') {
//       const newCenter = {
//         id: centers.length + 1,
//         name: formData.name,
//         candidates: 0,
//         address: formData.address,
//         contact: formData.contact
//       };
//       setCenters([...centers, newCenter]);
//       showNotification('Center added successfully!');
//     } 
//     else if (modalType === 'editCenter') {
//       setCenters(centers.map(center => 
//         center.id === formData.id ? { ...center, ...formData } : center
//       ));
//       showNotification('Center updated successfully!');
//     }
//     else if (modalType === 'addCourse') {
//       const newCourse = {
//         id: courses.length + 1,
//         name: formData.name,
//         duration: formData.duration,
//         students: 0,
//         centerId: selectedCenter ? selectedCenter.id : parseInt(formData.centerId),
//         description: formData.description
//       };
//       setCourses([...courses, newCourse]);
//       showNotification('Course added successfully!');
//     }
//     else if (modalType === 'editCourse') {
//       setCourses(courses.map(course => 
//         course.id === formData.id ? { ...course, ...formData } : course
//       ));
//       showNotification('Course updated successfully!');
//     }
//     else if (modalType === 'addBatch') {
//       const newBatch = {
//         id: batches.length + 1,
//         name: formData.name,
//         startDate: formData.startDate,
//         endDate: formData.endDate,
//         students: 0,
//         status: 'active',
//         courseId: selectedCourse ? selectedCourse.id : parseInt(formData.courseId)
//       };
//       setBatches([...batches, newBatch]);
//       showNotification('Batch added successfully!');
//     }
//     else if (modalType === 'editBatch') {
//       setBatches(batches.map(batch => 
//         batch.id === formData.id ? { ...batch, ...formData } : batch
//       ));
//       showNotification('Batch updated successfully!');
//     }
//     else if (modalType === 'addStudent') {
//       const newStudent = {
//         id: candidates.length + 1,
//         name: formData.name,
//         phone: formData.phone,
//         email: formData.email,
//         address: formData.address,
//         centerId: selectedCenter ? selectedCenter.id : parseInt(formData.centerId),
//         center: selectedCenter ? selectedCenter.name : centers.find(c => c.id === parseInt(formData.centerId))?.name,
//         courseId: selectedCourse ? selectedCourse.id : parseInt(formData.courseId),
//         course: selectedCourse ? selectedCourse.name : courses.find(c => c.id === parseInt(formData.courseId))?.name,
//         batchId: selectedBatch ? selectedBatch.id : parseInt(formData.batchId),
//         batch: selectedBatch ? selectedBatch.name : batches.find(b => b.id === parseInt(formData.batchId))?.name,
//         status: 'pursuing',
//         enrollmentDate: formData.enrollmentDate || new Date().toISOString().split('T')[0]
//       };
//       setCandidates([...candidates, newStudent]);
//       showNotification('Student added successfully!');
//     }
//     else if (modalType === 'editStudent') {
//       setCandidates(candidates.map(candidate => {
//         if (candidate.id === formData.id) {
//           // Update center, course, and batch names if IDs changed
//           const centerId = parseInt(formData.centerId) || candidate.centerId;
//           const courseId = parseInt(formData.courseId) || candidate.courseId;
//           const batchId = parseInt(formData.batchId) || candidate.batchId;
          
//           return {
//             ...candidate,
//             ...formData,
//             centerId,
//             courseId,
//             batchId,
//             center: centers.find(c => c.id === centerId)?.name || candidate.center,
//             course: courses.find(c => c.id === courseId)?.name || candidate.course,
//             batch: batches.find(b => b.id === batchId)?.name || candidate.batch
//           };
//         }
//         return candidate;
//       }));
//       showNotification('Student updated successfully!');
//     }
    
//     closeModal();
//   };

//   // Handle delete
//   // const handleDelete = (type, id) => {
//   //   if (confirm('Are you sure you want to delete this item?')) {
//   //     if (type === 'center') {
//   //       setCenters(centers.filter(center => center.id !== id));
//   //       // Also remove related courses, batches and students
//   //       setCourses(courses.filter(course => course.centerId !== id));
//   //       setCandidates(candidates.filter(candidate => candidate.centerId !== id));
//   //       showNotification('Center deleted successfully!');
//   //     } 
//   //     else if (type === 'course') {
//   //       setCourses(courses.filter(course => course.id !== id));
//   //       // Remove related batches and students
//   //       setBatches(batches.filter(batch => batch.courseId !== id));
//   //       setCandidates(candidates.filter(candidate => candidate.courseId !== id));
//   //       showNotification('Course deleted successfully!');
//   //     }
//   //     else if (type === 'batch') {
//   //       setBatches(batches.filter(batch => batch.id !== id));
//   //       // Remove related students
//   //       setCandidates(candidates.filter(candidate => candidate.batchId !== id));
//   //       showNotification('Batch deleted successfully!');
//   //     }
//   //     else if (type === 'student') {
//   //       setCandidates(candidates.filter(candidate => candidate.id !== id));
//   //       showNotification('Student deleted successfully!');
//   //     }
//   //   }
//   // };

//   // Dashboard component
//   const Dashboard = () => (
//     <div className="dashboard">
//       <div className="stats-container">
//         <div className="stat-card">
//           <div className="stat-icon students-icon">
//             <Users size={24} />
//           </div>
//           <div className="stat-info">
//             <p className="stat-label">Total Students</p>
//             <h3 className="stat-value">{candidates.length}</h3>
//             <div className="stat-progress">
//               <div className="progress-bar">
//                 <div className="progress-fill" style={{ width: '75%' }}></div>
//               </div>
//               <span className="progress-text">+12% from last month</span>
//             </div>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon centers-icon">
//             <Building2 size={24} />
//           </div>
//           <div className="stat-info">
//             <p className="stat-label">Centers</p>
//             <h3 className="stat-value">{centers.length}</h3>
//             <div className="stat-progress">
//               <div className="progress-bar">
//                 <div className="progress-fill" style={{ width: '60%' }}></div>
//               </div>
//               <span className="progress-text">+1 this quarter</span>
//             </div>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon courses-icon">
//             <BookOpen size={24} />
//           </div>
//           <div className="stat-info">
//             <p className="stat-label">Courses</p>
//             <h3 className="stat-value">{courses.length}</h3>
//             <div className="stat-progress">
//               <div className="progress-bar">
//                 <div className="progress-fill" style={{ width: '90%' }}></div>
//               </div>
//               <span className="progress-text">+3 new courses</span>
//             </div>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon batches-icon">
//             <GraduationCap size={24} />
//           </div>
//           <div className="stat-info">
//             <p className="stat-label">Active Batches</p>
//             <h3 className="stat-value">{batches.filter(b => b.status === 'active').length}</h3>
//             <div className="stat-progress">
//               <div className="progress-bar">
//                 <div className="progress-fill" style={{ width: '80%' }}></div>
//               </div>
//               <span className="progress-text">2 starting next month</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="dashboard-row">
//         <div className="card dashboard-chart">
//           <div className="card-header">
//             <h2 className="card-title">Student Enrollment</h2>
//             <div className="card-actions">
//               <select className="select-period">
//                 <option>Last 6 months</option>
//                 <option>Last year</option>
//                 <option>All time</option>
//               </select>
//             </div>
//           </div>
//           <div className="card-content chart-container">
//             <div className="chart-placeholder">
//               {/* Chart placeholder */}
//               <div className="mock-chart">
//                 <div className="chart-bar" style={{ height: '30%' }}><span>Jan</span></div>
//                 <div className="chart-bar" style={{ height: '45%' }}><span>Feb</span></div>
//                 <div className="chart-bar" style={{ height: '60%' }}><span>Mar</span></div>
//                 <div className="chart-bar" style={{ height: '40%' }}><span>Apr</span></div>
//                 <div className="chart-bar" style={{ height: '75%' }}><span>May</span></div>
//                 <div className="chart-bar accent" style={{ height: '85%' }}><span>Jun</span></div>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <div className="card dashboard-stats">
//           <div className="card-header">
//             <h2 className="card-title">Student Status</h2>
//           </div>
//           <div className="card-content">
//             <div className="status-stats">
//               <div className="status-item">
//                 <div className="status-info">
//                   <span className="status-label">Pursuing</span>
//                   <span className="status-value">{candidates.filter(c => c.status === 'pursuing').length}</span>
//                 </div>
//                 <div className="status-bar">
//                   <div className="status-fill pursuing" style={{ width: `${candidates.filter(c => c.status === 'pursuing').length / candidates.length * 100}%` }}></div>
//                 </div>
//               </div>
//               <div className="status-item">
//                 <div className="status-info">
//                   <span className="status-label">Completed</span>
//                   <span className="status-value">{candidates.filter(c => c.status === 'completed').length}</span>
//                 </div>
//                 <div className="status-bar">
//                   <div className="status-fill completed" style={{ width: `${candidates.filter(c => c.status === 'completed').length / candidates.length * 100}%` }}></div>
//                 </div>
//               </div>
//               <div className="status-item">
//                 <div className="status-info">
//                   <span className="status-label">Dropout</span>
//                   <span className="status-value">{candidates.filter(c => c.status === 'dropout').length}</span>
//                 </div>
//                 <div className="status-bar">
//                   <div className="status-fill dropout" style={{ width: `${candidates.filter(c => c.status === 'dropout').length / candidates.length * 100}%` }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="card">
//         <div className="card-header">
//           <h2 className="card-title">Center Overview</h2>
//           <button className="btn-primary" onClick={() => openModal('addCenter')}>Add Center</button>
//         </div>
//         <div className="card-content">
//           <div className="center-grid">
//             {centers.map(center => (
//               <div key={center.id} className="center-card" onClick={() => {
//                 setSelectedCenter(center);
//                 setViewMode('courses');
//               }}>
//                 <div className="center-header">
//                   <h3 className="center-name">{center.name}</h3>
//                   <div className="center-actions">
//                     <button className="btn-icon" onClick={(e) => {
//                       e.stopPropagation();
//                       openModal('editCenter', center);
//                     }}>
//                       <Edit size={16} />
//                     </button>
//                     {/* <button className="btn-icon" onClick={(e) => {
//                       e.stopPropagation();
//                       handleDelete('center', center.id);
//                     }}>
//                       <Trash2 size={16} />
//                     </button> */}
//                   </div>
//                 </div>
//                 <p className="center-stats">{center.candidates} Students</p>
//                 <p className="center-address">{center.address}</p>
//                 <div className="card-footer">
//                   <span className="small-text">
//                     {courses.filter(c => c.centerId === center.id).length} Courses
//                   </span>
//                   <button className="btn-text">View Details</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   // Centers list view
//   const CentersView = () => (
//     <div className="card">
//       <div className="card-header">
//         <div className='d-flex align-items-center gap-2'>
//       <button className='btn-primary'><i className="fas fa-arrow-left"></i></button>
//         <h2 className="card-title">Centers</h2>
//         </div>
//         <button className="btn-primary" onClick={() => openModal('addCenter')}>
//           Add Center
//         </button>
        
//       </div>
//       <div className="card-content">
//         <div className="center-grid">
//           {centers.map(center => (
//             <div key={center.id} className="center-card hover-card" onClick={() => {
//               setSelectedCenter(center);
//               setViewMode('courses');
//             }}>
//               <div className="card-header-flex">
//                 <div>
//                   <h3 className="center-name">{center.name}</h3>
//                   <p className="center-stats">{center.candidates} Students</p>
//                   <p className="center-address">{center.address}</p>
//                   <p className="center-contact">{center.contact}</p>
//                 </div>
//                 <ChevronRight className="icon-chevron" size={20} />
//               </div>
//               <div className="card-footer">
//                 <span className="small-text">
//                   {courses.filter(c => c.centerId === center.id).length} Courses
//                 </span>
//                 <div className="button-group">
//                   <button className="btn-icon" onClick={(e) => {
//                     e.stopPropagation();
//                     openModal('editCenter', center);
//                   }}>
//                     <Edit size={16} />
//                   </button>
//                   {/* <button className="btn-icon" onClick={(e) => {
//                     e.stopPropagation();
//                     handleDelete('center', center.id);
//                   }}>
//                     <Trash2 size={16} />
//                   </button> */}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   // Courses list view
//   const CoursesView = () => (
//     <div className="card">
//       <div className="card-header">
//         <div className='d-flex align-items-center gap-2'>
//         <button className="btn-primary"><i className="fas fa-arrow-left"></i>
//         </button>
//         <h2 className="card-title">
//           Courses {selectedCenter && `- ${selectedCenter.name}`}
//         </h2>
//         </div>
//         <button className="btn-primary" onClick={() => openModal('addCourse')}>
//           Add Course
//         </button>
//       </div>
//       <div className="card-content">
//         <div className="course-grid">
//           {getFilteredCourses().map(course => (
//             <div key={course.id} className="course-card hover-card" onClick={() => {
//               setSelectedCourse(course);
//               setViewMode('batches');
//             }}>
//               <div className="card-header-flex">
//                 <div>
//                   <h3 className="course-name">{course.name}</h3>
//                   <p className="course-duration">Duration: {course.duration}</p>
//                   <p className="course-description">{course.description}</p>
//                 </div>
//                 <ChevronRight className="icon-chevron" size={20} />
//               </div>
//               <div className="card-footer">
//                 <span className="small-text">
//                   {course.students} Students
//                 </span>
//                 <div className="button-group">
//                   <button className="btn-icon" onClick={(e) => {
//                     e.stopPropagation();
//                     openModal('editCourse', course);
//                   }}>
//                     <Edit size={16} />
//                   </button>
//                   {/* <button className="btn-icon" onClick={(e) => {
//                     e.stopPropagation();
//                     handleDelete('course', course.id);
//                   }}>
//                     <Trash2 size={16} />
//                   </button> */}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   // Batches list view
//   const BatchesView = () => (
//     <div className="card">
//       <div className="card-header">
//         <div className='d-flex align-items-center gap-2'>
//         <button className='btn-primary'><i className="fas fa-arrow-left"></i></button>
//         <h2 className="card-title">
//           Batches {selectedCourse && `- ${selectedCourse.name}`}
//         </h2>
//         </div>
//         <button className="btn-primary" onClick={() => openModal('addBatch')}>
//           Add Batch
//         </button>
//       </div>
//       <div className="card-content">
//         <div className="batch-grid">
//           {getFilteredBatches().map(batch => (
//             <div key={batch.id} className="batch-card hover-card" onClick={() => {
//               setSelectedBatch(batch);
//               setViewMode('candidates');
//             }}>
//               <div className="card-header-flex">
//                 <div>
//                   <h3 className="batch-name">{batch.name}</h3>
//                   <div className="badge-container">
//                     <span className={`position-relative badge status-${batch.status}`}>
//                       {batch.status}
//                     </span>
//                   </div>
//                 </div>
//                 <ChevronRight className="icon-chevron" size={20} />
//               </div>
//               <div className="batch-dates">
//                 <p className="small-text">Start: {batch.startDate}</p>
//                 <p className="small-text">End: {batch.endDate}</p>
//               </div>
//               <div className="card-footer">
//                 <span className="small-text">
//                   {batch.students} Students
//                 </span>
//                 <div className="button-group">
//                   <button className="btn-icon" onClick={(e) => {
//                     e.stopPropagation();
//                     openModal('editBatch', batch);
//                   }}>
//                     <Edit size={16} />
//                   </button>
//                   {/* <button className="btn-icon" onClick={(e) => {
//                     e.stopPropagation();
//                     handleDelete('batch', batch.id);
//                   }}>
//                     <Trash2 size={16} />
//                   </button> */}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   // Candidate list component
//   const CandidateList = () => (
//     <>
//     <div className="card">
//       {/* Header with filters */}
//       <div className="card-header candidate-header">
//         <div className="filters-container">
//           <div className="status-filters">
//             <h2 className="candidate-title">Students</h2>
//             <div className="filter-buttons">
//               {statusFilters.map(filter => (
//                 <button
//                   key={filter.value}
//                   onClick={() => setSelectedStatus(filter.value)}
//                   className={`btn-filter ${filter.color} ${selectedStatus === filter.value ? 'active' : ''}`}
//                 >
//                   {filter.label} ({filter.count})
//                 </button>
//               ))}
//             </div>
//           </div>
//           <div className="search-actions">
//             <div className="search-container">
//               <Search size={18} className="search-icon" />
//               <input
//                 type="text"
//                 placeholder="Search students by name, phone, or email..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="search-input"
//               />
//             </div>
//                           <button className="btn-icon">
//                 <Download size={18} />
//               </button>
//               <button className="btn-primary" onClick={() => openModal('addStudent')}>
//                 <UserPlus size={18} className="icon-left" />
//                 Add Student
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* // Breadcrumb navigation */}
//        {(selectedCenter || selectedCourse || selectedBatch) && (
//         <div className="breadcrumb">
//           <span className="breadcrumb-item clickable" onClick={() => handleBreadcrumbClick('centers')}>
//             Centers
//           </span>
//         </div>
//       )}

      
//       <div className="card-content">
//         <div className="candidate-table">
//           <div className="table-header">
//             <div className="table-cell">Student</div>
//             <div className="table-cell">Contact</div>
//             <div className="table-cell">Center</div>
//             <div className="table-cell">Course</div>
//             <div className="table-cell">Batch</div>
//             <div className="table-cell">Status</div>
//             <div className="table-cell">Enrollment Date</div>
//             <div className="table-cell">Actions</div>
//           </div>
//           {getFilteredCandidates().length > 0 ? (
//             getFilteredCandidates().map(candidate => (
//               <div className="table-row" key={candidate.id}>
//                 <div className="table-cell">
//                   <div className="student-info">
//                     <div className="student-avatar">
//                       {candidate.name.charAt(0)}
//                     </div>
//                     <div>
//                       <div className="student-name">{candidate.name}</div>
//                       <div className="student-address">{candidate.address}</div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="table-cell">
//                   <div>{candidate.phone}</div>
//                   <div className="student-email">{candidate.email}</div>
//                 </div>
//                 <div className="table-cell">{candidate.center}</div>
//                 <div className="table-cell">{candidate.course}</div>
//                 <div className="table-cell">{candidate.batch}</div>
//                 <div className="table-cell">
//                   <span className={`position-relative badge status-${candidate.status}`}>{candidate.status}</span>
//                 </div>
//                 <div className="table-cell">{candidate.enrollmentDate}</div>
//                 <div className="table-cell">
//                   <div className="action-buttons">
//                     <button className="btn-icon" onClick={() => openModal('viewStudent', candidate)}>
//                       <Eye size={16} />
//                     </button>
//                     <button className="btn-icon" onClick={() => openModal('editStudent', candidate)}>
//                       <Edit size={16} />
//                     </button>
//                     {/* <button className="btn-icon" onClick={() => handleDelete('student', candidate.id)}>
//                       <Trash2 size={16} />
//                     </button> */}
//                   </div>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="empty-state">
//               <div className="empty-icon">
//                 <Users size={48} />
//               </div>
//               <h3>No students found</h3>
//               <p>Try adjusting your filters or add a new student</p>
//               <button className="btn-primary" onClick={() => openModal('addStudent')}>
//                 <UserPlus size={18} className="icon-left" />
//                 Add Student
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//       </>
//   );

//   // Form Modal Component
//   const FormModal = () => {
//     // Determine form fields based on modal type
//     let formFields = [];
//     let modalTitle = '';

//     if (modalType === 'addCenter' || modalType === 'editCenter') {
//       modalTitle = modalType === 'addCenter' ? 'Add New Center' : 'Edit Center';
//       formFields = [
//         { name: 'name', label: 'Center Name', type: 'text', placeholder: 'Enter center name', required: true },
//         { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter center address', required: true },
//         { name: 'contact', label: 'Contact Number', type: 'text', placeholder: 'Enter contact number', required: true }
//       ];
//     }
//     else if (modalType === 'addCourse' || modalType === 'editCourse') {
//       modalTitle = modalType === 'addCourse' ? 'Add New Course' : 'Edit Course';
//       formFields = [
//         { name: 'name', label: 'Course Name', type: 'text', placeholder: 'Enter course name', required: true },
//         { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 6 months', required: true },
//         { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter course description', required: true }
//       ];

//       // Add center selection if not in a specific center context
//       if (!selectedCenter) {
//         formFields.push({
//           name: 'centerId',
//           label: 'Center',
//           type: 'select',
//           options: centers.map(center => ({ value: center.id, label: center.name })),
//           required: true
//         });
//       }
//     }
//     else if (modalType === 'addBatch' || modalType === 'editBatch') {
//       modalTitle = modalType === 'addBatch' ? 'Add New Batch' : 'Edit Batch';
//       formFields = [
//         { name: 'name', label: 'Batch Name', type: 'text', placeholder: 'Enter batch name', required: true },
//         { name: 'startDate', label: 'Start Date', type: 'date', required: true },
//         { name: 'endDate', label: 'End Date', type: 'date', required: true },
//         { name: 'status', label: 'Status', type: 'select', options: [
//           { value: 'active', label: 'Active' },
//           { value: 'completed', label: 'Completed' },
//           { value: 'upcoming', label: 'Upcoming' }
//         ], required: true }
//       ];

//       // Add course selection if not in a specific course context
//       if (!selectedCourse) {
//         formFields.push({
//           name: 'courseId',
//           label: 'Course',
//           type: 'select',
//           options: courses.map(course => ({ value: course.id, label: course.name })),
//           required: true
//         });
//       }
//     }
//     else if (modalType === 'addStudent' || modalType === 'editStudent') {
//       modalTitle = modalType === 'addStudent' ? 'Add New Student' : 'Edit Student';
//       formFields = [
//         { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter full name', required: true },
//         { name: 'phone', label: 'Phone Number', type: 'text', placeholder: 'Enter phone number', required: true },
//         { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address', required: true },
//         { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter address', required: true },
//         { name: 'enrollmentDate', label: 'Enrollment Date', type: 'date', required: true }
//       ];

//       // Add center, course, batch selections if not in specific contexts
//       if (!selectedCenter) {
//         formFields.push({
//           name: 'centerId',
//           label: 'Center',
//           type: 'select',
//           options: centers.map(center => ({ value: center.id, label: center.name })),
//           required: true
//         });
//       }

//       if (!selectedCourse) {
//         formFields.push({
//           name: 'courseId',
//           label: 'Course',
//           type: 'select',
//           options: selectedCenter 
//             ? courses.filter(course => course.centerId === selectedCenter.id).map(course => ({ value: course.id, label: course.name }))
//             : courses.map(course => ({ value: course.id, label: course.name })),
//           required: true
//         });
//       }

//       if (!selectedBatch) {
//         formFields.push({
//           name: 'batchId',
//           label: 'Batch',
//           type: 'select',
//           options: selectedCourse 
//             ? batches.filter(batch => batch.courseId === selectedCourse.id).map(batch => ({ value: batch.id, label: batch.name }))
//             : batches.map(batch => ({ value: batch.id, label: batch.name })),
//           required: true
//         });
//       }

//       if (modalType === 'editStudent') {
//         formFields.push({
//           name: 'status',
//           label: 'Status',
//           type: 'select',
//           options: [
//             { value: 'pursuing', label: 'Pursuing' },
//             { value: 'completed', label: 'Completed' },
//             { value: 'dropout', label: 'Dropout' }
//           ],
//           required: true
//         });
//       }
//     }
//     else if (modalType === 'viewStudent') {
//       modalTitle = 'Student Details';
//       // This is just a view mode, no form fields needed
//     }

//     return (
//       <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
//         <div className="modal-content" onClick={e => e.stopPropagation()}>
//           <div className="modal-header">
//             <h3 className="modal-title">{modalTitle}</h3>
//             <button className="btn-close" onClick={closeModal}>
//               <X size={20} />
//             </button>
//           </div>
          
//           {modalType === 'viewStudent' ? (
//             <div className="modal-body">
//               <div className="student-profile">
//                 <div className="student-profile-header">
//                   <div className="student-avatar large">
//                     {formData.name?.charAt(0)}
//                   </div>
//                   <div className="student-profile-info">
//                     <h2 className="student-profile-name">{formData.name}</h2>
//                     <div className="student-profile-detail">
//                       <span className={`position-relative badge status-${formData.status}`}>{formData.status}</span>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="student-details">
//                   <div className="detail-section">
//                     <h4 className="detail-heading">Contact Information</h4>
//                     <div className="detail-grid">
//                       <div className="detail-item">
//                         <div className="detail-label">Phone</div>
//                         <div className="detail-value">{formData.phone}</div>
//                       </div>
//                       <div className="detail-item">
//                         <div className="detail-label">Email</div>
//                         <div className="detail-value">{formData.email}</div>
//                       </div>
//                       <div className="detail-item">
//                         <div className="detail-label">Address</div>
//                         <div className="detail-value">{formData.address}</div>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="detail-section">
//                     <h4 className="detail-heading">Education Information</h4>
//                     <div className="detail-grid">
//                       <div className="detail-item">
//                         <div className="detail-label">Center</div>
//                         <div className="detail-value">{formData.center}</div>
//                       </div>
//                       <div className="detail-item">
//                         <div className="detail-label">Course</div>
//                         <div className="detail-value">{formData.course}</div>
//                       </div>
//                       <div className="detail-item">
//                         <div className="detail-label">Batch</div>
//                         <div className="detail-value">{formData.batch}</div>
//                       </div>
//                       <div className="detail-item">
//                         <div className="detail-label">Enrolled On</div>
//                         <div className="detail-value">{formData.enrollmentDate}</div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="modal-footer">
//                   <button className="btn-secondary" onClick={closeModal}>Close</button>
//                   <button className="btn-primary" onClick={() => {
//                     closeModal();
//                     openModal('editStudent', formData);
//                   }}>Edit Student</button>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit}>
//               <div className="modal-body">
//                 {formFields.map(field => (
//                   <div className="form-group" key={field.name}>
//                     <label htmlFor={field.name} className="form-label">{field.label}</label>
                    
//                     {field.type === 'select' ? (
//                       <select
//                         id={field.name}
//                         name={field.name}
//                         value={formData[field.name] || ''}
//                         onChange={handleFormChange}
//                         className="form-select"
//                         required={field.required}
//                       >
//                         <option value="">Select {field.label}</option>
//                         {field.options.map(option => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </select>
//                     ) : field.type === 'textarea' ? (
//                       <textarea
//                         id={field.name}
//                         name={field.name}
//                         value={formData[field.name] || ''}
//                         onChange={handleFormChange}
//                         placeholder={field.placeholder}
//                         className="form-textarea"
//                         required={field.required}
//                       ></textarea>
//                     ) : (
//                       <input
//                         type={field.type}
//                         id={field.name}
//                         name={field.name}
//                         value={formData[field.name] || ''}
//                         onChange={handleFormChange}
//                         placeholder={field.placeholder}
//                         className="form-input"
//                         required={field.required}
//                       />
//                     )}
//                   </div>
//                 ))}
//               </div>
              
//               <div className="modal-footer">
//                 <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
//                 <button type="submit" className="btn-primary">
//                   {modalType.startsWith('add') ? 'Add' : 'Save Changes'}
//                 </button>
//               </div>
//             </form>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // Main content based on view mode
//   const renderContent = () => {
//     switch (viewMode) {
//       case 'dashboard':
//         return <Dashboard />;
//       case 'centers':
//         return <CentersView />;
//       case 'courses':
//         return <CoursesView />;
//       case 'batches':
//         return <BatchesView />;
//       case 'candidates':
//         return <CandidateList />;
//       default:
//         return <Dashboard />;
//     }
//   };

//   // Notification component
//   const Notification = () => {
//     if (!notification) return null;

//     return (
//       <div className={`notification notification-${notification.type}`}>
//         {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
//         <span>{notification.message}</span>
//       </div>
//     );
//   };

//   return (
//     <div className="app">
//       {/* Header */}
//       <header className="header">
//         <div className="container">
//           <div className="header-content">
//             <h1 className="app-title">Our Students</h1>
            
//           </div>
//         </div>
//       </header>

//       {/* Navigation */}
//       <nav className="main-nav">
//         <div className="container">
//           <div className="nav-tabs">
//             <button
//               onClick={() => {
//                 setActiveTab('overview');
//                 setViewMode('dashboard');
//               }}
//               className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
//             >
//               Overview
//             </button>
//             <button
//               onClick={() => {
//                 setActiveTab('candidates');
//                 setViewMode('centers');
//               }}
//               className={`nav-link ${activeTab === 'candidates' ? 'active' : ''}`}
//             >
//               Details
//             </button>
            
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="main-content">
//         <div className="container">
//           {renderContent()}
//         </div>
//       </main>

//       {/* Modal */}
//       {showModal && <FormModal />}

//       {/* Notification */}
//       <Notification />

//       <style jsx>{`
//         /* Reset and Base Styles */
//         * {
//           box-sizing: border-box;
//           margin: 0;
//           padding: 0;
//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
//         }
        
//         body {
//           background-color: #f5f7fa;
//           color: #333;
//           line-height: 1.6;
//         }
        
//         button {
//           cursor: pointer;
//           font-family: inherit;
//         }
        
//         /* App Container */
//         .app {
//           display: flex;
//           flex-direction: column;
//           min-height: 100vh;
//         }
        
//         .container {
//           width: 100%;
//           max-width: 1200px;
//           margin: 0 auto;
//           padding: 0 20px;
//         }
        
//         /* Header Styles */
//         .header {
//           background-color: #fff;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//           padding: 15px 0;
   
//           top: 0;
//           z-index: 100;
//         }
        
//         .header-content {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
        
//         .app-title {
//           font-size: 1.5rem;
//           font-weight: 600;
//           color: #2c3e50;
//           margin: 0;
//         }
        
//         .user-profile {
//           display: flex;
//           align-items: center;
//         }
        
//         .btn-profile {
//           background: none;
//           border: none;
//           display: flex;
//           align-items: center;
//           padding: 0;
//         }
        
       
        
//         /* Navigation Styles */
//         .main-nav {
//           background-color: #fff;
//           border-bottom: 1px solid #e5e7eb;
//           margin-bottom: 20px;
//         }
        
//         .nav-tabs {
//           display: flex;
//           gap: 20px;
//         }
        
//         .nav-link {
//           background: none;
//           border: none;
//           padding: 15px 0;
//           font-size: 1rem;
//           color: #64748b;
//           position: relative;
//           transition: color 0.3s;
//         }
        
//         .nav-link:hover {
//           color: #3b82f6;
//         }
        
//         .nav-link.active {
//           color: #3b82f6;
//           font-weight: 500;
//         }
        
//         .nav-link.active::after {
//           content: '';
//           position: absolute;
//           bottom: -1px;
//           left: 0;
//           width: 100%;
//           height: 3px;
//           background-color: #3b82f6;
//         }
        
//         /* Main Content */
//         .main-content {
//           flex: 1;
//           padding: 20px 0 40px;
//         }
        
//         /* Card Styles */
//         .card {
//           background-color: #fff;
//           border-radius: 8px;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//           margin-bottom: 20px;
//           overflow: hidden;
//           transition: box-shadow 0.3s ease;
//         }
        
//         .card:hover {
//           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         }
        
//         .card-header {
//           padding: 16px 20px;
//           border-bottom: 1px solid #e5e7eb;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
        
//         .card-title {
//           font-size: 1.25rem;
//           font-weight: 600;
//           color: #2c3e50;
//           margin: 0;
//         }
        
//         .card-content {
//           padding: 20px;
//         }
        
//         /* Button Styles */
//         .btn-primary {
//           background-color: #3b82f6;
//           color: #fff;
//           border: none;
//           border-radius: 4px;
//           padding: 8px 16px;
//           font-size: 0.875rem;
//           font-weight: 500;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           transition: background-color 0.2s;
//         }
        
//         .btn-primary:hover {
//           background-color: #2563eb;
//         }
        
//         .btn-secondary {
//           background-color: #f3f4f6;
//           color: #4b5563;
//           border: 1px solid #e5e7eb;
//           border-radius: 4px;
//           padding: 8px 16px;
//           font-size: 0.875rem;
//           font-weight: 500;
//           transition: all 0.2s;
//         }
        
//         .btn-secondary:hover {
//           background-color: #e5e7eb;
//         }
        
//         .btn-icon {
//           width: 36px;
//           height: 36px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           border: 1px solid #e5e7eb;
//           border-radius: 4px;
//           background-color: #fff;
//           color: #64748b;
//           transition: all 0.2s;
//         }
        
//         .btn-icon:hover {
//           background-color: #f3f4f6;
//           color: #3b82f6;
//         }
        
//         .btn-text {
//           background: none;
//           border: none;
//           color: #3b82f6;
//           font-size: 0.875rem;
//           font-weight: 500;
//           padding: 0;
//           transition: color 0.2s;
//         }
        
//         .btn-text:hover {
//           color: #2563eb;
//           text-decoration: underline;
//         }
        
//         .icon-left {
//           margin-right: 4px;
//         }

//         .btn-close {
//           background: none;
//           border: none;
//           padding: 4px;
//           color: #64748b;
//           border-radius: 4px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
        
//         .btn-close:hover {
//           background-color: #f3f4f6;
//         }
        
//         /* Dashboard Styles */
//         .dashboard {
//           margin-bottom: 30px;
//         }
        
//         .stats-container {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
//           gap: 20px;
//           margin-bottom: 24px;
//         }
        
//         .stat-card {
//           background-color: #fff;
//           border-radius: 8px;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
//           padding: 20px;
//           display: flex;
//           align-items: center;
//           transition: transform 0.2s, box-shadow 0.2s;
//         }
        
//         .stat-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         }
        
//         .stat-icon {
//           width: 48px;
//           height: 48px;
//           border-radius: 12px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           margin-right: 16px;
//         }
        
//         .students-icon {
//           background-color: rgba(124, 58, 237, 0.1);
//           color: #7c3aed;
//         }
        
//         .centers-icon {
//           background-color: rgba(59, 130, 246, 0.1);
//           color: #3b82f6;
//         }
        
//         .courses-icon {
//           background-color: rgba(245, 158, 11, 0.1);
//           color: #f59e0b;
//         }
        
//         .batches-icon {
//           background-color: rgba(16, 185, 129, 0.1);
//           color: #10b981;
//         }
        
//         .stat-info {
//           flex: 1;
//         }
        
//         .stat-label {
//           font-size: 0.875rem;
//           color: #64748b;
//           margin-bottom: 4px;
//         }
        
//         .stat-value {
//           font-size: 1.5rem;
//           font-weight: 700;
//           color: #2c3e50;
//           margin: 0 0 8px 0;
//         }
        
//         .stat-progress {
//           margin-top: 8px;
//         }
        
//         .progress-bar {
//           height: 4px;
//           background-color: #e5e7eb;
//           border-radius: 2px;
//           overflow: hidden;
//           margin-bottom: 4px;
//         }
        
//         .progress-fill {
//           height: 100%;
//           background-color: #3b82f6;
//           border-radius: 2px;
//         }
        
//         .progress-text {
//           font-size: 0.75rem;
//           color: #10b981;
//         }
        
//         /* Dashboard Layout */
//         .dashboard-row {
//           display: grid;
//           grid-template-columns: 2fr 1fr;
//           gap: 20px;
//           margin-bottom: 24px;
//         }
        
//         .dashboard-chart {
//           height: 300px;
//         }
        
//         .dashboard-stats {
//           height: 300px;
//         }
        
//         .chart-container {
//           height: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
        
//         .chart-placeholder {
//           width: 100%;
//           height: 100%;
//           display: flex;
//           align-items: flex-end;
//           justify-content: center;
//           padding: 20px;
//         }
        
//         .mock-chart {
//           width: 100%;
//           height: 200px;
//           display: flex;
//           align-items: flex-end;
//           justify-content: space-between;
//         }
        
//         .chart-bar {
//           width: 40px;
//           background-color: #e5e7eb;
//           border-radius: 4px 4px 0 0;
//           position: relative;
//           transition: height 0.3s;
//         }
        
//         .chart-bar.accent {
//           background-color: #3b82f6;
//         }
        
//         .chart-bar span {
//           position: absolute;
//           bottom: -25px;
//           left: 50%;
//           transform: translateX(-50%);
//           font-size: 0.75rem;
//           color: #64748b;
//         }
        
//         .chart-bar:hover {
//           opacity: 0.8;
//         }
        
//         /* Status Stats */
//         .status-stats {
//           padding: 10px 0;
//         }
        
//         .status-item {
//           margin-bottom: 20px;
//         }
        
//         .status-info {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 8px;
//         }
        
//         .status-label {
//           font-size: 0.875rem;
//           color: #4b5563;
//         }
        
//         .status-value {
//           font-weight: 600;
//           color: #2c3e50;
//         }
        
//         .status-bar {
//           height: 8px;
//           background-color: #e5e7eb;
//           border-radius: 4px;
//           overflow: hidden;
//         }
        
//         .status-fill {
//           height: 100%;
//           border-radius: 4px;
//           transition: width 0.3s;
//         }
        
//         .status-fill.pursuing {
//           background-color: #3b82f6;
//         }
        
//         .status-fill.completed {
//           background-color: #10b981;
//         }
        
//         .status-fill.dropout {
//           background-color: #ef4444;
//         }
        
//         /* Grid Layouts */
//         .center-grid,
//         .course-grid,
//         .batch-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//           gap: 20px;
//         }
        
//         .center-card,
//         .course-card,
//         .batch-card {
//           border: 1px solid #e5e7eb;
//           border-radius: 8px;
//           padding: 20px;
//           transition: all 0.3s;
//         }
        
//         .hover-card {
//           cursor: pointer;
//         }
        
//         .hover-card:hover {
//           border-color: #3b82f6;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//           transform: translateY(-2px);
//         }
        
//         .center-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 10px;
//         }
        
//         .center-name,
//         .course-name,
//         .batch-name {
//           font-size: 1.125rem;
//           font-weight: 600;
//           color: #2c3e50;
//           margin-bottom: 8px;
//         }
        
//         .center-stats,
//         .course-duration {
//           font-size: 0.875rem;
//           color: #64748b;
//           margin-bottom: 6px;
//         }
        
//         .center-address,
//         .center-contact,
//         .course-description {
//           font-size: 0.875rem;
//           color: #64748b;
//           margin-bottom: 12px;
//           line-height: 1.5;
//         }
        
//         .card-header-flex {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 10px;
//         }
        
//         .icon-chevron {
//           color: #94a3b8;
//           margin-top: 4px;
//         }
        
//         .card-footer {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-top: 15px;
//           padding-top: 15px;
//           border-top: 1px solid #e5e7eb;
//         }
        
//         .small-text {
//           font-size: 0.875rem;
//           color: #64748b;
//         }
        
//         .batch-dates {
//           margin: 10px 0;
//         }
        
//         .center-actions {
//           display: flex;
//           gap: 8px;
//         }
        
//         .button-group {
//           display: flex;
//           gap: 8px;
//         }
        
//         /* Badge Styles */
//         .badge-container {
//           margin-top: 5px;
//         }
        
//         .badge {
//           display: inline-block;
//           padding: 4px 10px;
//           border-radius: 20px;
//           font-size: 0.75rem;
//           font-weight: 500;
//           text-transform: capitalize;
//         }
        
//         .status-all {
//           background-color: #f3f4f6;
//           color: #4b5563;
//         }
        
//         .status-pursuing {
//           background-color: #dbeafe;
//           color: #1e40af;
//         }
        
//         .status-completed {
//           background-color: #d1fae5;
//           color: #065f46;
//         }
        
//         .status-dropout {
//           background-color: #fee2e2;
//           color: #b91c1c;
//         }
        
//         .status-active {
//           background-color: #d1fae5;
//           color: #065f46;
//         }
        
//         .status-upcoming {
//           background-color: #fef3c7;
//           color: #92400e;
//         }
        
//         /* Filters and Search Styles */
//         .filters-container {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }
        
//         .status-filters {
//           display: flex;
//           flex-wrap: wrap;
//           align-items: center;
//           gap: 16px;
//         }
        
//         .candidate-title {
//           margin: 0;
//         }
        
//         .filter-buttons {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 10px;
//         }
        
//         .btn-filter {
//           padding: 6px 12px;
//           border-radius: 20px;
//           font-size: 0.875rem;
//           border: 1px solid transparent;
//           background-color: transparent;
//           transition: all 0.2s;
//         }
        
//         .btn-filter.active {
//           font-weight: 600;
//           border-color: currentColor;
//         }
        
//         .search-actions {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 10px;
//           align-items: center;
//         }
        
//         .search-container {
//           position: relative;
//           flex: 1;
//           min-width: 200px;
//         }
        
//         .search-icon {
//           position: absolute;
//           left: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #94a3b8;
//           pointer-events: none;
//         }
        
        
        
//         .candidate-header {
//           flex-direction: column;
//           align-items: flex-start;
//           gap: 16px;
//         }
        
//         /* Select styling */
//         .select-period {
//           padding: 6px 10px;
//           border: 1px solid #e5e7eb;
//           border-radius: 4px;
//           font-size: 0.875rem;
//           color: #4b5563;
//           background-color: #fff;
//         }
        
//         /* Breadcrumb Styles */
//         .breadcrumb {
//           padding: 0 20px 12px;
//           font-size: 0.875rem;
//           color: #64748b;
//           display: flex;
//           align-items: center;
//           flex-wrap: wrap;
//         }
        
//         .breadcrumb-item {
//           color: #64748b;
//         }
        
//         .breadcrumb-item.clickable {
//           color: #3b82f6;
//           cursor: pointer;
//         }
        
//         .breadcrumb-item.clickable:hover {
//           text-decoration: underline;
//         }
        
//         .breadcrumb-separator {
//           margin: 0 8px;
//           color: #94a3b8;
//         }
        
//         /* Table Styles */
//         .candidate-table {
//           width: 100%;
//           border-collapse: collapse;
//         }
        
//         .table-header {
//           background-color: #f8fafc;
//           font-weight: 600;
//           color: #334155;
//           font-size: 0.875rem;
//           text-align: left;
//           display: flex;
//         }
        
//         .table-row {
//           border-bottom: 1px solid #e5e7eb;
//           display: flex;
//           transition: background-color 0.2s;
//         }
        
//         .table-row:hover {
//           background-color: #f8fafc;
//         }
        
//         .table-cell {
//           padding: 12px 16px;
//           font-size: 0.875rem;
//           color: #1e293b;
//           flex: 1;
//           min-width: 120px;
//           display: flex;
//           align-items: center;
//         }
        
//         .student-info {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }
        
//         .student-avatar {
//           width: 36px;
//           height: 36px;
//           border-radius: 50%;
//           background-color: #3b82f6;
//           color: #fff;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-weight: 600;
//           font-size: 14px;
//         }

//         .student-avatar.large {
//           width: 64px;
//           height: 64px;
//           font-size: 24px;
//         }
        
//         .student-name {
//           font-weight: 500;
//           color: #1e293b;
//         }
        
//         .student-address,
//         .student-email {
//           font-size: 0.75rem;
//           color: #64748b;
//         }
        
//         .action-buttons {
//           display: flex;
//           gap: 8px;
//         }
        
//         /* Empty state */
//         .empty-state {
//           padding: 60px 20px;
//           text-align: center;
//           color: #64748b;
//         }
        
//         .empty-icon {
//           margin: 0 auto 20px;
//           width: 64px;
//           height: 64px;
//           border-radius: 50%;
//           background-color: #f3f4f6;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: #94a3b8;
//         }
        
//         .empty-state h3 {
//           margin-bottom: 8px;
//           color: #334155;
//         }
        
//         .empty-state p {
//           margin-bottom: 20px;
//         }
        
//         /* Modal Styles */
//         .modal-overlay {
//           position: fixed;
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//           background-color: rgba(0, 0, 0, 0.5);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 1000;
//           opacity: 0;
//           visibility: hidden;
//           transition: opacity 0.3s, visibility 0.3s;
//         }
        
//         .modal-overlay.active {
//           opacity: 1;
//           visibility: visible;
//         }
        
//         .modal-content {
//           background-color: #fff;
//           border-radius: 8px;
//           width: 95%;
//           max-width: 500px;
//           max-height: 90vh;
//           overflow-y: auto;
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
//           transform: scale(0.9);
//           transition: transform 0.3s;
//         }
        
//         .modal-overlay.active .modal-content {
//           transform: scale(1);
//         }
        
//         .modal-header {
//           padding: 16px 20px;
//           border-bottom: 1px solid #e5e7eb;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
        
//         .modal-title {
//           font-size: 1.25rem;
//           font-weight: 600;
//           color: #1e293b;
//           margin: 0;
//         }
        
//         .modal-body {
//           padding: 20px;
//         }
        
//         .modal-footer {
//           padding: 16px 20px;
//           border-top: 1px solid #e5e7eb;
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//         }
        
//         /* Form Styles */
//         .form-group {
//           margin-bottom: 20px;
//         }
        
//         .form-label {
//           display: block;
//           margin-bottom: 8px;
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: #334155;
//         }
        
//         .form-input,
//         .form-select,
//         .form-textarea {
//           width: 100%;
//           padding: 10px 12px;
//           border: 1px solid #e5e7eb;
//           border-radius: 6px;
//           font-size: 0.875rem;
//           color: #1e293b;
//           transition: border-color 0.2s;
//         }
        
//         .form-textarea {
//           resize: vertical;
//           min-height: 100px;
//         }
        
//         .form-input:focus,
//         .form-select:focus,
//         .form-textarea:focus {
//           border-color: #3b82f6;
//           outline: none;
//         }
        
//         /* Student Profile */
//         .student-profile {
//           width: 100%;
//         }
        
//         .student-profile-header {
//           display: flex;
//           gap: 20px;
//           margin-bottom: 24px;
//         }
        
//         .student-profile-info {
//           flex: 1;
//         }
        
//         .student-profile-name {
//           font-size: 1.5rem;
//           font-weight: 600;
//           color: #1e293b;
//           margin: 0 0 8px 0;
//         }
        
//         .student-profile-detail {
//           display: flex;
//           gap: 10px;
//           flex-wrap: wrap;
//         }
        
//         .detail-section {
//           margin-bottom: 24px;
//         }
        
//         .detail-heading {
//           font-size: 1rem;
//           font-weight: 600;
//           color: #334155;
//           margin: 0 0 16px 0;
//           padding-bottom: 8px;
//           border-bottom: 1px solid #e5e7eb;
//         }
        
//         .detail-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
//           gap: 16px;
//         }
        
//         .detail-item {
//           margin-bottom: 8px;
//         }
        
//         .detail-label {
//           font-size: 0.75rem;
//           color: #64748b;
//           margin-bottom: 4px;
//         }
        
//         .detail-value {
//           font-size: 0.875rem;
//           color: #1e293b;
//           font-weight: 500;
//         }
        
//         /* Notification */
//         .notification {
//           position: fixed;
//           bottom: 24px;
//           right: 24px;
//           padding: 12px 16px;
//           background-color: #fff;
//           border-radius: 6px;
//           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           z-index: 1000;
//           animation: slide-in 0.3s ease-out;
//         }
        
//         .notification-success {
//           border-left: 4px solid #10b981;
//         }
        
//         .notification-error {
//           border-left: 4px solid #ef4444;
//         }
        
//         @keyframes slide-in {
//           from {
//             transform: translateX(100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
        
//         /* Responsive Adjustments */
//         @media (max-width: 768px) {
//           .stats-container,
//           .dashboard-row {
//             grid-template-columns: 1fr;
//           }
          
//           .center-grid,
//           .course-grid,
//           .batch-grid {
//             grid-template-columns: 1fr;
//           }
          
//           .table-header,
//           .table-row {
//             display: block;
//           }
          
//           .table-cell {
//             display: flex;
//             justify-content: space-between;
//             padding: 8px 16px;
//           }
          
//           .table-cell:before {
//             content: attr(data-label);
//             font-weight: 600;
//           }
          
//           .search-actions {
//             flex-direction: column;
//             align-items: stretch;
//           }
          
//           .search-container {
//             width: 100%;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CandidateManagementPortal;