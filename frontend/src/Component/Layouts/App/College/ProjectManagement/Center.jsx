import React, { useState, useEffect } from 'react';
import Course from '../../../../Layouts/App/College/ProjectManagement/Course';

const Center = ({ selectedProject = null, onBackToProjects = null }) => {
    const [activeCenterTab, setActiveCenterTab] = useState('Active Centers');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [newUser, setNewUser] = useState('');
    const [newRole, setNewRole] = useState('Viewer');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [centerToDelete, setCenterToDelete] = useState(null);

    // ======== NEW STATES FOR COURSE INTEGRATION ========
    // Add these new states for course navigation
    const [showCourses, setShowCourses] = useState(false);
    const [selectedCenterForCourses, setSelectedCenterForCourses] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        location: '',
        city: '',
        state: '',
        country: 'India',
        type: 'main',
        status: 'active',
        capacity: '',
        projectCode: selectedProject?.code || ''
    });

    const [centers, setCenters] = useState([
        {
            id: 1,
            code: 'CTR001',
            name: 'Mumbai Technology Center',
            location: 'Bandra Kurla Complex',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            type: 'main',
            status: 'active',
            capacity: 500,
            currentOccupancy: 450,
            departments: 8,
            projects: 15,
            courses: 5, // ======== ADD THIS: Add courses count to each center ========
            projectCode: 'PROJ001', // Link to project
            createdAt: '2024-01-15',
            access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
        },
        {
            id: 2,
            code: 'CTR002',
            name: 'Delhi Regional Office',
            location: 'Connaught Place',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            type: 'regional',
            status: 'active',
            capacity: 200,
            currentOccupancy: 180,
            departments: 4,
            projects: 8,
            courses: 3, // ======== ADD THIS: Add courses count to each center ========
            projectCode: 'PROJ002', // Link to project
            createdAt: '2024-02-20',
            access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
        },
        {
            id: 3,
            code: 'CTR003',
            name: 'Bangalore R&D Center',
            location: 'Electronic City',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            type: 'research',
            status: 'inactive',
            capacity: 300,
            currentOccupancy: 0,
            departments: 0,
            projects: 0,
            courses: 0, // ======== ADD THIS: Add courses count to each center ========
            projectCode: 'PROJ003', // Link to project
            createdAt: '2023-12-10',
            access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
        },
        {
            id: 4,
            code: 'CTR004',
            name: 'Chennai Operations Center',
            location: 'OMR Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            country: 'India',
            type: 'main',
            status: 'active',
            capacity: 400,
            currentOccupancy: 350,
            departments: 6,
            projects: 12,
            courses: 4, // ======== ADD THIS: Add courses count to each center ========
            projectCode: 'PROJ001', // Another center for same project
            createdAt: '2024-03-05',
            access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
        },
        {
            id: 5,
            code: 'CTR005',
            name: 'Pune Development Hub',
            location: 'Hinjewadi',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            type: 'branch',
            status: 'active',
            capacity: 150,
            currentOccupancy: 120,
            departments: 3,
            projects: 6,
            courses: 2, // ======== ADD THIS: Add courses count to each center ========
            projectCode: 'PROJ002', // Another center for GSE project
            createdAt: '2024-04-10',
            access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
        },
        {
            id: 6,
            code: 'CTR006',
            name: 'Hyderabad Service Center',
            location: 'HITEC City',
            city: 'Hyderabad',
            state: 'Telangana',
            country: 'India',
            type: 'regional',
            status: 'active',
            capacity: 250,
            currentOccupancy: 200,
            departments: 5,
            projects: 9,
            courses: 6, // ======== ADD THIS: Add courses count to each center ========
            projectCode: 'PROJ004', // Link to customer feedback project
            createdAt: '2024-03-25',
            access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
        }
    ]);

    // Update form data when selectedProject changes
    useEffect(() => {
        if (selectedProject) {
            setFormData(prev => ({
                ...prev,
                projectCode: selectedProject.code
            }));
        }
    }, [selectedProject]);

    const filteredCenters = centers.filter(center => {
        // Filter by selected project if provided
        if (selectedProject && center.projectCode !== selectedProject.code) return false;

        // Filter by tab
        if (activeCenterTab === 'Active Centers' && center.status !== 'active') return false;
        if (activeCenterTab === 'Inactive Centers' && center.status !== 'inactive') return false;

        // Filter by search query
        return center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            center.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            center.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            center.location.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            location: '',
            city: '',
            state: '',
            country: 'India',
            type: 'main',
            status: 'active',
            capacity: '',
            projectCode: selectedProject?.code || ''
        });
    };

    const handleAdd = () => {
        setEditingCenter(null);
        resetForm();
        setShowAddForm(true);
    };

    const handleEdit = (center) => {
        setEditingCenter(center);
        setFormData({
            code: center.code,
            name: center.name,
            location: center.location,
            city: center.city,
            state: center.state,
            country: center.country,
            type: center.type,
            status: center.status,
            capacity: center.capacity.toString(),
            projectCode: center.projectCode
        });
        setShowEditForm(true);
    };

    const handleDelete = (center) => {
        setCenterToDelete(center);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setCenters(prev => prev.filter(c => c.id !== centerToDelete.id));
        setShowDeleteModal(false);
        setCenterToDelete(null);
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingCenter) {
            // Edit existing center
            setCenters(prev => prev.map(c =>
                c.id === editingCenter.id
                    ? {
                        ...c,
                        ...formData,
                        capacity: parseInt(formData.capacity) || 0
                    }
                    : c
            ));
            setShowEditForm(false);
        } else {
            // Add new center
            const newCenter = {
                id: Date.now(),
                ...formData,
                capacity: parseInt(formData.capacity) || 0,
                currentOccupancy: 0,
                departments: 0,
                projects: 0,
                courses: 0, // ======== ADD THIS: Initialize courses count for new centers ========
                createdAt: new Date().toISOString().split('T')[0],
                access: [{ name: 'admin@focalyt.com', role: 'Admin' }]
            };
            setCenters(prev => [...prev, newCenter]);
            setShowAddForm(false);
        }

        resetForm();
        setEditingCenter(null);
    };

    const handleShare = (center) => {
        setSelectedCenter(center);
        setShowShareModal(true);
    };

    // ======== ADD THESE NEW FUNCTIONS FOR COURSE NAVIGATION ========
    // Function to handle center click for courses
    const handleCenterClick = (center) => {
        setSelectedCenterForCourses(center);
        setShowCourses(true);
    };

    // Function to go back to centers view
    const handleBackToCenters = () => {
        setShowCourses(false);
        setSelectedCenterForCourses(null);
    };

    const closeModal = () => {
        setShowAddForm(false);
        setShowEditForm(false);
        resetForm();
        setEditingCenter(null);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'main': return 'bg-primary';
            case 'regional': return 'bg-success';
            case 'research': return 'bg-info';
            case 'branch': return 'bg-warning';
            default: return 'bg-secondary';
        }
    };

    const getOccupancyPercentage = (current, total) => {
        if (total === 0) return 0;
        return Math.round((current / total) * 100);
    };

    const getOccupancyColor = (percentage) => {
        if (percentage >= 90) return 'bg-danger';
        if (percentage >= 75) return 'bg-warning';
        return 'bg-success';
    };

    const DeleteModal = () => {
        if (!showDeleteModal || !centerToDelete) return null;

        return (
            <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-danger text-white">
                            <h5 className="modal-title">Confirm Delete</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete the center <strong>{centerToDelete.name} ({centerToDelete.code})</strong>?</p>
                            <p className="text-muted">This action cannot be undone and will remove all associated data.</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                                Delete Center
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ======== ADD THIS: If showing courses, render the Course component ========
    if (showCourses && selectedCenterForCourses) {
        return (
            <div>
                {/* Breadcrumb Navigation */}
                {/* <div className="container py-2">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            {onBackToProjects && (
                                <li className="breadcrumb-item d-none">
                                    <button
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={onBackToProjects}
                                    >
                                        {selectedProject ? `${selectedProject.name} Center` : 'Center'}
                                    </button>
                                </li>
                            )}
                            <li className="breadcrumb-item d-none">
                                <button
                                    className="btn btn-link p-0 text-decoration-none breadcrumb-h4"
                                    onClick={handleBackToCenters}
                                >
                                    {selectedProject ? `${selectedProject.name} Centers` : 'Centers'}
                                </button>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                {selectedCenterForCourses.name} Courses
                            </li>
                        </ol>

                    </nav>

                </div> */}

                {/* Course Component with filtered data */}
                <Course selectedCenter={selectedCenterForCourses} />
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* ======== ADD THIS: Back Button and Header ======== */}

            

                <div  className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <div className="d-flex align-items-center gap-3">

                            <div className='d-flex align-items-center'>
                                <h4 className="me-2">Verticals</h4>
                                <span className="mx-2"> &gt; </span>
                                <h5 className="breadcrumb-item mb-0" aria-current="page">
                                    Projects
                                </h5>
                            </div>
                        </div>
                    </div>
                    <div>

                    {onBackToProjects && (
                        <button
                            onClick={onBackToProjects}
                            className="btn btn-light"
                            title="Back to Verticals"
                        >
                            <i className="bi bi-arrow-left"></i>
                            <span>Back</span>
                        </button>
                    )}



                    <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                        <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
                    </button>
                    <button className="btn btn-primary" onClick={handleAdd}>Add Center</button>
                    </div>
                </div>
         

            <div className="d-flex justify-content-between mb-3">
                <ul className="nav nav-pills">
                    {['Active Centers', 'Inactive Centers', 'All Centers'].map(tab => (
                        <li className="nav-item" key={tab}>
                            <button
                                className={`nav-link ${activeCenterTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveCenterTab(tab)}
                            >
                                {tab}
                            </button>
                        </li>
                    ))}
                </ul>
                <input
                    type="text"
                    className="form-control w-25"
                    placeholder="Search centers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="row">
                {filteredCenters.map(center => {
                    const occupancyPercentage = getOccupancyPercentage(center.currentOccupancy, center.capacity);
                    return (
                        <div key={center.id} className={`mb-4 ${viewMode === 'grid' ? 'col-md-6' : 'col-12'}`}>
                            <div className="card h-100 border rounded shadow-sm position-relative">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        {/* ======== MODIFY THIS: Make center card clickable ======== */}
                                        <div
                                            className="flex-grow-1 cursor-pointer"
                                            onClick={() => handleCenterClick(center)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="bi bi-building text-success fs-3 me-2"></i>
                                                <div>
                                                    <p className="text-muted mb-1">{center.name}</p>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <p className="text-muted small mb-1">
                                                    <i className="bi bi-geo-alt me-1"></i>
                                                    {center.location}, {center.city}, {center.state}
                                                </p>
                                                <p className="text-muted small">
                                                    <i className="bi bi-globe me-1"></i>
                                                    {center.country}
                                                </p>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                                <span className={` ${center.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {center.status}
                                                </span>
                                                <span className={`${getTypeColor(center.type)}`}>
                                                    {center.type} center
                                                </span>
                                                {selectedProject && (
                                                    <span className=" bg-info">
                                                        {center.projectCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* ======== MODIFY THIS: Add stopPropagation to action buttons ======== */}
                                        <div className="text-end">
                                            <button className="btn btn-sm btn-light me-1" title="Share" onClick={(e) => { e.stopPropagation(); handleShare(center); }}>
                                                <i className="bi bi-share-fill"></i>
                                            </button>
                                            <button className="btn btn-sm btn-light me-1" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(center); }}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(center); }}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Occupancy Bar */}
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between small text-muted mb-1">
                                            <span>Occupancy</span>
                                            <span>{center.currentOccupancy}/{center.capacity} ({occupancyPercentage}%)</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div
                                                className={`progress-bar ${getOccupancyColor(occupancyPercentage)}`}
                                                role="progressbar"
                                                style={{ width: `${occupancyPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* ======== MODIFY THIS: Add courses display in stats ======== */}
                                    <div className="row small text-muted">
                                        <div className="col-3 text-center">
                                            <div className="fw-bold text-primary">{center.departments}</div>
                                            <div>Departments</div>
                                        </div>
                                        <div className="col-3 text-center">
                                            <div className="fw-bold text-info">{center.projects}</div>
                                            <div>Projects</div>
                                        </div>
                                        <div className="col-3 text-center">
                                            <span
                                                className="fw-bold text-warning"
                                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => handleCenterClick(center)}
                                            >
                                                {center.courses}
                                            </span>
                                            <div>Courses</div>
                                        </div>
                                        <div className="col-3 text-center">
                                            <div className="fw-bold text-success">{center.capacity}</div>
                                            <div>Capacity</div>
                                        </div>
                                    </div>

                                    <div className="small text-muted mt-3">
                                        <i className="bi bi-calendar me-1"></i>Created: <strong>{center.createdAt}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCenters.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-building fs-1 text-muted"></i>
                    <h5 className="text-muted mt-3">No centers found</h5>
                    {selectedProject ? (
                        <p className="text-muted">No centers found for project {selectedProject.name}</p>
                    ) : (
                        <p className="text-muted">Try adjusting your search or filter criteria</p>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showAddForm || showEditForm) && (
                <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">{editingCenter ? 'Edit Center' : 'Add New Center'}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Center Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter center name"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Center Manager Name</label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                        >
                                            <option value="main">Test1</option>
                                            <option value="regional">Test2</option>
                                            <option value="research">Test3</option>
                                            <option value="branch">Test4</option>
                                        </select>
                                    </div>
                                </div>


                                <div className="mb-3">
                                    <label className="form-label">Location/Address</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="Enter location or address"
                                    />
                                </div>

                                <div className="row">

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-success" onClick={handleSubmit}>
                                    {editingCenter ? 'Update Center' : 'Add Center'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteModal />

            {/* Share Modal */}
            {showShareModal && selectedCenter && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={() => setShowShareModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">Manage Access - {selectedCenter.code}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowShareModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-8">
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Add user email"
                                            value={newUser}
                                            onChange={(e) => setNewUser(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <select
                                            className="form-select"
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                        >
                                            <option value="Viewer">Viewer</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <textarea className="form-control" placeholder="Add message (optional)" rows={2}></textarea>
                                </div>
                                <div className="form-check mb-4">
                                    <input type="checkbox" className="form-check-input" id="notifyCheck" defaultChecked />
                                    <label className="form-check-label">Notify people</label>
                                </div>
                                <button type="button" className="btn btn-success">Send</button>

                                <hr />

                                <h6 className="mb-3">Current Access</h6>
                                <ul className="list-group">
                                    {selectedCenter.access.map((a, index) => (
                                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{a.name}</strong>
                                            </div>
                                            <select className="form-select w-auto">
                                                <option value="Viewer" selected={a.role === 'Viewer'}>Viewer</option>
                                                <option value="Staff" selected={a.role === 'Staff'}>Staff</option>
                                                <option value="Manager" selected={a.role === 'Manager'}>Manager</option>
                                                <option value="Admin" selected={a.role === 'Admin'}>Admin</option>
                                            </select>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {
                    `
                    .overflowY{
                    overflow-y: scroll!important}

            .breadcrumb-h4{
            font-size: 1.5rem;
                margin-top: 0;
    margin-bottom: .5rem;
    font-weight: 500;
    line-height: 1.2;
    color: var(--bs-heading-color);
            }            
            
            `
                }
            </style>
        </div>
    );
};

export default Center;