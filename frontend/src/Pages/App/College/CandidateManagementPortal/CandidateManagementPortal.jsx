import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Building2, 
  Calendar, 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  UserPlus
} from 'lucide-react';

const CandidateManagementPortal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data
  const centers = [
    { id: 1, name: 'Delhi Center', candidates: 150 },
    { id: 2, name: 'Mumbai Center', candidates: 200 },
    { id: 3, name: 'PSD Chandauli Center', candidates: 75 },
    { id: 4, name: 'Bangalore Center', candidates: 180 }
  ];
  
  const courses = [
    { id: 1, name: 'Hotel Management', duration: '6 months', students: 85 },
    { id: 2, name: 'Data Science', duration: '4 months', students: 65 },
    { id: 3, name: 'Retail Management', duration: '3 months', students: 45 }
  ];
  
  const batches = [
    { id: 1, name: 'Batch A-2025', startDate: '2025-01-15', endDate: '2025-07-15', students: 30, status: 'active' },
    { id: 2, name: 'Batch B-2025', startDate: '2025-02-01', endDate: '2025-08-01', students: 25, status: 'active' },
    { id: 3, name: 'Batch C-2024', startDate: '2024-09-01', endDate: '2025-03-01', students: 35, status: 'completed' }
  ];
  
  const candidates = [
    { 
      id: 1, 
      name: 'Akash Gaurav',
      phone: '9027486847',
      center: 'PSD Chandauli Center',
      course: 'Hotel Management',
      batch: 'Batch A-2025',
      status: 'pursuing',
      enrollmentDate: '2025-01-15'
    },
    { 
      id: 2, 
      name: 'Rahul Sharma',
      phone: '9876543210',
      center: 'Delhi Center',
      course: 'Data Science',
      batch: 'Batch B-2025',
      status: 'completed',
      enrollmentDate: '2025-02-01'
    },
    { 
      id: 3, 
      name: 'Priya Singh',
      phone: '8765432109',
      center: 'Mumbai Center',
      course: 'Retail Management',
      batch: 'Batch C-2024',
      status: 'dropout',
      enrollmentDate: '2024-09-15'
    }
  ];
  
  const statusFilters = [
    { value: 'all', label: 'All', count: 3, color: 'bg-secondary text-dark' },
    { value: 'pursuing', label: 'Pursuing', count: 1, color: 'bg-info text-dark' },
    { value: 'completed', label: 'Completed', count: 1, color: 'bg-success text-white' },
    { value: 'dropout', label: 'Dropout', count: 1, color: 'bg-danger text-white' }
  ];

  const statusClasses = {
    pursuing: 'bg-info text-dark',
    completed: 'bg-success text-white',
    dropout: 'bg-danger text-white'
  };

  const Dashboard = () => (
    <div className="mb-4">
      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                  <Users size={24} />
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-0 small">Total Candidates</p>
                  <h3 className="fw-bold">605</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                  <Building2 size={24} />
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-0 small">Active Centers</p>
                  <h3 className="fw-bold">{centers.length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning">
                  <BookOpen size={24} />
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-0 small">Active Courses</p>
                  <h3 className="fw-bold">{courses.length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 rounded-circle bg-info bg-opacity-10 text-info">
                  <GraduationCap size={24} />
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-0 small">Active Projects</p>
                  <h3 className="fw-bold">{batches.filter(b => b.status === 'active').length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Centers Overview */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Center Wise Distribution</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {centers.map(center => (
              <div key={center.id} className="col-md-6 col-lg-3">
                <div className="border rounded p-3">
                  <h6 className="fw-semibold">{center.name}</h6>
                  <p className="text-muted mb-0">{center.candidates} Candidates</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const CandidateList = () => (
    <div className="card">
      {/* Filters */}
      <div className="card-header">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <h5 className="card-title mb-0">Candidates</h5>
            <div className="d-flex flex-wrap gap-2">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`btn btn-sm rounded-pill ${
                    selectedStatus === filter.value 
                      ? filter.value === 'all' ? 'btn-secondary' :
                        filter.value === 'pursuing' ? 'btn-info' :
                        filter.value === 'completed' ? 'btn-success' : 'btn-danger'
                      : 'btn-outline-secondary'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control ps-5"
              />
            </div>
            <button className="btn btn-outline-secondary">
              <Filter size={18} />
            </button>
            <button className="btn btn-outline-secondary">
              <Download size={18} />
            </button>
            <button className="btn btn-warning d-flex align-items-center gap-2">
              <UserPlus size={18} />
              Add Candidate
            </button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Candidate</th>
              <th>Center</th>
              <th>Course</th>
              <th>Batch</th>
              <th>Status</th>
              <th>Enrollment Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates
              .filter(candidate => selectedStatus === 'all' || candidate.status === selectedStatus)
              .filter(candidate => 
                candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                candidate.phone.includes(searchQuery)
              )
              .map(candidate => (
                <tr key={candidate.id}>
                  <td>
                    <div>
                      <div className="fw-medium">{candidate.name}</div>
                      <div className="small text-muted">{candidate.phone}</div>
                    </div>
                  </td>
                  <td className="text-muted">{candidate.center}</td>
                  <td className="text-muted">{candidate.course}</td>
                  <td className="text-muted">{candidate.batch}</td>
                  
                  <td className="text-muted">{candidate.enrollmentDate}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const BatchManagement = () => (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Project Name: <span className="fw-normal">Amber</span></h5>
        <button className="btn btn-warning d-flex align-items-center gap-2">
          <Calendar size={18} />
          Create Project
        </button>
      </div>
      <div className="card-body">
        <div className="row g-4">
          {batches.map(batch => (
            <div key={batch.id} className="col-md-4">
              <div className="border rounded p-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="fw-semibold mb-0">{batch.name}</h6>
                  <span className={`badge ${
                    batch.status === 'active' ? 'bg-success' : 'bg-secondary'
                  }`}>
                    {batch.status}
                  </span>
                </div>
                <div className="small text-muted">
                  <p className="mb-1">Start: {batch.startDate}</p>
                  <p className="mb-1">End: {batch.endDate}</p>
                  <p className="mb-0">{batch.students} Students</p>
                </div>
                <button className="btn btn-outline-secondary w-100 mt-3">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-light min-vh-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky-top">
        <div className="container-fluid py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0">Our Students</h1>
            <div className="d-flex align-items-center">
              <div className="ms-3 position-relative">
                <div className="d-flex align-items-center">
                  <button className="btn p-0 d-flex align-items-center">
                    <img className="rounded-circle" width="32" height="32" src="" alt="User" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-bottom">
        <div className="container-fluid">
          <div className="d-flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`btn btn-link text-decoration-none px-0 py-3 border-bottom border-3 rounded-0 ${
                activeTab === 'overview'
                  ? 'text-warning border-warning'
                  : 'text-secondary border-transparent'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`btn btn-link text-decoration-none px-0 py-3 border-bottom border-3 rounded-0 ${
                activeTab === 'candidates'
                  ? 'text-warning border-warning'
                  : 'text-secondary border-transparent'
              }`}
            >
              Candidates
            </button>
            <button
              onClick={() => setActiveTab('Project')}
              className={`btn btn-link text-decoration-none px-0 py-3 border-bottom border-3 rounded-0 ${
                activeTab === 'Project'
                  ? 'text-warning border-warning'
                  : 'text-secondary border-transparent'
              }`}
            >
              Projects
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container-fluid py-4">
        {activeTab === 'overview' && <Dashboard />}
        {activeTab === 'candidates' && <CandidateList />}
        {activeTab === 'Project' && <BatchManagement />}
      </main>
    </div>
  );
};

export default CandidateManagementPortal;




// import React, { useState } from 'react';
// import { Plus, BookOpen, Users, FolderPlus, CheckCircle } from 'lucide-react';

// const CandidateManagementPortal = () => {
//     const [activeTab, setActiveTab] = useState('dashboard');
//     const [projects, setProjects] = useState([]);
//     const [courses, setCourses] = useState([]);
//     const [batches, setBatches] = useState([]);
//     const [studentProgress, setStudentProgress] = useState({});

//     // Form states
//     const [projectForm, setProjectForm] = useState({ name: '', description: '' });
//     const [courseForm, setCourseForm] = useState({ name: '', duration: '', level: '' });
//     const [batchForm, setBatchForm] = useState({ name: '', startDate: '', endDate: '', capacity: '' });

//     const handleCreateProject = () => {
//         if (!projectForm.name) return;
//         setProjects([...projects, { id: Date.now(), ...projectForm }]);
//         setProjectForm({ name: '', description: '' });
//     };

//     const handleCreateCourse = () => {
//         if (!courseForm.name) return;
//         const newCourse = { id: Date.now(), ...courseForm, status: 'active' };
//         setCourses([...courses, newCourse]);
//         // Initialize student progress for the new course
//         setStudentProgress({
//             ...studentProgress,
//             [newCourse.id]: {
//                 enrolled: 0,
//                 completed: 0,
//                 dropped: 0,
//                 inProgress: 0
//             }
//         });
//         setCourseForm({ name: '', duration: '', level: '' });
//     };

//     const handleProgressUpdate = (courseId, type) => {
//         setStudentProgress(prev => {
//             const current = prev[courseId] || { enrolled: 0, completed: 0, dropped: 0, inProgress: 0 };
//             return {
//                 ...prev,
//                 [courseId]: {
//                     ...current,
//                     [type]: current[type] + 1
//                 }
//             };
//         });
//     };

//     const handleCreateBatch = () => {
//         if (!batchForm.name) return;
//         setBatches([...batches, { id: Date.now(), ...batchForm }]);
//         setBatchForm({ name: '', startDate: '', endDate: '', capacity: '' });
//     };

//     const tabs = [
//         { id: 'dashboard', name: 'Dashboard', icon: CheckCircle },
//         { id: 'projects', name: 'Projects', icon: FolderPlus },
//         { id: 'courses', name: 'Courses', icon: BookOpen },
//         { id: 'batches', name: 'Batches', icon: Users },
//     ];

//     return (
//    <>

//             <section class="list-view">
//                 <div class="row">
//                     <div class="col-12 rounded equal-height-2 coloumn-2">
//                         <div class="card">
//                             <div class="row" id="crm-main-row">
//                                 <div class="card-content col-12 transition-col" id="mainContent">

//                                     <div class="row mb-2">
//                                         <div class="col-xl-12 col-lg-12 px-3">
//                                             <ul class="crmList">
//                                                 <li class="crmSubList">All <span class="totalLeads">(1)</span></li>
//                                                 <li class="crmSubList">Completed course<span
//                                                     class="totalLeads">(1)</span>
//                                                 </li>
//                                                 <li class="crmSubList">Persuing <span class="totalLeads">(1)</span>
//                                                 </li>
//                                                 <li class="crmSubList">Dropout <span class="totalLeads">(1)</span></li>

//                                             </ul>

//                                         </div>
//                                     </div>

//                                     <div class="row">
//                                         <div class="col-xl-12">
//                                             <div class="contact-row">
//                                                 <div class="row align-items-center">
//                                                     <div class="col-md-3">
//                                                         <div class="userCheckbox new-checkbox gap">
//                                                             <div class="contact-checkbox me-3">
//                                                                 <input type="checkbox" class="form-check-input" />
//                                                             </div>
//                                                             <div class="contact-info">
//                                                                 <p class="contact-name">Akash Gaurav</p>
//                                                                 <p class="contact-number m-0">9027486847</p>
//                                                             </div>

//                                                         </div>
//                                                     </div>
//                                                     <div class="col-md-6">
//                                                         <div class="userSelectBox new-checkbox">

//                                                             <div class="status-select d-flex flex-column">



//                                                                 <input type="text"
//                                                                     class="form-control form-control-sm text-truncate crmCheckList"
//                                                                     value="" readonly style="cursor: pointer;
//                                                                     border: 1px solid #ddd;
//                                                                     border-radius: 0px;
//                                                                     border-top-right-radius: 5px;
//                                                                     border-top-left-radius: 5px;" />
//                                                                 \
//                                                                 <input type="text"
//                                                                     class="form-control form-control-sm text-truncate"
//                                                                     value="Untouched Lead Long Text Example for Checking..."
//                                                                     readonly />
//                                                             </div>


//                                                             <div class="divider"></div>
//                                                             <div>
//                                                                 <a href=""
//                                                                     class="btn btn-danger waves-effect waves-light text-white d-inline btn-sm"
//                                                                     style="padding: 8px;">
//                                                                     View Docs
//                                                                 </a>
//                                                             </div>

//                                                         </div>
//                                                     </div>
//                                                     <div class="col-md-3">
//                                                         <div class="action-buttons new-checkbox">
//                                                             <button class="action-btn">
//                                                                 <i class="fas fa-phone"></i>
//                                                             </button>
//                                                             <button class="action-btn">
//                                                                 <i class="fab fa-whatsapp"></i>
//                                                             </button>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>


//                                         <div class="col-xl-12">
//                                             <div class="leadsStatus">
//                                                 <ul class="leadsDetails">
//                                                     <li class="status active">Lead Details</li>

//                                                 </ul>
//                                             </div>
//                                         </div>
//                                     </div>


//                                     <div class="tab-content">
//                                         <div class="tab-pane active" id="lead-details">

//                                             <div class="scrollable-container">
//                                                 <div class="scrollable-content">

//                                                     <div class="info-card">
//                                                         <div class="info-group">
//                                                             <div class="info-label">LEAD AGE</div>
//                                                             <div class="info-value">282 Days</div>
//                                                         </div>
//                                                         <div class="info-group">
//                                                             <div class="info-label">Lead Owner</div>
//                                                             <div class="info-value">Meta Ads Inbound IVR Inbound Call
//                                                             </div>
//                                                         </div>
//                                                         <div class="info-group">
//                                                             <div class="info-label">COURSE / JOB NAME</div>
//                                                             <div class="info-value">Operator</div>
//                                                         </div>
//                                                         <div class="info-group">
//                                                             <div class="info-label">BATCH NAME</div>
//                                                             <div class="info-value"></div>
//                                                         </div>

//                                                     </div>

                                                   


//                                                 </div>
//                                             </div>
//                                             <div class="scroll-arrow scroll-left d-md-none">&lt;</div>
//                                             <div class="scroll-arrow scroll-right  d-md-none">&gt;</div>


//                                             <div class="desktop-view">

//                                                 <div class="row">
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">LEAD AGE</div>
//                                                             <div class="info-value">282 Days</div>
//                                                         </div>
//                                                     </div>


//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">STATE</div>
//                                                             <div class="info-value">Uttar Pradesh</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">CITY</div>
//                                                             <div class="info-value"></div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">TYPE OF PROJECT</div>
//                                                             <div class="info-value">Job</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">PROJECT</div>
//                                                             <div class="info-value">Job</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">Sector</div>
//                                                             <div class="info-value">Retail</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">COURSE / JOB NAME</div>
//                                                             <div class="info-value">Operator</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">BATCH NAME</div>
//                                                             <div class="info-value"></div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">SECTOR</div>
//                                                             <div class="info-value">Retail</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">BRANCH NAME</div>
//                                                             <div class="info-value">PSD Chandauli Center</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">NEXT ACTION DATE</div>
//                                                             <div class="info-value"></div>
//                                                         </div>
//                                                     </div>

//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">LEAD CREATION DATE</div>
//                                                             <div class="info-value">Jan 15, 2024 9:29 AM</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">LEAD MODIFICATION DATE</div>
//                                                             <div class="info-value">Mar 21, 2025 3:32 PM</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">LEAD MODIFICATION BY</div>
//                                                             <div class="info-value">Name</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">Counsellor Name</div>
//                                                             <div class="info-value">Name</div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="col-xl-3">
//                                                         <div class="info-group">
//                                                             <div class="info-label">LEAD OWNER</div>
//                                                             <div class="info-value">Rahul Sharma</div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>

//                                         </div>
//                                         <div class="tab-pane" id="placement-interest">
//                                             <h5>Placement Interest Content</h5>
//                                             <p>Placement interest information would go here.</p>
//                                         </div>

//                                     </div>


//                                 </div>

//                                 <div class="col-4 transition-col" id="editFollowupPanel">
//                                     <div class="card border-0 shadow-sm">
//                                         <div
//                                             class="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">

//                                             <div class="d-flex align-items-center">
//                                                 <div class="me-2">
//                                                     <i class="fas fa-user-edit text-secondary"></i>
//                                                 </div>
//                                                 <h6 class="mb-0 followUp fw-medium">Edit Followup for HARSHIT
//                                                     ROHILLA</h6>
//                                             </div>


//                                             <div>
//                                                 <button class="btn-close" type="button" onclick="closeEditPanel()">
//                                                     <i class="fa-solid fa-xmark"></i>
//                                                 </button>
//                                             </div>
//                                         </div>

//                                         <div class="card-body">
//                                             <form>

//                                                 <div class="mb-1">
//                                                     <label for="leadCategory"
//                                                         class="form-label small fw-medium text-dark">Lead Category<span
//                                                             class="text-danger">*</span></label>
//                                                     <div class="d-flex">
//                                                         <div class="form-floating flex-grow-1">
//                                                             <select class="form-select  border-0" id="leadCategory"
//                                                                 style="height: 42px; padding-top: 8px; padding-inline : 10px; width: 100% ; background-color: #f1f2f6;">
//                                                                 <option value="">Application</option>
//                                                                 <option value="lead">Lead</option>
//                                                                 <option value="b2b">B2B</option>
//                                                                 <option value="rawdata">Raw Data</option>
//                                                             </select>
//                                                         </div>

//                                                     </div>
//                                                 </div>


//                                                 <div class="mb-1">
//                                                     <label for="status"
//                                                         class="form-label small fw-medium text-dark">Status<span
//                                                             class="text-danger">*</span></label>
//                                                     <div class="d-flex">
//                                                         <div class="form-floating flex-grow-1">
//                                                             <select class="form-select border-0" id="status"
//                                                                 style="height: 42px; padding-top: 8px; padding-inline : 10px; width: 100%; background-color: #f1f2f6">
//                                                                 <option value="">Select Status</option>
//                                                                 <option value="03">03 - Junk (B2C)</option>
//                                                                 <option value="01">01 - Untouched Lead</option>
//                                                                 <option value="02">02 - Not Connected</option>
//                                                             </select>
//                                                         </div>

//                                                     </div>
//                                                 </div>


//                                                 <div class="mb-1">
//                                                     <label for="subStatus"
//                                                         class="form-label small fw-medium text-dark">Sub-Status<span
//                                                             class="text-danger">*</span></label>
//                                                     <div class="d-flex">
//                                                         <div class="form-floating flex-grow-1">
//                                                             <select class="form-select border-0" id="subStatus"
//                                                                 style="height: 42px; padding-top: 8px; background-color: #f1f2f6; padding-inline : 10px; width: 100%;">
//                                                                 <option value="">Select Sub-Status</option>
//                                                                 <option value="not-relevant">Not Relevant</option>
//                                                                 <option value="wrong-number">Wrong Number</option>
//                                                                 <option value="duplicate">Duplicate</option>
//                                                                 <option value="out-of-service">Out of Service</option>
//                                                             </select>
//                                                         </div>

//                                                     </div>
//                                                 </div>
//                                                 <div class="row mb-1">

//                                                     <div class="col-6">
//                                                         <label for="nextActionDate"
//                                                             class="form-label small fw-medium text-dark">Next Action
//                                                             Date <span class="text-danger">*</span></label>
//                                                         <div class="input-group">
//                                                             <input type="date" class="form-control border-0"
//                                                                 id="nextActionDate" value="2025-01-13"
//                                                                 style="background-color: #f1f2f6; height: 42px; padding-inline: 10px;" />
//                                                         </div>
//                                                     </div>


//                                                     <div class="col-6">
//                                                         <label for="actionTime"
//                                                             class="form-label small fw-medium text-dark">Time <span
//                                                                 class="text-danger">*</span></label>
//                                                         <div class="input-group">
//                                                             <input type="time" class="form-control border-0"
//                                                                 id="actionTime" value="12:36"
//                                                                 style="background-color: #f1f2f6; height: 42px; padding-inline: 10px;" />
//                                                         </div>
//                                                     </div>
//                                                 </div>

//                                                 <div class="mb-1">
//                                                     <label for="comment"
//                                                         class="form-label small fw-medium text-dark">Comment</label>
//                                                     <textarea class="form-control  border-0" id="comment" rows="4"
//                                                         style="resize: none; background-color: #f1f2f6;">wrong no.</textarea>
//                                                 </div>


//                                                 <div class="d-flex justify-content-end gap-2 mt-4">
//                                                     <button type="button" class="btn"
//                                                         style="border: 1px solid #ddd; padding: 8px 24px; font-size: 14px;"
//                                                         onclick="closeEditPanel()">CLOSE</button>
//                                                     <button type="submit" class="btn text-white"
//                                                         style="background-color: #fd7e14; border: none; padding: 8px 24px; font-size: 14px;">UPDATE
//                                                         STATUS</button>
//                                                 </div>
//                                             </form>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div class="col-4 transition-col d-none" id="whatsappPanel">

//                                     <div class="whatsapp-chat right-side-panel">
//                                         <section class="topbar-container">
//                                             <div class="left-topbar">
//                                                 <div class="img-container">
//                                                     <div class="small-avatar" title="Ram Ruhela">RR</div>
//                                                 </div>
//                                                 <div class="flex-column"><span title="Ram Ruhela" class="lead-name">Ram
//                                                     Ruhela</span><br /><span class="selected-number">Primary:
//                                                         918875426236</span></div>
//                                             </div>
//                                             <div class="right-topbar"><a class="margin-horizontal-4" href="#"><img
//                                                 src="/public_assets/images/whatapp/whatsAppAccount.svg" alt="whatsAppAccount"
//                                                 title="whatsAppChatList.title.whatsAppAccount" /></a><a
//                                                     class="margin-horizontal-5" href="#"><img
//                                                         src="/public_assets/images/whatapp/refresh.svg" alt="refresh"
//                                                         title="refresh" /></a>

//                                             </div>
//                                         </section>
//                                         <section class="chat-view">
//                                             <ul class="chat-container" id="messageList">
//                                                 <div class="counselor-msg-container">
//                                                     <div class="chatgroupdate"><span>03/26/2025</span></div>
//                                                     <div class="counselor-msg-0 counselor-msg macro">
//                                                         <div class="text text-r">
//                                                             <div><span
//                                                                 class="message-header-name student-messages">Anjali
//                                                             </span><br />

//                                                                 <div class="d-flex">
//                                                                     <pre
//                                                                         class="text-message"><br /><span><font size="3">🎯</font>&nbsp;फ्री&nbsp;होटल&nbsp;मैनेजमेंट&nbsp;कोर्स&nbsp;-&nbsp;सुनहरा&nbsp;मौका&nbsp;<font size="3">🎯</font><br /><br />अब&nbsp;बने&nbsp;Guest&nbsp;Service&nbsp;Executive&nbsp;(Front&nbsp;Office)&nbsp;और&nbsp;होटल&nbsp;इंडस्ट्री&nbsp;में&nbsp;पाएं&nbsp;शानदार&nbsp;करियर&nbsp;की&nbsp;शुरुआत।<br /><br /><font size="3">✅</font>&nbsp;आयु&nbsp;सीमा:&nbsp;18&nbsp;से&nbsp;29&nbsp;वर्ष<br /><font size="3">✅</font>&nbsp;योग्यता:&nbsp;12वीं&nbsp;पास<br /><font size="3">✅</font>&nbsp;कोर्स&nbsp;अवधि:&nbsp;3&nbsp;से&nbsp;4&nbsp;महीने<br /><font size="3">✅</font>&nbsp;100%&nbsp;जॉब&nbsp;प्लेसमेंट&nbsp;गारंटी&nbsp;-&nbsp;4&nbsp;और&nbsp;5&nbsp;स्टार&nbsp;होटल्स,&nbsp;रेस्टोरेंट्स,&nbsp;फूड&nbsp;चेन&nbsp;और&nbsp;कैटरिंग&nbsp;में<br /><br /><font size="3">🔹</font>&nbsp;हमारे&nbsp;प्लेसमेंट&nbsp;पार्टनर्स:<br /><font size="3">🏨</font>&nbsp;Unique&nbsp;Resort&nbsp;&amp;&nbsp;Lifestyle&nbsp;|&nbsp;<font size="3">🏨</font>&nbsp;Clarks&nbsp;Inn&nbsp;|&nbsp;<font size="3">🍗</font>&nbsp;Barbeque&nbsp;Nation&nbsp;|&nbsp;<font size="3">🍔</font>&nbsp;KFC&nbsp;|&nbsp;<font size="3">🏰</font>&nbsp;Hotel&nbsp;Kohinoor&nbsp;|&nbsp;<font size="3">🏨</font>&nbsp;Comfort&nbsp;Inn&nbsp;Regal&nbsp;Park<br /><br /><font size="3">📍</font>&nbsp;ट्रेनिंग&nbsp;सेंटर:&nbsp;सीकर&nbsp;(राजस्थान)<br /><br /><font size="3">🌐</font>&nbsp;अधिक&nbsp;जानकारी&nbsp;के&nbsp;लिए&nbsp;विजिट&nbsp;करें:&nbsp;<a target="_blank" rel="noopener noreferrer" style="color:#0645AD !important" title="http://www.focalyt.com" href="http://www.focalyt.com">www.focalyt.com</a><br /><br /><font size="3">🎯</font>&nbsp;सीट्स&nbsp;लिमिटेड&nbsp;हैं!&nbsp;आज&nbsp;ही&nbsp;एडमिशन&nbsp;लें&nbsp;और&nbsp;होटल&nbsp;इंडस्ट्री&nbsp;में&nbsp;चमकदार&nbsp;करियर&nbsp;बनाएं।</span><span class="messageTime text-message-time" id="time_0" style="margin-top: 12px;">12:31 PM<img src="/styles/icons/double-tick-blue.svg" style="margin-left: 5px; margin-bottom: 2px;" /></span></pre>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div class="counselor-msg-container">
//                                                     <div class="chatgroupdate"><span>04/07/2025</span></div>
//                                                     <div class="counselor-msg-1 counselor-msg macro">
//                                                         <div class="text text-r">
//                                                             <div class="d-flex">
//                                                                 <pre
//                                                                     class="text-message"><span class="message-header-name student-messages">Mr. Parveen Bansal </span><br /><span class=""><h6>Hello</h6></span><span class="messageTime text-message-time" id="time_1" style="margin-top: 7px;">04:28 PM<img src="/styles/icons/double-tick.svg" style="margin-left: 5px; margin-bottom: 2px;" /></span></pre>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div class="sessionExpiredMsg"><span>Your session has come to end. It
//                                                     will start once you receive a WhatsApp from the
//                                                     lead.<br />Meanwhile, you can send a Business Initiated Messages
//                                                     (BIM).</span></div>
//                                             </ul>
//                                         </section>
//                                         <section class="footer-container">
//                                             <div class="footer-box">
//                                                 <div class="message-container" style="height: 36px; max-height: 128px;">
//                                                     <textarea placeholder="Choose a template"
//                                                         class="disabled-style message-input" disabled="" rows="1"
//                                                         id="message-input"
//                                                         style="height: 36px; max-height: 128px; padding-top: 8px; padding-bottom: 5px; margin-bottom:5px;"></textarea>
//                                                     <div tabindex="0" style="position: relative;"></div>
//                                                 </div>
//                                                 <hr class="divider" />
//                                                 <div class="message-container-input">
//                                                     <div class="left-footer"><span
//                                                         class="disabled-style margin-bottom-5" disabled=""
//                                                         id="whatsapp-emoji"><a class="margin-right-10 margin-"
//                                                             href="#" title="Emoji"><img
//                                                                 src="/public_assets/images/whatapp/emoji-whatsapp.svg"
//                                                                 alt="Emoji" /></a></span>
//                                                         <span class="disabled-style"
//                                                             disabled="" id="fileUpload"><a><input name="fileUpload"
//                                                                 input type="file" title="Attach File"
//                                                                 class="fileUploadIcon" /></a></span><span
//                                                                     class="input-template"><a title="Whatsapp Template"><img
//                                                                         src="/public_assets/images/whatapp/orange-template-whatsapp.svg"
//                                                                         alt="Whatsapp Template" /></a></span></div>
//                                                     <div class="right-footer"><span class="disabled-style"
//                                                         disabled=""><a class="send-button" href="#"
//                                                             title="Send"><img class="send-img"
//                                                                 src="/public_assets/images/whatapp/paper-plane.svg"
//                                                                 alt="Send" /></a></span></div>

//                                                 </div>
//                                             </div>
//                                         </section>
//                                     </div>

//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//             <input type="hidden" id="candidate-id" value="">
//                 {/* <!--Assign/Due modal start--> */}
//                 <div class="modal fade" id="courseAssignModal" tabindex="-1" role="dialog"
//                     aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
//                     <div class="modal-dialog modal-dialog-centered" role="document">
//                         <div class="modal-content">
//                             <div class="modal-header">
//                                 <h5 class="modal-title text-white text-uppercase" id="exampleModalLongTitle">Assign Course
//                                 </h5>
//                                 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//                                     <span aria-hidden="true">&times;</span>
//                                 </button>
//                             </div>
//                             <div class="modal-body pt-1">
//                                 <div class="row">
//                                     <div class="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
//                                         <label>Date</label>
//                                         <input class="form-control text-capitalize" type="date" value="" id="assignDate" />
//                                     </div>
//                                     <div class="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
//                                         <label>Course URL</label>
//                                         <input class="form-control text-capitalize" type="text" value="courseURL"
//                                             id="courseURL" />
//                                     </div>
//                                     <div class="col-xl-12 mb-1 text-left">
//                                         <label>Remarks</label>
//                                         <textarea class="form-control" cols="5" value="courseRemarks" rows="3"
//                                             id="courseRemarks"></textarea>
//                                     </div>
//                                 </div>
//                                 <p class="text-success font-weight-bolder" id="successMsg" style="display: none;"></p>
//                                 <p class="text-danger font-weight-bolder" id="errorMsg" style="display: none;"></p>
//                             </div>
//                             <div class="modal-footer">
//                                 <button type="submit" class="btn btn-primary">Assigned</button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </>
//             );
// };

// export default CandidateManagementPortal;