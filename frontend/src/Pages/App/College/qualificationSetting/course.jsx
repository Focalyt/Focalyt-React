import React, { useState, useEffect } from 'react';
import NeoStatusToggle from './NeoStatusToggle';
import './qualificationSetting.css';

const Course = ({ view = false }) => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    const API = {
        qualifications: `${backendUrl}/college/qualification`,
        courses: `${backendUrl}/college/qualification/course`,
        changeStatus: `${backendUrl}/college/qualification/changestatus`
    };

    const headers = { 'x-auth': token, 'Content-Type': 'application/json' };

    const [qualifications, setQualifications] = useState([]);
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({ _qualification: '', name: '' });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchQualifications();
    }, []);

    useEffect(() => {
        fetchCourses(page);
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

    const fetchCourses = async (pageNo = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`${API.courses}?page=${pageNo}`, { headers });
            const data = await response.json();
            if (data.status) {
                setCourses(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                showAlert(data.message || 'Failed to fetch courses', 'error');
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            showAlert('Failed to fetch courses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ _qualification: '', name: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData._qualification) {
            showAlert('Please select education', 'error');
            return;
        }
        if (!formData.name.trim()) {
            showAlert('Please enter course name', 'error');
            return;
        }

        try {
            setLoading(true);
            const url = isEditing ? `${API.courses}/${editingId}` : API.courses;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.status) {
                showAlert(isEditing ? 'Course updated successfully!' : 'Course added successfully!', 'success');
                resetForm();
                fetchCourses(page);
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving course:', error);
            showAlert('Failed to save course', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course) => {
        setFormData({
            _qualification: course._qualification?._id || '',
            name: course.name || ''
        });
        setIsEditing(true);
        setEditingId(course._id);
    };

    const handleStatusToggle = async (course) => {
        const newStatus = !(course.status === true || course.status === 'true');
        try {
            const response = await fetch(API.changeStatus, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: course._id,
                    status: newStatus,
                    model: 'QualificationCourse'
                })
            });
            const data = await response.json();

            if (data.status !== false) {
                setCourses((prev) =>
                    prev.map((c) => (c._id === course._id ? { ...c, status: newStatus } : c))
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
            <ul className="pagination justify-content-end ml-2 mb-2 mt-1 mr-1">
                {first > 1 && (
                    <li className="page-item">
                        <button type="button" className="page-link" onClick={() => setPage(1)}>First</button>
                    </li>
                )}
                {pages.map((i) => (
                    <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setPage(i)}>{i}</button>
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
                            <h3 className="content-header-title float-left mb-0">Course</h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        {/* <a href={`${backendUrl}/admin`}>Home</a> */}
                                        <a href="/">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">
                                        {isEditing ? 'Update Course' : 'Add Course'}
                                    </li>
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
                                        {isEditing ? 'Update Course' : 'Add Course'}
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
                                                        onChange={(e) => setFormData({ ...formData, _qualification: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">Select Option</option>
                                                        {qualifications.map((q) => (
                                                            <option key={q._id} value={q._id} className="text-capitalize">
                                                                {q.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-xl-4 mb-1">
                                                    <label>Course</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        minLength={1}
                                                        maxLength={50}
                                                        required
                                                        name="name"
                                                        placeholder="Course"
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
                                                <h4 className="card-title">All Courses</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="table-responsive">
                                        <table className="table table-hover-animation mb-0 table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Education</th>
                                                    <th>Course</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courses.length > 0 ? (
                                                    courses.map((edu) => (
                                                        <tr key={edu._id}>
                                                            <td>{edu._qualification?.name || 'N/A'}</td>
                                                            <td>{edu.name}</td>
                                                            <td className="qs-status-cell">
                                                                <NeoStatusToggle
                                                                    id={`course-status-${edu._id}`}
                                                                    checked={!!edu.status}
                                                                    onChange={() => handleStatusToggle(edu)}
                                                                    disabled={view}
                                                                />
                                                            </td>
                                                            <td className="qs-action-cell">
                                                                <button
                                                                    type="button"
                                                                    className="qs-edit-btn"
                                                                    onClick={() => handleEdit(edu)}
                                                                >
                                                                    <i className="feather icon-edit"></i>
                                                                    Edit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center">
                                                            {loading ? 'Loading...' : 'No education data found'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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

export default Course;