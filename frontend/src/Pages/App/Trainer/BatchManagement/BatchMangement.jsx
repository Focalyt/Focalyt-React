import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BatchMangement() {
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [trainersData, setTrainersData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courses, setCourses] = useState([]);
    
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = JSON.parse(sessionStorage.getItem('token'));

    useEffect(() => {
        console.log("Fetching trainer batch assignments...");
        fetchTrainerBatchAssignments();
    }, []);

    const fetchTrainerBatchAssignments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/gettrainerswithcoursesandbatches`, {
                headers: {
                    'x-auth': token
                }
            });
            
            console.log('Trainer batch assignments:', response.data);
            
            if (response.data && response.data.status && response.data.data) {
                setTrainersData(response.data.data);
                
                // Extract unique courses for filter
                const uniqueCourses = [];
                response.data.data.forEach(trainer => {
                    trainer.assignedCourses.forEach(course => {
                        if (!uniqueCourses.find(c => c._id === course._id)) {
                            uniqueCourses.push({
                                _id: course._id,
                                name: course.name
                            });
                        }
                    });
                });
                setCourses(uniqueCourses);
            }
        } catch (error) {
            console.error('Error fetching trainer batch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter trainers based on search term and selected course
    const filteredTrainers = trainersData.filter(trainer => {
        const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trainer.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCourse = !selectedCourse || 
                            trainer.assignedCourses.some(course => course._id === selectedCourse);
        
        return matchesSearch && matchesCourse;
    });

    // Get total statistics
    const getTotalStats = () => {
        const totalTrainers = trainersData.length;
        const totalCourses = trainersData.reduce((sum, trainer) => sum + trainer.totalCourses, 0);
        const totalBatches = trainersData.reduce((sum, trainer) => sum + trainer.totalBatches, 0);
        
        return { totalTrainers, totalCourses, totalBatches };
    };

    const stats = getTotalStats();

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
                            <h2 className="mb-1">Batch Management</h2>
                            <p className="text-muted mb-0">Manage trainer assignments to courses and batches</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <i className="fas fa-th"></i> Grid
                            </button>
                            <button
                                className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <i className="fas fa-list"></i> List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="card-title">{stats.totalTrainers}</h4>
                                    <p className="card-text">Total Trainers</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-users fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="card-title">{stats.totalCourses}</h4>
                                    <p className="card-text">Total Course Assignments</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-book fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4 className="card-title">{stats.totalBatches}</h4>
                                    <p className="card-text">Total Batch Assignments</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-layer-group fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search trainers by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                        <option value="">All Courses</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <button
                        className="btn btn-outline-primary w-100"
                        onClick={fetchTrainerBatchAssignments}
                    >
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Trainers List */}
            <div className="row">
                {filteredTrainers.length === 0 ? (
                    <div className="col-12">
                        <div className="text-center py-5">
                            <i className="fas fa-users fa-3x text-muted mb-3"></i>
                            <h4 className="text-muted">No trainers found</h4>
                            <p className="text-muted">Try adjusting your search criteria</p>
                        </div>
                    </div>
                ) : (
                    filteredTrainers.map((trainer, index) => (
                        <div 
                            key={trainer._id} 
                            className={`mb-4 ${viewMode === 'grid' ? 'col-md-6 col-lg-4' : 'col-12'}`}
                        >
                            <div className="card h-100 border rounded shadow-sm">
                                <div className="card-body">
                                    {/* Trainer Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-1">{trainer.name}</h5>
                                            <p className="text-muted mb-1">
                                                <i className="fas fa-envelope me-1"></i>
                                                {trainer.email}
                                            </p>
                                            <p className="text-muted mb-0">
                                                <i className="fas fa-phone me-1"></i>
                                                {trainer.mobile}
                                            </p>
                                        </div>
                                        <div className="text-end">
                                            <span className="badge bg-primary me-1">
                                                {trainer.totalCourses} Courses
                                            </span>
                                            <span className="badge bg-success">
                                                {trainer.totalBatches} Batches
                                            </span>
                                        </div>
                                    </div>

                                    
                                    {trainer.assignedCourses.length > 0 ? (
                                        <div className="mt-3">
                                            <h6 className="text-primary mb-2">
                                                <i className="fas fa-book me-1"></i>
                                                Assigned Courses & Batches
                                            </h6>
                                            {trainer.assignedCourses.map((course, courseIndex) => (
                                                <div key={course._id} className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <h6 className="mb-0 text-dark">{course.name}</h6>
                                                        <span className="badge bg-info">
                                                            {course.batchCount} Batches
                                                        </span>
                                                    </div>
                                                    
                                                    {course.assignedBatches.length > 0 && (
                                                        <div className="ms-3">
                                                            {course.assignedBatches.map((batch, batchIndex) => (
                                                                <div key={batch._id} className="d-flex align-items-center mb-1">
                                                                    <i className="fas fa-layer-group me-2 text-secondary"></i>
                                                                    <span className="text-muted">{batch.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {course.assignedBatches.length === 0 && (
                                                        <div className="ms-3">
                                                            <span className="text-muted">
                                                                <i className="fas fa-info-circle me-1"></i>
                                                                No batches assigned yet
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-3">
                                            <i className="fas fa-exclamation-triangle text-warning fa-2x mb-2"></i>
                                            <p className="text-muted mb-0">No courses assigned</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Card Footer */}
                                <div className="card-footer bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            Last updated: {new Date().toLocaleDateString()}
                                        </small>
                                        <div className="btn-group btn-group-sm">
                                            <button className="btn btn-outline-primary">
                                                <i className="fas fa-eye"></i> View
                                            </button>
                                            <button className="btn btn-outline-secondary">
                                                <i className="fas fa-edit"></i> Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Summary */}
            {filteredTrainers.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            Showing {filteredTrainers.length} of {trainersData.length} trainers
                            {selectedCourse && (
                                <span> for selected course</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BatchMangement;

