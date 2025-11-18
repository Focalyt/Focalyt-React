import React, { useState , useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'
function MyCourses() {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [trainersData, setTrainersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = JSON.parse(sessionStorage.getItem('token'))
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const centerId = searchParams.get('centerId');
    const centerName = searchParams.get('centerName');


    useEffect(()=>{
        console.log("fetching courses")
        fetchassignedtrainers()
    },[])
    const fetchassignedtrainers = async () =>{
        setLoading(true);
        try{
            const res = await axios.get(`${backendUrl}/college/gettrainersbycourse`, {
                params: { centerId: centerId },
                headers: {
                    'x-auth': token
                }
            }) 
            console.log('res' , res)
            if(res.data && res.data.status && res.data.data){
                setTrainersData(res.data.data);
            }
        }
        catch(err){
            console.log(err)
        }
        finally{
            setLoading(false);
        }
    }

    const getCoursesFromTrainers = () => {
        const allCourses = [];
        trainersData.forEach(trainer => {
            if(trainer.assignedCourses && trainer.assignedCourses.length > 0){
                trainer.assignedCourses.forEach(course => {
                    allCourses.push({
                        id: course._id,
                        title: course.name,
                        image: course.image || "/Assets/images/logo/logo.png",
                        trainerName: trainer.name,
                        trainerId: trainer._id,
                        center: course.center
                    });
                });
            }
        });
        return allCourses;
    };


    const courses = getCoursesFromTrainers();

    const getStatusBadge = (status) => {
        const badges = {
            'Active': 'success',
            'Inactive': 'secondary',
            'Draft': 'warning'
        };
        return badges[status] || 'primary';
    };

    return (
        <>
            <div className="my-courses-container">
                {/* Header Section */}
                <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="d-flex align-items-center mb-2">
                                
                                <button
                                    onClick={() => navigate(-1)}
                                    className="btn btn-sm btn-outline-secondary me-3"
                                    style={{borderRadius: 'inherit'}}
                                >
                                    <i className="feather icon-arrow-left me-1"></i> Back to Centers
                                </button>
                                <h2 className="mb-0">Course Management</h2>
                            </div>
                            {centerName && (
                                <p className="text-muted mb-0">
                                    <i className="fas fa-building me-1 text-primary"></i>
                                    Center: <strong>{decodeURIComponent(centerName)}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
                {/* Stats Cards */}
                <div className="row match-height mb-4">
                    <div className="col-xl-3 col-md-6 col-12">
                        <div className="card stats-card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="fw-bolder mb-1">
                                            {loading ? (
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            ) : (
                                                courses.length
                                            )}
                                        </h3>
                                        <p className="card-text mb-0">Total Courses</p>
                                    </div>
                                    <div className="avatar bg-light-primary p-2">
                                        <div className="avatar-content">
                                            <i className="feather icon-book font-medium-5"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 col-12">
                        <div className="card stats-card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="fw-bolder mb-1">
                                            {loading ? (
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            ) : (
                                                courses.length
                                            )}
                                        </h3>
                                        <p className="card-text mb-0">Assigned Courses</p>
                                    </div>
                                    <div className="avatar bg-light-success p-2">
                                        <div className="avatar-content">
                                            <i className="feather icon-check-circle font-medium-5"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 col-12">
                        <div className="card stats-card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="fw-bolder mb-1">
                                            {loading ? (
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            ) : (
                                                trainersData.length
                                            )}
                                        </h3>
                                        <p className="card-text mb-0">Total Trainers</p>
                                    </div>
                                    <div className="avatar bg-light-info p-2">
                                        <div className="avatar-content">
                                            <i className="feather icon-users font-medium-5"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 col-12">
                        <div className="card stats-card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="fw-bolder mb-1">
                                            {loading ? (
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            ) : (
                                                new Set(courses.map(c => c.trainerId)).size
                                            )}
                                        </h3>
                                        <p className="card-text mb-0">Unique Trainers</p>
                                    </div>
                                    <div className="avatar bg-light-warning p-2">
                                        <div className="avatar-content">
                                            <i className="feather icon-user-check font-medium-5"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & View Toggle */}
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="search-container">
                            <div className="row align-items-center justify-content-end">
                                <div className="col-md-6 col-12">
                                    <div className="d-flex justify-content-end align-items-center">
                                        <input
                                            type="text"
                                            className="search-input mr-2"
                                            placeholder="Search courses..."
                                        />
                                        <button className="search-button">
                                            <i className="fas fa-search"></i>
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2">Loading courses...</p>
                    </div>
                )}

                {/* Grid View */}
                {!loading && viewMode === 'grid' && (
                    <div className="row">
                        {courses.length === 0 ? (
                            <div className="col-12 text-center py-5">
                                <p className="text-muted">No courses found</p>
                            </div>
                        ) : (
                            courses.map((course) => (
                            <div className="col-xl-4 col-md-6 col-12 mb-4" key={course.id}>
                                <div className="card course-card">
                                    <div className="card-img-top-wrapper">
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            className="card-img-top"
                                        />

                                        <div className="courseCategory">
                                            <p className='courseType'>FFTl</p>
                                            <div className='coursedes'>
                                                <p className="course-trainer">Trainer: {course.trainerName}</p>
                                            </div>

                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title course-title">
                                            {course.title}
                                        </h5>
                                        <p className="card-text text-muted course-description">
                                            {course.description}
                                        </p>

                                        {course.center && (
                                            <div className="mb-2">
                                                <small className="text-muted">
                                                    <i className="fas fa-building me-1 text-primary"></i>
                                                    <strong>Center:</strong> {course.center.name}
                                                </small>
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-between">
                                            <Link to={`/trainer/batchmanagement?courseId=${course.id}`} className="btn btn-sm btn-outline-primary">
                                                <i className="feather icon-eye mr-1"></i>
                                                View 
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                )}

                {/* List View */}
                {!loading && viewMode === 'list' && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Trainer</th>
                                                    <th>Course ID</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center py-4">
                                                            <p className="text-muted mb-0">No courses found</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    courses.map((course) => (
                                                    <tr key={course.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <img
                                                                    src={course.image}
                                                                    alt={course.title}
                                                                    className="rounded mr-3"
                                                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                                />
                                                                <div>
                                                                    <h6 className="mb-0">{course.title}</h6>
                                                                    <small className="text-muted d-block">{course.description}</small>
                                                                    {course.center && (
                                                                        <small className="text-primary d-block mt-1">
                                                                            <i className="fas fa-building me-1"></i>
                                                                            {course.center.name}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <i className="feather icon-user text-primary mr-1"></i>
                                                            {course.trainerName}
                                                        </td>
                                                        <td className="align-middle">
                                                            <code>{course.id}</code>
                                                        </td>
                                                        <td className="align-middle">
                                                            <div className="btn-group btn-group-sm">
                                                                <Link to={`/trainer/batchmanagement?courseId=${course.id}`} className="btn btn-outline-primary">
                                                                    <i className="feather icon-eye"></i> View Batches
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </div>

            {/* Custom CSS */}
            <style jsx>{`
                .my-courses-container {
                    padding: 0;
                }

                /* Stats Cards */
                .stats-card {
                    transition: all 0.3s ease;
                    border: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }

                .stats-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                }

                .avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bg-light-primary {
                    background-color: rgba(252, 43, 90, 0.12) !important;
                    color: #fc2b5a;
                }

                .bg-light-success {
                    background-color: rgba(40, 199, 111, 0.12) !important;
                    color: #28c76f;
                }

                .bg-light-info {
                    background-color: rgba(0, 207, 232, 0.12) !important;
                    color: #00cfe8;
                }

                .bg-light-warning {
                    background-color: rgba(255, 159, 67, 0.12) !important;
                    color: #ff9f43;
                }

                /* Course Card */
                .course-card {
                    transition: all 0.3s ease;
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
                    overflow: hidden;
                    padding: 0;
                    background: #fff;
                }

                .course-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }

                .card-img-top-wrapper {
                    position: relative;
                    overflow: hidden;
                    height: 180px;
                }

                .card-img-top {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .course-card:hover .card-img-top {
                    transform: scale(1.1);
                }

                .course-status-badge {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    padding: 5px 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .course-category-badge {
                    position: absolute;
                    bottom: 15px;
                    left: 15px;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #fc2b5a;
                }

                
                .courseCategory {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
                    color: white;
                    padding: 15px 12px 10px 12px;
                    transform: translateY(100%);
                    transition: transform 0.3s ease-in-out;
                    backdrop-filter: blur(8px);
                }

                .courseCategory p {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                }

                .courseCategory .courseType {
                    color: white;
                    font-weight: 600;
                    margin-bottom: 5px;
                    font-size: 12px;
                }

                .courseCategory .coursedes {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .courseCategory .course-trainer {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fc2b5a;
                    margin: 0;
                }

                .courseCategory .course-id {
                    font-size: 11px;
                    opacity: 0.9;
                    margin: 0;
                }

                .course-card:hover .courseCategory {
                    transform: translateY(0);
                }

                .course-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #2c2c2c;
                    margin-bottom: 8px;
                    line-height: 1.3;
                    height: 2.6em;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .course-description {
                    font-size: 0.8rem;
                    line-height: 1.4;
                    height: 2.8em;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    margin-bottom: 12px;
                    color: #6c757d;
                }

                .course-stats {
                    margin-bottom: 10px;
                }

                .course-stats i {
                    font-size: 12px;
                }

                /* Card Body Padding */
                .course-card .card-body {
                    padding: 16px 18px 18px 18px;
                }

                /* Buttons */
                .btn-sm {
                    font-size: 0.75rem;
                    padding: 0.35rem 0.7rem;
                    border-radius: 20px;
                    font-weight: 600;
                }

                .btn-outline-primary:hover {
                    background-color: #fc2b5a;
                    border-color: #fc2b5a;
                    color: white;
                }

                .btn-outline-info:hover {
                    background-color: #00cfe8;
                    border-color: #00cfe8;
                    color: white;
                }

                .btn-outline-danger:hover {
                    background-color: #ea5455;
                    border-color: #ea5455;
                    color: white;
                }

                /* Progress Bar */
                .progress {
                    background-color: #f0f0f0;
                    border-radius: 8px;
                    height: 6px;
                    margin-bottom: 12px;
                }

                .progress-bar {
                    background-color: #fc2b5a !important;
                    border-radius: 8px;
                    transition: width 0.3s ease;
                }

                /* List View Table */
                .table thead th {
                    background-color: #f8f8f8;
                    color: #5e5873;
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-top: none;
                    padding: 1rem;
                }

                .table tbody tr {
                    transition: all 0.2s ease;
                }

                .table tbody tr:hover {
                    background-color: #f8f9fa;
                    transform: scale(1.01);
                }

                .table td {
                    vertical-align: middle;
                    padding: 1rem;
                }

                /* Badges */
                .badge {
                    padding: 5px 12px;
                    font-weight: 600;
                    font-size: 0.75rem;
                }

                /* Pagination */
                .pagination .page-link {
                    color: #fc2b5a;
                    border: 1px solid #ddd;
                    margin: 0 3px;
                    border-radius: 5px;
                }

                .pagination .page-item.active .page-link {
                    background-color: #fc2b5a;
                    border-color: #fc2b5a;
                }

                .pagination .page-link:hover {
                    background-color: #fc2b5a;
                    border-color: #fc2b5a;
                    color: white;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .course-title {
                        font-size: 1rem;
                    }

                    .btn-sm {
                        font-size: 0.7rem;
                        padding: 0.3rem 0.6rem;
                    }

                    .stats-card {
                        margin-bottom: 1rem;
                    }
                }

                /* Feather Icons */
                .feather {
                    width: 18px;
                    height: 18px;
                    vertical-align: middle;
                }

                .font-medium-5 {
                    font-size: 1.5rem;
                }

                /* Content Header */
                .content-header-title {
                    color: #2c2c2c;
                    font-weight: 600;
                }

                /* Custom Scrollbar */
                .table-responsive::-webkit-scrollbar {
                    height: 6px;
                }

                .table-responsive::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }

                .table-responsive::-webkit-scrollbar-thumb {
                    background: #fc2b5a;
                    border-radius: 10px;
                }

                .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #e0204f;
                }

                /* Search Component Styling */
                .search-container {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    padding: 12px 16px;
                    border: 1px solid #e9ecef;
                }

                .search-input {
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: #fff;
                    color: #374151;
                    max-width: 200px;
                    border-top-right-radius: 0px;
                    border-bottom-right-radius: 0px;
                }

                .search-input::placeholder {
                    color: #9ca3af;
                    font-size: 14px;
                }

                .search-button {
                    background: #fff;
                    border: 1px solid #3b82f6;
                    border-radius: 6px;
                    color: #3b82f6;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-top-left-radius: 0px;
                    border-bottom-left-radius: 0px
                }

                .search-button:hover {
                    background: #3b82f6;
                    color: #fff;
                }

                .search-button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
                }

                .search-button i {
                    font-size: 14px;
                }

                /* Responsive search styling */
                @media (max-width: 768px) {
                    .search-input {
                        max-width: 150px;
                        font-size: 13px;
                    }
                    
                    .search-button {
                        padding: 8px 12px;
                        font-size: 13px;
                    }
                }

                @media (max-width: 576px) {
                    .search-container .d-flex {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .search-input {
                        max-width: 100%;
                    }
                    
                    .search-button {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </>
    );
}

export default MyCourses;