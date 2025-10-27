import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';

function BatchMangement() {
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [batches, setBatches] = useState([]);
    const [courseInfo, setCourseInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = JSON.parse(sessionStorage.getItem('token'));
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const courseId = searchParams.get('courseId');

    useEffect(() => {
        if (courseId) {
            console.log("Fetching batches for course:", courseId);
            fetchBatchesByCourse();
        }
    }, [courseId]);

    const fetchBatchesByCourse = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/college/getbatchesbytrainerandcourse`, {
                params: { courseId },
                headers: {
                    'x-auth': token
                }
            });
            
            console.log('Batches response:', response.data);
            
            if (response.data && response.data.status && response.data.data) {
                setBatches(response.data.data.batches || []);
                setCourseInfo(response.data.data.course);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter batches based on search term
    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            batch.centerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                                    <i className="feather icon-arrow-left me-1"></i> Back to Courses
                                </button>
                                <h2 className="mb-0">Batch Management</h2>
                            </div>
                            {courseInfo && (
                                <p className="text-muted mb-0">
                                    <i className="feather icon-book me-1"></i>
                                    Course: <strong>{courseInfo.name}</strong>
                                </p>
                            )}
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

            {courseInfo && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    {courseInfo.image && (
                                        <img 
                                            src={courseInfo.image} 
                                            alt={courseInfo.name}
                                            className="rounded me-3"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div className="flex-grow-1">
                                        <h4 className="mb-1">{courseInfo.name}</h4>
                                        <p className="text-muted mb-0">{courseInfo.description}</p>
                                    </div>
                                    <div className="text-end">
                                        <span className="badge bg-primary" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                                            {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h3 className="card-title mb-0">{batches.length}</h3>
                                    <p className="card-text mb-0">Total Batches</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-layer-group fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h3 className="card-title mb-0">
                                        {batches.filter(b => b.status === 'active').length}
                                    </h3>
                                    <p className="card-text mb-0">Active Batches</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-check-circle fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info text-white border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h3 className="card-title mb-0">
                                        {batches.reduce((sum, batch) => sum + (batch.maxStudents || 0), 0)}
                                    </h3>
                                    <p className="card-text mb-0">Total Capacity</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-users fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-md-8">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search batches by name or center..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <button
                        className="btn btn-outline-primary w-100"
                        onClick={fetchBatchesByCourse}
                    >
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <div className="row">
                {filteredBatches.length === 0 ? (
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                <h4 className="text-muted">No batches found</h4>
                                <p className="text-muted">
                                    {searchTerm 
                                        ? 'Try adjusting your search criteria'
                                        : 'No batches have been assigned to you for this course yet'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    // Grid View
                    filteredBatches.map((batch) => (
                        <div key={batch._id} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 border-0 shadow-sm batch-card">
                                <div className="card-body">
                                    {/* Batch Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-1">
                                                <i className="fas fa-layer-group me-2 text-primary"></i>
                                                {batch.name}
                                            </h5>
                                            {batch.centerId && (
                                                <p className="text-muted mb-0 small">
                                                    <i className="fas fa-map-marker-alt me-1"></i>
                                                    {batch.centerId.name}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`badge ${batch.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                            {batch.status || 'Active'}
                                        </span>
                                    </div>

                                    {/* Batch Details */}
                                    <div className="batch-details mb-3">
                                        {batch.description && (
                                            <p className="text-muted small mb-2">{batch.description}</p>
                                        )}
                                        
                                        <div className="row g-2 mb-2">
                                            <div className="col-6">
                                                <div className="detail-item">
                                                    <i className="fas fa-calendar-alt text-primary me-1"></i>
                                                    <small className="text-muted">Start Date</small>
                                                    <div className="fw-bold">{formatDate(batch.startDate)}</div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="detail-item">
                                                    <i className="fas fa-calendar-check text-success me-1"></i>
                                                    <small className="text-muted">End Date</small>
                                                    <div className="fw-bold">{formatDate(batch.endDate)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-2">
                                            <div className="col-6">
                                                <div className="detail-item">
                                                    <i className="fas fa-users text-info me-1"></i>
                                                    <small className="text-muted">Max Students</small>
                                                    <div className="fw-bold">{batch.maxStudents || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="detail-item">
                                                    <i className="fas fa-user-tie text-warning me-1"></i>
                                                    <small className="text-muted">Trainers</small>
                                                    <div className="fw-bold">{batch.trainers?.length || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trainers List */}
                                    {batch.trainers && batch.trainers.length > 0 && (
                                        <div className="trainers-section mb-3">
                                            <h6 className="text-muted small mb-2">
                                                <i className="fas fa-chalkboard-teacher me-1"></i>
                                                Assigned Trainers
                                            </h6>
                                            <div className="trainers-list">
                                                {batch.trainers.map((trainer, idx) => (
                                                    <div key={idx} className="trainer-item small">
                                                        <i className="fas fa-user-circle me-1 text-primary"></i>
                                                        {trainer.name || 'N/A'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="card-footer bg-light border-0">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            <i className="fas fa-clock me-1"></i>
                                            {formatDate(batch.createdAt)}
                                        </small>
                                        <Link 
                                            to={`/trainer/students?batchId=${batch._id}&batchName=${encodeURIComponent(batch.name)}&courseId=${courseId || ''}`} 
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            <i className="fas fa-eye me-1"></i> View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // List View
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Batch Name</th>
                                                <th>Center</th>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>Max Students</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBatches.map((batch) => (
                                                <tr key={batch._id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <i className="fas fa-layer-group me-2 text-primary"></i>
                                                            <div>
                                                                <div className="fw-bold">{batch.name}</div>
                                                                {batch.description && (
                                                                    <small className="text-muted">{batch.description}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="align-middle">
                                                        {batch.centerId ? (
                                                            <>
                                                                <i className="fas fa-map-marker-alt me-1 text-muted"></i>
                                                                {batch.centerId.name}
                                                            </>
                                                        ) : 'N/A'}
                                                    </td>
                                                    <td className="align-middle">{formatDate(batch.startDate)}</td>
                                                    <td className="align-middle">{formatDate(batch.endDate)}</td>
                                                    <td className="align-middle">
                                                        <span className="badge bg-info">
                                                            {batch.maxStudents || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <span className={`badge ${batch.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {batch.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <Link 
                                                            to={`/trainer/students?batchId=${batch._id}&batchName=${encodeURIComponent(batch.name)}&courseId=${courseId || ''}`}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="fas fa-eye"></i> View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            {/* {filteredBatches.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="alert alert-info mb-0">
                            <i className="fas fa-info-circle me-2"></i>
                            Showing {filteredBatches.length} of {batches.length} batches
                            {searchTerm && <span> matching your search</span>}
                        </div>
                    </div>
                </div>
            )} */}

            {/* Custom CSS */}
            <style jsx>{`
                .batch-card {
                    transition: all 0.3s ease;
                }

                .batch-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
                }

                .detail-item {
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 0.25rem;
                }

                .trainers-list {
                    max-height: 100px;
                    overflow-y: auto;
                }

                .trainer-item {
                    padding: 0.25rem 0;
                    border-bottom: 1px solid #e9ecef;
                }

                .trainer-item:last-child {
                    border-bottom: none;
                }

                .table th {
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.5px;
                    color: #6c757d;
                }
            `}</style>
        </div>
    );
}

export default BatchMangement;
