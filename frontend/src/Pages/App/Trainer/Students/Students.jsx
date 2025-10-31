import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { X, Upload, FileText, Image, Video, Calendar, Users, User, Send, Plus, Trash2 } from 'lucide-react';

function Students() {
    const [loading, setLoadingData] = useState(true);
    const [allProfiles, setAllProfiles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab] = useState('batchFreeze');
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearchQuery, setAppliedSearchQuery] = useState(''); 
    const [batchFreezeCount, setBatchFreezeCount] = useState(0);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchName, setBatchName] = useState('');
    const [courseId, setCourseId] = useState('');
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showDailyDiaryModal, setShowDailyDiaryModal] = useState(false);
    const [attendanceData, setAttendanceData] = useState({});
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [loadingDailyDiary, setLoadingDailyDiary] = useState(false);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = JSON.parse(sessionStorage.getItem('token'));
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const batchId = searchParams.get('batchId');
    const batchNameParam = searchParams.get('batchName');
    const courseIdParam = searchParams.get('courseId');

    //  Daily Diary State
    const [sendTo, setSendTo] = useState("all");
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [assignmentDetail, setAssignmentDetail] = useState("");
    const [studyMaterials, setStudyMaterials] = useState([]);
    const [projectVideos, setProjectVideos] = useState([]);

  

    const handleFileUpload = (type, e) => {
        const files = Array.from(e.target.files);
        if (type === 'study') {
            // Store actual file objects, not just metadata
            setStudyMaterials([...studyMaterials, ...files]);
        } else if (type === 'video') {
            // Store actual file objects, not just metadata
            setProjectVideos([...projectVideos, ...files]);
        }
    };

    const removeFile = (type, index) => {
        if (type === 'study') {
            setStudyMaterials(studyMaterials.filter((_, i) => i !== index));
        } else if (type === 'video') {
            setProjectVideos(projectVideos.filter((_, i) => i !== index));
        }
    };

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSend = () => {
        handleDailyDiary();
    };

    useEffect(() => {
        if (batchId) {
            setSelectedBatch({ _id: batchId });
            setBatchName(decodeURIComponent(batchNameParam || 'Batch'));
            if (courseIdParam) {
                setCourseId(courseIdParam);
            }
        }
    }, [batchId, batchNameParam, courseIdParam]);

    useEffect(() => {
        if (batchId) {
            fetchProfileData();
        }
    }, [batchId, currentPage, activeTab, appliedSearchQuery]);

    const fetchProfileData = async () => {
        try {
            setLoadingData(true);
            if (!token) {
                console.warn("No token found in session storage.");
                setLoadingData(false);
                return;
            }

            // Build query parameters
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '50',
                status: activeTab,
            });

            // Add search query
            if (appliedSearchQuery.trim()) {
                queryParams.append('search', appliedSearchQuery.trim());
            }

            const response = await axios.get(
                `${backendUrl}/college/traineradmission-list/${batchId}?${queryParams.toString()}`,
                {
                    headers: {
                        "x-auth": token,
                    },
                }
            );

            if (response.data.success && response.data.data) {
                console.log('response.data.data', response.data.data);
                setAllProfiles(response.data.data);
                setTotalPages(response.data.totalPages);

                // Update batch freeze count if available
                if (response.data.filterCounts) {
                    setBatchFreezeCount(response.data.filterCounts.batchFreeze || 0);
                }
            } else {
                console.error("Failed to fetch profile data", response.data.message);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleDailyDiary = async () => {
        try {
            if (sendTo === 'individual' && selectedStudents.length === 0) {
                alert('Please select at least one student');
                return;
            }

            // Add validation for assignment detail
            if (!assignmentDetail.trim()) {
                alert('Please enter assignment details');
                return;
            }

            setLoadingDailyDiary(true);

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('batch', batchId);
            formData.append('course', courseId);
            formData.append('sendTo', sendTo);
            formData.append('assignmentDetail', assignmentDetail);
            
            // Add selected students as JSON string
            if (sendTo === 'individual' && selectedStudents.length > 0) {
                formData.append('selectedStudents', JSON.stringify(selectedStudents));
            }

            // Add study materials files
            studyMaterials.forEach((file) => {
                formData.append('studyMaterials', file);
            });

            // Add project video files
            projectVideos.forEach((file) => {
                formData.append('projectVideos', file);
            });

            const response = await axios.post(
                `${backendUrl}/college/addDailyDiary`, 
                formData,
                {
                    headers: {
                        "x-auth": token,
                    },
                }
            );
            
            if (response.data.status) {
                alert(response.data.message);
                setAssignmentDetail('');
                setStudyMaterials([]);
                setProjectVideos([]);
                setSelectedStudents([]);
                setSendTo('all');
                setShowDailyDiaryModal(false);
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error adding daily diary:", error);
            alert(error.response?.data?.message || 'Error adding daily diary');
        } finally {
            setLoadingDailyDiary(false);
        }
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchButtonClick = () => {
        setAppliedSearchQuery(searchQuery);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setAppliedSearchQuery('');
        setCurrentPage(1);
    };

    const handleDailyDiaryManagement = () => {
        setShowDailyDiaryModal(true);
    };

    const handleAttendanceManagement = () => {
        setShowAttendanceModal(true);
    };

    const fetchAttendanceData = async () => {
        try {
            setLoadingAttendance(true);
            if (!batchId) return;

            const response = await axios.get(
                `${backendUrl}/college/getattendancebybatch/${batchId}`,
                {
                    headers: {
                        "x-auth": token,
                    },
                }
            );

            if (response.data.success) {
                setAttendanceData(response.data.data || {});
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const markAttendance = async (studentId, status) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.post(
                `${backendUrl}/college/trainer/mark-attendance`,
                {
                    appliedCourseId: studentId,
                    date: today,
                    status: status,
                    period: 'regularPeriod',
                    remarks: ''
                },
                {
                    headers: {
                        "x-auth": token,
                    },
                }
            );

            if (response.data.status) {
                alert(response.data.message );
                fetchProfileData();
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error marking attendance:", error);
            alert(error.response?.data?.message);
        }
    };

    const getAttendanceStatus = (studentId, date) => {
        const today = new Date().toISOString().split('T')[0];
        const studentAttendance = attendanceData[studentId];
        if (!studentAttendance) return { status: 'not-marked', symbol: '-', class: 'not-marked' };

        const dayAttendance = studentAttendance[today];
        if (!dayAttendance) return { status: 'not-marked', symbol: '-', class: 'not-marked' };

        const status = dayAttendance.status?.toLowerCase();
        const statusMap = {
            'present': { symbol: 'P', class: 'present' },
            'absent': { symbol: 'A', class: 'absent' },
        };

        return statusMap[status] || { status: 'not-marked', symbol: '-', class: 'not-marked' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (profile) => {
        if (profile.dropout) {
            return <span className="badge bg-danger">Dropout</span>;
        }
        if (profile.isBatchFreeze) {
            return <span className="badge bg-warning">Batch Freeze</span>;
        }
        if (profile.isZeroPeriodAssigned) {
            return <span className="badge bg-info">Zero Period</span>;
        }
        if (profile.admissionDone) {
            return <span className="badge bg-success">Admitted</span>;
        }
        return <span className="badge bg-secondary">Unknown</span>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="d-flex align-items-center mb-2">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="btn btn-sm btn-outline-secondary me-3"
                                >
                                    <i className="feather icon-arrow-left me-1"></i> Back to Batches
                                </button>
                                <h2 className="mb-0">Student Management</h2>
                            </div>
                            <p className="text-muted mb-0">
                                <i className="fas fa-layer-group me-1"></i>
                                Batch: <strong>{batchName}</strong>
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate(`/trainer/createassignment?batchId=${batchId}&batchName=${encodeURIComponent(batchName)}&courseId=${courseId}`)}
                            >
                                <i className="fas fa-sync-alt me-1"></i> Create Assignment
                            </button>
                            <button className="btn btn-primary" onClick={handleDailyDiaryManagement}>
                                Daily Diary
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleAttendanceManagement}
                            >
                                <i className="fas fa-calendar-check me-1"></i> Attendance
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Card - Batch Freeze Only */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card bg-warning text-white border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="card-title mb-1">
                                        <i className="fas fa-snowflake me-2"></i>
                                        Batch Freeze Students
                                    </h2>
                                    <p className="card-text mb-0 opacity-75">
                                        Students with frozen batch status in {batchName}
                                    </p>
                                </div>
                                <div className="text-end">
                                    <h1 className="display-3 mb-0 fw-bold">{batchFreezeCount}</h1>
                                    <p className="mb-0 small">Total Students</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search students by name, email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="btn btn-outline-secondary"
                                onClick={handleClearSearch}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                        <button
                            className="btn btn-outline-primary"
                            onClick={handleSearchButtonClick}
                        >
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    {allProfiles.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h4 className="text-muted">No students found</h4>
                            <p className="text-muted">
                                {appliedSearchQuery
                                    ? `No results for "${appliedSearchQuery}". Try adjusting your search`
                                    : 'No students have been enrolled in this batch yet'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>S.No</th>
                                        <th>Student Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Course</th>
                                        <th>Center</th>
                                        <th>Registered Date</th>
                                        <th>Today's Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProfiles.map((profile, index) => (
                                        <tr key={profile._id}>
                                            <td className="align-middle">
                                                {(currentPage - 1) * 50 + index + 1}
                                            </td>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-circle me-2">
                                                        {profile._candidate?.name ? (
                                                            profile._candidate.name.charAt(0).toUpperCase()
                                                        ) : 'N'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">
                                                            {profile._candidate?.name || 'N/A'}
                                                        </div>
                                                        {profile._candidate?.fatherName && (
                                                            <small className="text-muted">
                                                                S/O: {profile._candidate.fatherName}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                {profile._candidate?.email || 'N/A'}
                                            </td>
                                            <td className="align-middle">
                                                {profile._candidate?.mobile || 'N/A'}
                                            </td>
                                            <td className="align-middle">
                                                {profile._course?.name || 'N/A'}
                                            </td>
                                            <td className="align-middle">
                                                {profile._center?.name || 'N/A'}
                                            </td>
                                            <td className="align-middle">
                                                {formatDate(profile.createdAt)}
                                            </td>
                                            <td className="align-middle">
                                                <div className="d-flex gap-1 mb-1">
                                                    <button
                                                        className={`btn btn-sm ${getAttendanceStatus(profile._id).class === 'present' ? 'btn-success' : getAttendanceStatus(profile._id).class === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                                                        // onClick={() => markAttendance(profile._id, 'Present')}
                                                        title="Mark Present"
                                                    >
                                                        P
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${getAttendanceStatus(profile._id).class === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                                        // onClick={() => markAttendance(profile._id, 'Absent')}
                                                        title="Mark Absent"
                                                    >
                                                        A
                                                    </button>
                                                </div>
                                                <small className="text-muted">
                                                    Status: {getAttendanceStatus(profile._id).symbol}
                                                </small>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="fas fa-chevron-left"></i> Previous
                                    </button>
                                </li>

                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                                    ) {
                                        return (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    } else if (
                                        pageNum === currentPage - 3 ||
                                        pageNum === currentPage + 3
                                    ) {
                                        return (
                                            <li key={pageNum} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}

                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next <i className="fas fa-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        <p className="text-center text-muted">
                            Page {currentPage} of {totalPages} | Showing {allProfiles.length} students
                        </p>
                    </div>
                </div>
            )}

            <style>
                {
                    `

.nav-tabs {
    border-bottom: 2px solid #dee2e6;
}

.nav-tabs .nav-link {
    color: #6c757d;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
    color: #0d6efd;
    border-color: transparent;
    background-color: rgba(13, 110, 253, 0.1);
}

.nav-tabs .nav-link.active {
    color: #0d6efd;
    background-color: transparent;
    border-color: transparent transparent #0d6efd;
    font-weight: 600;
}

.table thead th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
    color: #6c757d;
    border-bottom: 2px solid #dee2e6;
    padding: 1rem;
}

.table tbody td {
    padding: 1rem;
    vertical-align: middle;
}

.table-hover tbody tr:hover {
    background-color: rgba(13, 110, 253, 0.05);
    cursor: pointer;
}

.avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
    flex-shrink: 0;
}

.card {
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.btn-group-sm .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
}

.input-group-text {
    background-color: #f8f9fa;
    border-right: none;
}

.input-group .form-control {
    border-left: none;
}

.input-group .form-control:focus {
    border-color: #ced4da;
    box-shadow: none;
}

.badge {
    padding: 0.35rem 0.65rem;
    font-weight: 500;
    font-size: 0.75rem;
}

.pagination {
    margin-bottom: 0;
}

.page-link {
    color: #6c757d;
    border: 1px solid #dee2e6;
    margin: 0 2px;
    border-radius: 4px;
}

.page-link:hover {
    color: #0d6efd;
    background-color: rgba(13, 110, 253, 0.1);
    border-color: #0d6efd;
}

.page-item.active .page-link {
    background-color: #0d6efd;
    border-color: #0d6efd;
}

.page-item.disabled .page-link {
    color: #adb5bd;
    background-color: #fff;
    border-color: #dee2e6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .table {
        font-size: 0.875rem;
    }
    
    .avatar-circle {
        width: 32px;
        height: 32px;
        font-size: 0.9rem;
    }
    
    .nav-tabs .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }
    
    .card-body {
        padding: 1rem;
    }
}

/* Loading spinner animation */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner-border {
    animation: spin 1s linear infinite;
}


                    `
                }
            </style>
            {/* Attendance Management Modal */}
            {showAttendanceModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-calendar-check me-2"></i>
                                    Attendance Management - {batchName}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowAttendanceModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {loadingAttendance ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading attendance...</span>
                                        </div>
                                        <p className="mt-2">Loading attendance data...</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead className="bg-primary text-white">
                                                <tr>
                                                    <th>S.No</th>
                                                    <th>Student Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Today's Date</th>
                                                    <th>Attendance Status</th>
                                                    <th>Mark Attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allProfiles.map((profile, index) => (
                                                    <tr key={profile._id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar-circle me-2">
                                                                    {profile._candidate?.name ? (
                                                                        profile._candidate.name.charAt(0).toUpperCase()
                                                                    ) : 'N'}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold">
                                                                        {profile._candidate?.name || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{profile._candidate?.email || 'N/A'}</td>
                                                        <td>{profile._candidate?.mobile || 'N/A'}</td>
                                                        <td>{new Date().toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`badge ${getAttendanceStatus(profile._id).class === 'present' ? 'bg-success' : getAttendanceStatus(profile._id).class === 'absent' ? 'bg-danger' : 'bg-secondary'}`}>
                                                                {getAttendanceStatus(profile._id).symbol}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className={`btn btn-sm ${getAttendanceStatus(profile._id).class === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                                                                    onClick={() => markAttendance(profile._id, 'Present')}
                                                                >
                                                                    <i className="fas fa-check me-1"></i>Present
                                                                </button>
                                                                <button
                                                                    className={`btn btn-sm ${getAttendanceStatus(profile._id).class === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                                                    onClick={() => markAttendance(profile._id, 'Absent')}
                                                                >
                                                                    <i className="fas fa-times me-1"></i>Absent
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAttendanceModal(false)}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                >
                                    <i className="fas fa-sync-alt me-1"></i>Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDailyDiaryModal && (
          
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    Daily Diary - {batchName}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDailyDiaryModal(false)}></button>
                            </div>

                            <div className="modal-body p-4">
                                {/* Send To Section */}
                                <div className="mb-4 p-3 border rounded bg-light">
                                    <label className="form-label fw-bold d-flex align-items-center">
                                        Send To
                                    </label>
                                    <div className="d-flex gap-3 mb-3">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="sendTo"
                                                id="sendAll"
                                                checked={sendTo === "all"}
                                                onChange={() => setSendTo("all")}
                                            />
                                            <label className="form-check-label" htmlFor="sendAll">
                                                All Students
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="sendTo"
                                                id="sendIndividual"
                                                checked={sendTo === "individual"}
                                                onChange={() => setSendTo("individual")}
                                            />
                                            <label className="form-check-label" htmlFor="sendIndividual">
                                                Individual Students
                                            </label>
                                        </div>
                                    </div>

                                    {sendTo === "individual" && (
                                        <div className="mt-3">
                                            <label className="form-label small text-muted">Select Students:</label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {allProfiles.map(profile => (
                                                    <div
                                                        key={profile._id}
                                                        className={`badge p-2 cursor-pointer ${selectedStudents.includes(profile._id) ? 'bg-primary' : 'bg-secondary'}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleStudentToggle(profile._id)}
                                                    >
                                                        {profile._candidate?.name || 'N/A'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold d-flex align-items-center">
                                        Assignment Detail
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Enter assignment details here..."
                                        value={assignmentDetail}
                                        onChange={(e) => setAssignmentDetail(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold d-flex align-items-center">
                                        Study Material (PDF/Images/Videos) (Optional)
                                    </label>
                                    <div className="border rounded p-3 bg-light">
                                        <input
                                            type="file"
                                            className="form-control mb-3"
                                            multiple
                                            accept=".pdf,image/*,video/*"
                                            onChange={(e) => handleFileUpload('study', e)}
                                        />
                                        {studyMaterials.length > 0 && (
                                            <div className="mt-2">
                                                {studyMaterials.map((file, index) => {
                                                    const isPdf = file.type?.includes('pdf');
                                                    const isImage = file.type?.includes('image');
                                                    const isVideo = file.type?.includes('video');
                                                    const fileSize = file.size ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : '';
                                                    
                                                    return (
                                                        <div key={index} className="d-flex align-items-center justify-content-between bg-white p-2 mb-2 rounded border">
                                                            <span className="small">
                                                                {isPdf && <FileText size={16} className="text-danger me-2" />}
                                                                {isImage && <Image size={16} className="text-primary me-2" />}
                                                                {isVideo && <Video size={16} className="text-success me-2" />}
                                                                {file.name} {fileSize}
                                                            </span>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => removeFile('study', index)}
                                                            >
                                                                <Trash2 size={16} className="text-danger" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Project Videos Section */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold d-flex align-items-center">
                                        <Video size={18} className="me-2" />
                                        Project Videos (Optional)
                                    </label>
                                    <div className="border rounded p-3 bg-light">
                                        <input
                                            type="file"
                                            className="form-control mb-3"
                                            multiple
                                            accept="video/*"
                                            onChange={(e) => handleFileUpload('video', e)}
                                        />
                                        {projectVideos.length > 0 && (
                                            <div className="mt-2">
                                                {projectVideos.map((file, index) => {
                                                    const fileSize = file.size ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : '';
                                                    
                                                    return (
                                                        <div key={index} className="d-flex align-items-center justify-content-between bg-white p-2 mb-2 rounded border">
                                                            <span className="small">
                                                                <Video size={16} className="text-success me-2" />
                                                                {file.name} {fileSize}
                                                            </span>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => removeFile('video', index)}
                                                            >
                                                                <Trash2 size={16} className="text-danger" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="alert alert-info small">
                                    <i className="fas fa-info-circle me-2"></i>
                                    All fields are optional. Fill only what you want to share with students.
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowDailyDiaryModal(false)}
                                    disabled={loadingDailyDiary}
                                >
                                    <X size={18} className="me-1" />
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleSend}
                                    disabled={loadingDailyDiary}
                                >
                                    {loadingDailyDiary ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} className="me-1" />
                                            Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Students;