import React, { useState, useEffect } from 'react';
import Course from '../../../../Layouts/App/College/ProjectManagement copy/Course';

const Center = ({ selectedProject = null, onBackToProjects = null, onBackToVerticals = null, selectedVertical = null }) => {

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    
    // URL-based state management
    const getURLParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            stage: urlParams.get('stage') || 'center',
            centerId: urlParams.get('centerId'),
            projectId: urlParams.get('projectId'),
            verticalId: urlParams.get('verticalId'),
            courseId: urlParams.get('courseId'),
        };
    };

    const updateURL = (params) => {
        const url = new URL(window.location);
        
        // Clear existing params
        url.searchParams.delete('stage');
        url.searchParams.delete('centerId');
        url.searchParams.delete('courseId');
        
        // Set new params
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            }
        });
        
        window.history.replaceState({}, '', url);
    };

    const [activeCenterTab, setActiveCenterTab] = useState('Active Centers');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);
    const [alignCenter, setShowAlignCenter] = useState(null);
    const [selctedAlignCenter, setSelctedAlignCenter] = useState('');
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
        address: '',
        city: '',
        state: '',
        country: 'India',
        type: 'main',
        status: 'active',
        capacity: '',
        project: selectedProject ? [selectedProject._id] : []
    });

    const [centers, setCenters] = useState([

    ]);
    const [allCenters, setallCenters] = useState([
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Update form data when selectedProject changes
    useEffect(() => {
        if (selectedProject) {
            setFormData(prev => ({
                ...prev,
                project: selectedProject._id
            }));
        }
    }, [selectedProject]);

    useEffect(() => {
        console.log(formData, "formData")
    }, [formData]);

    const filteredCenters = centers.filter(center => {
        // Check project array safely


        if (activeCenterTab === 'Active Centers' && center.status !== 'active') return false;
        if (activeCenterTab === 'Inactive Centers' && center.status !== 'inactive') return false;

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
            address: '',
            city: '',
            state: '',
            country: 'India',
            type: 'main',
            status: 'active',
            capacity: '',
            project: selectedProject?._id || ''
        });
    };

    const handleAdd = () => {
        setEditingCenter(null);
        resetForm();
        setShowAddForm(true);
    };

    const handleAlign = () => {
        setEditingCenter(null);
        setShowAddForm(null);
        resetForm();
        setShowAlignCenter(true);
    };

    const handleEdit = (center) => {
        setEditingCenter(center);
        console.log('center', center)
        setFormData({
            name: center.name,
            address: center.address,
            status: center.status,
        });
        setShowEditForm(true);
    };

    const handleDelete = (center) => {
        setCenterToDelete(center);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!centerToDelete) return;

        try {


            const response = await fetch(`${backendUrl}/college/center_delete/${centerToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth': token,
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to delete center');
            }
            fetchCenters()
            setShowDeleteModal(false);
            setCenterToDelete(null);
        } catch (error) {
            alert(error.message || 'Error deleting center');
        }
    };
    useEffect(() => {
        // URL-based state restoration logic
        const urlParams = getURLParams();
        console.log('Center component - URL params:', urlParams);
        
        // Only restore state if centers are loaded
        if (centers.length === 0) {
            console.log('Centers not loaded yet, skipping state restoration');
            return;
        }
        
        if (urlParams.stage === "course" && urlParams.centerId) {
            // Find center from current centers list
            const center = centers.find(c => c._id === urlParams.centerId);
            if (center) {
                setSelectedCenterForCourses(center);
                setShowCourses(true);
                console.log('Restored to course view for center:', center.name);
            } else {
                // Center not found, reset to center view
                console.warn('Center not found in current list, resetting to center view');
                updateURL({ 
                    stage: 'center',
                    projectId: selectedProject?._id,
                    verticalId: selectedVertical?.id,
                });
                setShowCourses(false);
            }
        } else if (urlParams.stage === "batch") {
            // For batch stage, we need to restore the full navigation context
            if (urlParams.centerId) {
                const center = centers.find(c => c._id === urlParams.centerId);
                if (center) {
                    setSelectedCenterForCourses(center);
                    setShowCourses(true);
                    console.log(`Restored to ${urlParams.stage} view with center:`, center.name);
                } else {
                    console.warn('Center not found, resetting to center view');
                    updateURL({ 
                        stage: 'center',
                        projectId: selectedProject?._id,
                        verticalId: selectedVertical?.id,
                    });
                    setShowCourses(false);
                }
            } else {
                console.warn('No center context found, resetting to center view');
                updateURL({ 
                    stage: 'center',
                    projectId: selectedProject?._id,
                    verticalId: selectedVertical?.id,
                });
                setShowCourses(false);
            }
        } else {
            // Default to center view
            setShowCourses(false);
            console.log('Restored to center view');
        }
    }, [centers, selectedProject, selectedVertical]); // Depend on centers, selectedProject, and selectedVertical

    
    useEffect(() => {
        const urlParams = getURLParams();
        if (urlParams.stage === 'course' && urlParams.centerId) {
            // If the URL shows 'course' stage and a centerId, go to courses
            const center = centers.find(c => c._id === urlParams.centerId);
            if (center) {
                setSelectedCenterForCourses(center);
                setShowCourses(true);
            }
        } else {
            // Default to 'center' stage
            setShowCourses(false);
        }
    }, [centers]);

    useEffect(() => {

        fetchCenters();

    }, []);

    useEffect(() => {

        fetchAllCenters();
        console.log('all centers', allCenters)

    }, [alignCenter]);

    const fetchCenters = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/college/list-centers?projectId=${selectedProject._id}`, {
                headers: {
                    'x-auth': token,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch centers');

            const data = await response.json();
            if (data.success) {
                setCenters(data.data);
            } else {
                setError('Failed to load centers');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const fetchAllCenters = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/college/list-centers`, {
                headers: {
                    'x-auth': token,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch centers');

            const data = await response.json();
            if (data.success) {
                console.log('response', data)
                setallCenters(data.data);
            } else {
                setError('Failed to load centers');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p>Loading centers...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;




    const handleSubmit = async () => {


        try {



            if (editingCenter) {


                // Edit existing center (PUT)
                const response = await fetch(`${backendUrl}/college/edit_center/${editingCenter._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth': token,
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to update center');
                }

                fetchCenters()
                setShowEditForm(false);
            } else if (alignCenter) {

                const response = await fetch(`${backendUrl}/college/asign_center/${selctedAlignCenter}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth': token,
                    },
                    body: JSON.stringify({ projectId: selectedProject._id }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to add center');
                }
                fetchCenters()
                closeModal();
                alert('Center aligned Successfully')


            }
            else {

                if (!formData.name?.trim()) {
                    alert('Please fill in all required fields');
                    return;
                }
                // Add new center (POST)
                const response = await fetch(`${backendUrl}/college/add_canter`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth': token,
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to add center');
                }
                fetchCenters()

                setShowAddForm(false);
            }

            resetForm();
            setEditingCenter(null);
        } catch (error) {
            alert(error.message || 'Something went wrong');
        }
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

        // Update URL with center and course stage
        updateURL({
            stage: 'course',
            centerId: center._id,
            projectId: selectedProject?._id,
            verticalId: selectedVertical?.id,
        });
    };

    // Function to go back to centers view
    const handleBackToCenters = () => {
        setShowCourses(false);
        setSelectedCenterForCourses(null);

        // Update URL to center stage
        updateURL({
            stage: 'center',
            projectId: selectedProject?._id,
            verticalId: selectedVertical?.id,
        });
    };

    const closeModal = () => {
        setShowAddForm(false);
        setShowEditForm(false);
        setShowAlignCenter(false);
        setSelctedAlignCenter('')
        resetForm();
        setEditingCenter(null);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'main': return 'text-primary';
            case 'regional': return 'text-success';
            case 'research': return 'bg-info';
            case 'branch': return 'text-warning';
            default: return 'text-secondary';
        }
    };

    const getOccupancyPercentage = (current, total) => {
        if (total === 0) return 0;
        return Math.round((current / total) * 100);
    };

    const getOccupancyColor = (percentage) => {
        if (percentage >= 90) return 'bg-danger';
        if (percentage >= 75) return 'bg-warning';
        return 'text-success';
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
                <Course selectedCenter={selectedCenterForCourses} onBackToCenters={handleBackToCenters} selectedProject={selectedProject} onBackToProjects={onBackToProjects} selectedVertical={selectedVertical} onBackToVerticals={onBackToVerticals} />
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* ======== ADD THIS: Back Button and Header ======== */}



            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <div className="d-flex align-items-center gap-3">

                        <div className='d-flex align-items-center'>
                            <h4 style={{ cursor: 'pointer' }} onClick={onBackToVerticals} className="me-2">{selectedVertical.name} Vertical</h4>
                            <span className="mx-2"> &gt; </span>
                            <h5 style={{ cursor: 'pointer' }} onClick={onBackToProjects} className="breadcrumb-item mb-0" aria-current="page">
                                {selectedProject.name} Project
                            </h5>
                            <span className="mx-2"> &gt; </span>
                            <h5 className="breadcrumb-item mb-0" aria-current="page">
                                Centers
                            </h5>
                        </div>
                    </div>
                </div>
                <div>

                    {onBackToProjects && (
                        <button
                            onClick={onBackToProjects}
                            className="btn btn-light me-2"
                            title="Back to Verticals"
                        >
                            <i className="bi bi-arrow-left"></i>
                            <span>Back</span>
                        </button>
                    )}



                    <button className="btn btn-outline-secondary me-2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                        <i className={`bi ${viewMode === 'grid' ? 'bi-list' : 'bi-grid'}`}></i>
                    </button>
                    <button className="btn btn-danger me-2" onClick={handleAlign}>Align Exsting Center</button>
                    <button className="btn btn-danger" onClick={handleAdd}>Add New Center</button>
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
                                                    {center.address}
                                                </p>
                                                <p className="text-muted small">
                                                    <i className="bi bi-globe me-1"></i>
                                                    India
                                                </p>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                                <span className={` ${center.status === 'active' ? 'text-success' : 'bg-secondary'}`}>
                                                    {center.status}
                                                </span>
                                                <span className={`${getTypeColor(center.type)}`}>
                                                    {center.type} center
                                                </span>
                                                {/* {selectedProject && (
                                                    <span className=" bg-info">
                                                        {center.project}
                                                    </span>
                                                )} */}
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
                                    {/* <div className="mb-3">
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
                                    </div> */}

                                    {/* ======== MODIFY THIS: Add courses display in stats ======== */}
                                    {/* <div className="row small text-muted">
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
                                    </div> */}

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
            {(showAddForm || showEditForm || alignCenter) && (
                <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header text-success text-white">
                                <h5 className="modal-title">
                                    {alignCenter
                                        ? 'Align Existing Center'
                                        : editingCenter
                                            ? 'Edit Center'
                                            : 'Add New Center'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            {alignCenter ?
                                <div className="modal-body">
                                    <div className="row">

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Select Centers</label>
                                            <select
                                                className="form-select"
                                                value={selctedAlignCenter}
                                                onChange={(e) => setSelctedAlignCenter(e.target.value)}
                                            >
                                                <option value="" disabled>
                                                    Select Center
                                                </option>
                                                {allCenters.map(center => (
                                                    <option key={center._id} value={center._id}>
                                                        {center.name}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>
                                    </div>
                                </div> :
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

                                    </div>


                                    <div className="mb-3">
                                        <label className="form-label">Location/Address</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                                </div>}

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-success" onClick={handleSubmit}>
                                    {alignCenter
                                        ? 'Align Center'
                                        : editingCenter ? 'Update Center' : 'Add Center'}
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
                            <div className="modal-header text-success text-white">
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