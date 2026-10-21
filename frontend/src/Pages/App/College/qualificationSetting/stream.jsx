import React, { useState, useEffect } from 'react';
import NeoStatusToggle from './NeoStatusToggle';
import './qualificationSetting.css';

const Stream = ({ view = false }) => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    const API = {
        streams: `${backendUrl}/college/qualification/course/stream`,
        qualifications: `${backendUrl}/college/qualification`,
        qualificationCourses: `${backendUrl}/college/qualification/course/qualificationCourses`,
        changeStatus: `${backendUrl}/college/qualification/changestatus`
    };

    const headers = { 'x-auth': token, 'Content-Type': 'application/json' };

    const emptyForm = { _qualification: '', _course: '', name: '' };
    const emptyCustomForm = { _qualification: '', name: '' };

    const [subQual, setSubQual] = useState([]);
    const [qualifications, setQualifications] = useState([]);
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [customForm, setCustomForm] = useState(emptyCustomForm);
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchQualifications();
    }, []);

    useEffect(() => {
        fetchStreams(page);
    }, [page]);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
    };

    const fetchQualifications = async () => {
        try {
            const response = await fetch(API.qualifications, { headers });
            const data = await response.json();
            if (data.status) setQualifications(data.data || []);
        } catch (error) {
            console.error('Error fetching qualifications:', error);
        }
    };

    // Replaces the jQuery/axios "#qual change" handler
    const fetchCourses = async (qualificationId) => {
        if (!qualificationId) {
            setCourses([]);
            return;
        }
        try {
            const response = await fetch(API.qualificationCourses, {
                method: 'POST',
                headers,
                body: JSON.stringify({ _qualification: qualificationId })
            });
            const data = await response.json();
            setCourses(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setCourses([]);
        }
    };

    const fetchStreams = async (pageNo = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`${API.streams}?page=${pageNo}`, { headers });
            const data = await response.json();
            if (data.status) {
                setSubQual(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                showAlert(data.message || 'Failed to fetch streams', 'error');
            }
        } catch (error) {
            console.error('Error fetching streams:', error);
            showAlert('Failed to fetch streams', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setCustomForm(emptyCustomForm);
        setCourses([]);
        setIsEditing(false);
        setEditingId(null);
    };

    const handleQualificationChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, _qualification: value, _course: '' });
        fetchCourses(value);
    };

    const saveStream = async (payload) => {
        try {
            setLoading(true);
            const url = isEditing ? `${API.streams}/${editingId}` : API.streams;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.status) {
                showAlert(isEditing ? 'Stream updated successfully!' : 'Stream added successfully!', 'success');
                resetForm();
                fetchStreams(page);
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving stream:', error);
            showAlert('Failed to save stream', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData._qualification || !formData._course || !formData.name.trim()) {
            showAlert('Please fill all required fields', 'error');
            return;
        }
        saveStream(formData);
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        if (!customForm._qualification || !customForm.name.trim()) {
            showAlert('Please fill all required fields', 'error');
            return;
        }
        saveStream(customForm);
    };

    const handleEdit = (stream) => {
        const qualId = stream._qualification?._id || '';
        setFormData({
            _qualification: qualId,
            _course: stream._course?._id || '',
            name: stream.name || ''
        });
        fetchCourses(qualId);
        setIsEditing(true);
        setEditingId(stream._id);
        setShowCustomForm(false);
    };

    const handleStatusToggle = async (item) => {
        const newStatus = !(item.status === true || item.status === 'true');
        try {
            const response = await fetch(API.changeStatus, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: item._id,
                    status: newStatus,
                    model: 'subQualification'
                })
            });
            const data = await response.json();

            if (data.status !== false) {
                setSubQual((prev) =>
                    prev.map((s) => (s._id === item._id ? { ...s, status: newStatus } : s))
                );
                showAlert('Status updated successfully!', 'success');
            } else {
                showAlert(data.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showAlert('Failed to update status', 'error');
        }
    };

    // Same windowing logic as the EJS pagination
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        let first = 1;
        let last = totalPages > 4 ? 4 : totalPages;
        if (totalPages > 4 && page >= 2) {
            first = page - 1;
            last = page + 1;
            if (last > totalPages) last = totalPages;
        }

        const pages = [];
        for (let i = first; i <= last; i += 1) pages.push(i);

        return (
            <ul className="pagination justify-content-end ml-2 mb-2">
                {first > 1 && (
                    <li className="page-item">
                        <button type="button" className="page-link" onClick={() => setPage(1)}>First</button>
                    </li>
                )}

                {pages.map((i) => (
                    <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setPage(i)}>
                            {i}
                        </button>
                    </li>
                ))}

                {totalPages > last && (
                    <>
                        <li className="page-item">
                            <button type="button" className="page-link" onClick={() => setPage(last + 1)}>...</button>
                        </li>
                        <li className="page-item">
                            <button type="button" className="page-link" onClick={() => setPage(totalPages)}>Last</button>
                        </li>
                    </>
                )}
            </ul>
        );
    };

    return (
        <div className="container-fluid qs-page">
            <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
                <div className="content-header-left col-md-9 col-12 mb-2">
                    <div className="row breadcrumbs-top">
                        <div className="col-12">
                            <h3 className="content-header-title float-left mb-0">Stream</h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <a href={`${backendUrl}/admin`}>Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">Stream</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-body">
                {alert.show && (
                    <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                        {alert.message}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setAlert({ show: false, message: '', type: '' })}
                        ></button>
                    </div>
                )}

                <section className="list-view">
                    <div className="row">
                        <div className="col-6 equal-height-2">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">
                                        {isEditing ? 'Update Stream' : 'Add Stream'}
                                    </h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <form className="form-horizontal" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-xl-4 mb-1">
                                                    <label>
                                                        Select Education
                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <select
                                                        style={{ cursor: 'pointer' }}
                                                        className="form-control"
                                                        name="_qualification"
                                                        value={formData._qualification}
                                                        onChange={handleQualificationChange}
                                                        required
                                                    >
                                                        <option value="">Select Option</option>
                                                        {qualifications.map((s) => (
                                                            <option key={s._id} value={s._id} className="text-capitalize">
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-xl-4 mb-1">
                                                    <label>Select Course</label>
                                                    <select
                                                        style={{ cursor: 'pointer' }}
                                                        className="form-control"
                                                        name="_course"
                                                        value={formData._course}
                                                        onChange={(e) => setFormData({ ...formData, _course: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">Select Option</option>
                                                        {courses.map((c) => (
                                                            <option key={c._id} value={c._id} className="text-capitalize">
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-xl-4 mb-1">
                                                    <label>Stream Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        minLength={1}
                                                        maxLength={100}
                                                        name="name"
                                                        placeholder="Stream name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>

                                                <div className="col-xl-4 mb-1 qs-form-actions">
                                                    <button
                                                        type="submit"
                                                        className="qs-edit-btn"
                                                        disabled={view || loading}
                                                    >
                                                        {isEditing ? 'Update' : 'Add'}
                                                    </button>
                                                    {isEditing && (
                                                        <button
                                                            type="button"
                                                            className="qs-cancel-btn"
                                                            onClick={resetForm}
                                                            disabled={loading}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </form>

                                        {!isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => setShowCustomForm((prev) => !prev)}
                                                className={`btn btn-success font-small-3 mb-1 ${view ? 'disabled' : ''}`}
                                                disabled={view}
                                            >
                                                Add Custom Course
                                            </button>
                                        )}

                                        {!isEditing && showCustomForm && (
                                            <form id="hideShowCourse" onSubmit={handleCustomSubmit}>
                                                <div className="row">
                                                    <div className="col-xl-4 mb-1">
                                                        <label>Select Education</label>
                                                        <select
                                                            style={{ cursor: 'pointer' }}
                                                            className="form-control"
                                                            name="_qualification"
                                                            value={customForm._qualification}
                                                            onChange={(e) => setCustomForm({ ...customForm, _qualification: e.target.value })}
                                                            required
                                                        >
                                                            <option value="">Select Option</option>
                                                            {qualifications.map((s) => (
                                                                <option key={s._id} value={s._id} className="text-capitalize">
                                                                    {s.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-xl-4 mb-1 align">
                                                        <label>Stream Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            required
                                                            minLength={1}
                                                            maxLength={100}
                                                            name="name"
                                                            placeholder="Stream name"
                                                            value={customForm.name}
                                                            onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-xl-4 mb-1 qs-form-actions">
                                                        <button
                                                            type="submit"
                                                            className="qs-edit-btn"
                                                            disabled={view || loading}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 rounded equal-height-2 coloumn-2">
                            <div className="card">
                                <div className="row p-1">
                                    <div className="col-xl-6">
                                        <div className="row">
                                            <div className="card-header">
                                                <h4 className="card-title">All Streams</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="table-responsive">
                                        {subQual && subQual.length > 0 ? (
                                            <table className="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Stream Name</th>
                                                        <th>Course</th>
                                                        <th>Qualification</th>
                                                        <th>Status</th>
                                                        {!view && <th>Action</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subQual.map((l) => (
                                                        <tr key={l._id}>
                                                            <td className="text-capitalize">{l.name}</td>
                                                            <td className="text-capitalize">{l._course?.name || ''}</td>
                                                            <td className="text-capitalize">{l._qualification?.name || 'N/A'}</td>

                                                            {view ? (
                                                                <td>{l.status ? 'True' : 'False'}</td>
                                                            ) : (
                                                                <td className="qs-status-cell">
                                                                    <NeoStatusToggle
                                                                        id={`stream-status-${l._id}`}
                                                                        checked={l.status === true || l.status === 'true'}
                                                                        onChange={() => handleStatusToggle(l)}
                                                                    />
                                                                </td>
                                                            )}

                                                            {!view && (
                                                                <td className="qs-action-cell">
                                                                    <button
                                                                        type="button"
                                                                        className="qs-edit-btn"
                                                                        onClick={() => handleEdit(l)}
                                                                    >
                                                                        <i className="feather icon-edit"></i>
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="text-center mt-3">
                                                {loading ? 'Loading...' : 'No result found'}
                                            </p>
                                        )}

                                        {renderPagination()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Stream;