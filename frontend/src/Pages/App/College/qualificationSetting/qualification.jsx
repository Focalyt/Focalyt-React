import React, { useState, useEffect } from 'react';
import NeoStatusToggle from './NeoStatusToggle';
import './qualificationSetting.css';

const Qualification = ({ view = false }) => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    const API = {
        qualifications: `${backendUrl}/college/qualification`,
        changeStatus: `${backendUrl}/college/qualification/changestatus`
    };

    const headers = { 'x-auth': token, 'Content-Type': 'application/json' };

    const [qual, setQual] = useState([]);
    const [name, setName] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchQualifications(page);
    }, [page]);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
    };

    const fetchQualifications = async (pageNo = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`${API.qualifications}?page=${pageNo}`, { headers });
            const data = await response.json();
            if (data.status) {
                setQual(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                showAlert(data.message || 'Failed to fetch qualifications', 'error');
            }
        } catch (error) {
            console.error('Error fetching qualifications:', error);
            showAlert('Failed to fetch qualifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            showAlert('Please enter qualification', 'error');
            return;
        }

        try {
            setLoading(true);
            const url = isEditing ? `${API.qualifications}/${editingId}` : API.qualifications;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({ name })
            });
            const data = await response.json();

            if (data.status) {
                showAlert(
                    isEditing ? 'Qualification updated successfully!' : 'Qualification added successfully!',
                    'success'
                );
                resetForm();
                fetchQualifications(page);
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving qualification:', error);
            showAlert('Failed to save qualification', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setName(item.name || '');
        setIsEditing(true);
        setEditingId(item._id);
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
                    model: 'qualification'
                })
            });
            const data = await response.json();

            if (data.status !== false) {
                setQual((prev) =>
                    prev.map((q) => (q._id === item._id ? { ...q, status: newStatus } : q))
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
            <ul className="pagination justify-content-end ml-2 mb-2 mt-1 mr-1">
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
                            <h3 className="content-header-title float-left mb-0">Qualification</h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        {/* <a href={`${backendUrl}/admin`}>Home</a> */}
                                        <a href="/">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">Qualification</li>
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
                                        {isEditing ? 'Update Qualification' : 'Add Qualification'}
                                    </h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <form className="form-horizontal" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-xl-4 mb-1">
                                                    <label>Qualification</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        minLength={1}
                                                        maxLength={50}
                                                        required
                                                        name="name"
                                                        placeholder="Qualification"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
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
                                                <h4 className="card-title">Qualification List</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="table-responsive">
                                        {qual && qual.length > 0 ? (
                                            <table className="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Qualification</th>
                                                        {view ? (
                                                            <th>Status</th>
                                                        ) : (
                                                            <>
                                                                <th>Status</th>
                                                                <th>Action</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {qual.map((l) => (
                                                        <tr key={l._id}>
                                                            <td>{l.name}</td>

                                                            {view ? (
                                                                <td>{l.status ? 'True' : 'False'}</td>
                                                            ) : (
                                                                <>
                                                                    <td className="qs-status-cell">
                                                                        <NeoStatusToggle
                                                                            id={`qualification-status-${l._id}`}
                                                                            checked={l.status === true || l.status === 'true'}
                                                                            onChange={() => handleStatusToggle(l)}
                                                                        />
                                                                    </td>
                                                                    <td className="qs-action-cell">
                                                                        {l.basic !== true && (
                                                                            <button
                                                                                type="button"
                                                                                className="qs-edit-btn"
                                                                                onClick={() => handleEdit(l)}
                                                                            >
                                                                                <i className="feather icon-edit"></i>
                                                                                Edit
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </>
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

export default Qualification;