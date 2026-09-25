import React, { useState, useEffect } from 'react';
import Course from './Course';
import axios from 'axios';
import './listView.css';
const Center = ({ selectedProject = null, onBackToProjects = null, onBackToVerticals = null, selectedVertical = null, stopAtCenter = false }) => {

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

const [permissions , setPermissions]= useState()
useEffect(() => {
    updatedPermission()
}, [])

const updatedPermission = async () => {
    const respose = await axios.get(`${backendUrl}/college/permission`, {
        headers: { 'x-auth': token }
    });
    if (respose.data.status) {
        setPermissions(respose.data.permissions);
    }
}
 

    const getURLParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            stage: urlParams.get('stage') || 'center',
            centerId: urlParams.get('centerId'),
            projectId: urlParams.get('projectId'),
            verticalId: urlParams.get('verticalId'),
            courseId: urlParams.get('courseId')
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
            address: center.address || center.location || '',
            status: center.status === true ? 'active' : center.status === false ? 'inactive' : (center.status || 'active'),
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
            alert('Center deleted successfully');
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
        
        if (!stopAtCenter && urlParams.stage === "course" && urlParams.centerId) {
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
                    projectName: selectedProject?.name,
                    verticalId: selectedVertical?.id,
                    verticalName: selectedVertical?.name
                });
                setShowCourses(false);
            }
        } else if (!stopAtCenter && urlParams.stage === "batch") {
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
                        projectName: selectedProject?.name,
                        verticalId: selectedVertical?.id,
                        verticalName: selectedVertical?.name
                    });
                    setShowCourses(false);
                }
            } else {
                console.warn('No center context found, resetting to center view');
                updateURL({ 
                    stage: 'center',
                    projectId: selectedProject?._id,
                    projectName: selectedProject?.name,
                    verticalId: selectedVertical?.id,
                    verticalName: selectedVertical?.name
                });
                setShowCourses(false);
            }
        } else {
            // Default to center view
            setShowCourses(false);
            console.log('Restored to center view');
        }
    }, [centers, selectedProject, selectedVertical]); // Depend on centers, selectedProject, and selectedVertical

    // Removed duplicate useEffect that was conflicting with URL restoration

    useEffect(() => {
        // Get projectId from selectedProject prop or URL
        const projectId = selectedProject?._id || new URLSearchParams(window.location.search).get('projectId');
        
        if (projectId && token) {
            fetchCenters();
        } else {
            console.log('No projectId or token available, not fetching centers');
        }
    }, [selectedProject?._id, token]);

    useEffect(() => {

        fetchAllCenters();
        console.log('all centers', allCenters)

    }, [alignCenter]);

    const fetchCenters = async () => {
        // Get projectId from selectedProject prop or URL (for refresh cases)
        const projectId = selectedProject?._id || new URLSearchParams(window.location.search).get('projectId');
        
        if (!projectId) {
            console.warn('No projectId available from selectedProject or URL');
            setCenters([]);
            setError('No project context available');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/college/list-centers?projectId=${projectId}`, {
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
                const editPayload = {
                    name: formData.name?.trim(),
                    address: formData.address?.trim() || '',
                    status: formData.status === 'active',
                };
                const response = await fetch(`${backendUrl}/college/edit_center/${editingCenter._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth': token,
                    },
                    body: JSON.stringify(editPayload),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to update center');
                }

                fetchCenters()
                setShowEditForm(false);
                alert('Center updated successfully');
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
                alert('Center added successfully');
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
        if (stopAtCenter) return;
        setSelectedCenterForCourses(center);
        setShowCourses(true);
        updateURL({
            stage: 'course',
            centerId: center._id,
            projectId: selectedProject?._id,
            verticalId: selectedVertical?.id
        });
    };

    // Function to go back to centers view
    const handleBackToCenters = () => {
        setShowCourses(false);
        setSelectedCenterForCourses(null);

        updateURL({
            stage: 'center',
            projectId: selectedProject?._id,
            verticalId: selectedVertical?.id
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
            <div className="vt-screen-enter">
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

    const canEditCenter = (permissions?.custom_permissions?.can_add_center && permissions?.permission_type === 'Custom') || permissions?.permission_type === 'Admin';

    return (
        <div className="container py-4 vt-page vt-screen-enter">
            <div className="vt-shell">
            <div className="vt-head">
                <div>
                    <p className="vt-kicker">Training</p>
                    <div className="vt-crumb">
                        <button type="button" onClick={onBackToVerticals}>{selectedVertical?.name || 'Vertical'}</button>
                        <span>/</span>
                        <button type="button" onClick={onBackToProjects}>{selectedProject?.name || 'Project'}</button>
                        <span>/</span>
                        <strong>Centers</strong>
                    </div>
                </div>
                <div className="vt-head-actions">
                    {onBackToProjects && (
                        <button type="button" className="vt-back" onClick={onBackToProjects} title="Back to Projects">
                            <i className="bi bi-arrow-left"></i> Back
                        </button>
                    )}
                    <button type="button" className="vt-back" title="Align Existing Center" onClick={handleAlign}>Align Center</button>
                    {canEditCenter && (
                        <button type="button" className="vt-add" onClick={handleAdd}>Add Center</button>
                    )}
                </div>
            </div>

            <div className="vt-toolbar">
                <div className="vt-tabs">
                    {['Active Centers', 'Inactive Centers', 'All Centers'].map(tab => (
                        <button
                            type="button"
                            key={tab}
                            className={activeCenterTab === tab ? 'is-active' : ''}
                            onClick={() => setActiveCenterTab(tab)}
                        >
                            {tab.replace(' Centers', '')}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    className="vt-search"
                    placeholder="Search centers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredCenters.length > 0 ? (
            <div className="table-responsive">
                <table className="vt-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCenters.map(center => (
                            <tr
                                key={center._id || center.id}
                                className={`vt-row ${stopAtCenter ? 'is-static' : ''}`}
                                title={stopAtCenter ? undefined : 'Open courses'}
                                onClick={() => handleCenterClick(center)}
                            >
                                <td>
                                    <span className="vt-name">
                                        <span className="vt-avatar">{(center.name || '?').charAt(0).toUpperCase()}</span>
                                        {center.name}
                                        {!stopAtCenter && <i className="bi bi-chevron-right vt-go"></i>}
                                    </span>
                                </td>
                                <td className="vt-desc">{center.address || '—'}</td>
                                <td>
                                    <span className={`vt-pill ${center.status === 'active' ? 'is-active' : ''}`}>{center.status}</span>
                                </td>
                                <td className="vt-date">{center.createdAt ? new Date(center.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="vt-actions">
                                        <button type="button" title="Edit" onClick={() => handleEdit(center)}>
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button type="button" className="is-danger" title="Delete" onClick={() => handleDelete(center)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            ) : (
                <div className="vt-empty">
                    <i className="bi bi-building"></i>
                    <h5>No centers found</h5>
                    <p>{selectedProject ? `No centers found for ${selectedProject.name}` : 'Try another filter or search.'}</p>
                </div>
            )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddForm || showEditForm || alignCenter) && (
                <div className="modal d-block overflowY" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header text-success text-white" style={{ backgroundColor: '#fc2b5a' }}>
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
{`
/* ================= Base Styles ================= */

.overflowY {
  overflow-y: scroll !important;
}

.breadcrumb-h4 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
  font-weight: 500;
  line-height: 1.2;
  color: var(--bs-heading-color);
}

.centerBtnResponsive {
  display: flex;
}

.searchBar {
  height: 30px;
  width: 25%;
}

/* ================= 992px ================= */

@media (max-width: 992px) {

  .subBtnRes {
    white-space: nowrap;
    padding: 0.25rem 0.5rem;
    font-size: 12px;
  }

  .visibility {
    display: none !important;
  }

  .BAckBtn {
    margin-right: clamp(12px, 5vw, 100px);
  }

  .width100 {
    width: 100%;
  }

  .TextToDot {
    width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobileHead {
    display: block !important;
  }
}

/* ================= 768px ================= */

@media (max-width: 768px) {

  .visibility {
    display: none !important;
  }

  .allCenter {
    display: block !important;
  }

  .allCenterBtn {
    margin-bottom: 10px !important;
  }
}

/* ================= 525px ================= */

@media (max-width: 525px) {
  .searchBar {
    width: 85px !important;
  }
}

/* ================= 450px ================= */

@media (max-width: 450px) {

  .navBTn {
    padding: 4px;
    width: 70px;
    border: 1px solid #d5d5d5;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: clamp(12px, 1.8vw, 15px);
  }
}
`}
</style>
        </div>
    );
};

export default Center;