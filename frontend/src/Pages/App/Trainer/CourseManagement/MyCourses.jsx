import React, { useState } from 'react';
import { Link } from 'react-router-dom'
function MyCourses() {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  
    const courses = [
        {
            id: 1,
            title: "Artificial Intelligence & Machine Learning",
            description: "Complete AI/ML course with hands-on projects",
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500",
            students: 45,
            lessons: 28,
            duration: "3 Months",
            status: "Active",
            progress: 75,
            category: "AI"
        },
        {
            id: 2,
            title: "Robotics Fundamentals",
            description: "Learn robotics from basics to advanced concepts",
            image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500",
            students: 32,
            lessons: 20,
            duration: "2 Months",
            status: "Active",
            progress: 60,
            category: "Robotics"
        },
        {
            id: 3,
            title: "Python Programming Masterclass",
            description: "Master Python programming with real-world projects",
            image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500",
            students: 58,
            lessons: 35,
            duration: "4 Months",
            status: "Active",
            progress: 90,
            category: "Programming"
        },
        {
            id: 4,
            title: "Web Development Bootcamp",
            description: "Full-stack web development with MERN stack",
            image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
            students: 42,
            lessons: 30,
            duration: "3 Months",
            status: "Draft",
            progress: 30,
            category: "Web Dev"
        },
        {
            id: 5,
            title: "IoT & Smart Devices",
            description: "Internet of Things and smart device programming",
            image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500",
            students: 28,
            lessons: 22,
            duration: "2 Months",
            status: "Active",
            progress: 50,
            category: "IoT"
        },
        {
            id: 6,
            title: "Data Science with R",
            description: "Complete data science course using R programming",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500",
            students: 35,
            lessons: 25,
            duration: "3 Months",
            status: "Inactive",
            progress: 0,
            category: "Data Science"
        }
    ];

    const getStatusBadge = (status) => {
        const badges = {
            
        };
        return badges[status] || 'primary';
    };

    return (
        <>
            <div className="my-courses-container">
                {/* Header Section */}
                <div className="content-header row mb-4">
                    <div className="content-header-left col-md-9 col-12 mb-2">
                        <div className="row breadcrumbs-top">
                            <div className="col-12">
                                <h2 className="content-header-title float-left mb-0">
                                    <i className="feather icon-book-open mr-2"></i>
                                    My Courses
                                </h2>
                                <div className="breadcrumb-wrapper col-12">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">
                                            <a href="/trainer/dashboard">Home</a>
                                        </li>
                                        <li className="breadcrumb-item active">My Courses</li>
                                    </ol>
                                </div>
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
                                        <h3 className="fw-bolder mb-1">{courses.length}</h3>
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
                                            {courses.filter(c => c.status === 'Active').length}
                                        </h3>
                                        <p className="card-text mb-0">Active Courses</p>
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
                    
                </div>

                {/* Filter & View Toggle */}
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body py-2">
                                <div className="row align-items-center">
                                  
                                    <div className="col-md-6 col-12">
                                        <div className="d-flex justify-content-end align-items-center">
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm mr-2" 
                                                placeholder="Search courses..."
                                                style={{maxWidth: '200px'}}
                                            />
                                            <div className="btn-group btn-group-sm" role="group">
                                                <button 
                                                    type="button" 
                                                    className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => setViewMode('grid')}
                                                >
                                                    <i className="feather icon-grid"></i>
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => setViewMode('list')}
                                                >
                                                    <i className="feather icon-list"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid View */}
                {viewMode === 'grid' && (
                    <div className="row">
                        {courses.map((course) => (
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
                                            <p className="course-fee">Rs: 100</p>
                                            <p className="course-duration">3 Months</p>
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

                                        <div className="d-flex justify-content-between">
                                            <Link to="" className="btn btn-sm btn-outline-primary">
                                                <i className="feather icon-eye mr-1"></i>
                                                View
                                            </Link>                                           
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Students</th>
                                                    <th>Lessons</th>
                                                    <th>Duration</th>
                                                    <th>Progress</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courses.map((course) => (
                                                    <tr key={course.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <img 
                                                                    src={course.image} 
                                                                    alt={course.title}
                                                                    className="rounded mr-3"
                                                                    style={{width: '60px', height: '60px', objectFit: 'cover'}}
                                                                />
                                                                <div>
                                                                    <h6 className="mb-0">{course.title}</h6>
                                                                    <small className="text-muted">{course.category}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <i className="feather icon-users text-primary mr-1"></i>
                                                            {course.students}
                                                        </td>
                                                        <td className="align-middle">
                                                            <i className="feather icon-file-text text-info mr-1"></i>
                                                            {course.lessons}
                                                        </td>
                                                        <td className="align-middle">{course.duration}</td>
                                                        <td className="align-middle">
                                                            <div className="d-flex align-items-center">
                                                                <div className="progress flex-grow-1 mr-2" style={{height: '8px'}}>
                                                                    <div 
                                                                        className="progress-bar bg-primary" 
                                                                        style={{width: `${course.progress}%`}}
                                                                    ></div>
                                                                </div>
                                                                <small className="font-weight-bold">{course.progress}%</small>
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <span className={`badge badge-${getStatusBadge(course.status)}`}>
                                                              
                                                            </span>
                                                        </td>
                                                        <td className="align-middle">
                                                            <div className="btn-group btn-group-sm">
                                                                <button className="btn btn-outline-primary">
                                                                    <i className="feather icon-eye"></i>
                                                                </button>
                                                              
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
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

                .courseCategory .course-fee {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fc2b5a;
                    margin: 0;
                }

                .courseCategory .course-duration {
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
            `}</style>
        </>
    );
}

export default MyCourses;