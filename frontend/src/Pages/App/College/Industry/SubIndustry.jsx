import React, { useState, useEffect } from 'react';
import NeoStatusToggle from '../qualificationSetting/NeoStatusToggle';
import '../qualificationSetting/qualificationSetting.css';

const emptyForm = { name: '', _industry: '' };

const SubIndustry = ({ view = false }) => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = userData.token;

    const API = {
        industries: `${backendUrl}/college/industry`,
        subIndustries: `${backendUrl}/college/industry/sub`,
        changeStatus: `${backendUrl}/college/industry/changestatus`,
    };

    const headers = { 'x-auth': token, 'Content-Type': 'application/json' };

    const [subIndustry, setSubIndustry] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchIndustries();
    }, []);

    useEffect(() => {
        fetchSubIndustries(page);
    }, [page]);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
    };

    const fetchIndustries = async () => {
        try {
            const response = await fetch(API.industries, { headers });
            const data = await response.json();
            if (data.status) setIndustries(data.data || []);
        } catch (error) {
            console.error('Error fetching industries:', error);
        }
    };

    const fetchSubIndustries = async (pageNo = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`${API.subIndustries}?page=${pageNo}`, { headers });
            const data = await response.json();
            if (data.status) {
                setSubIndustry(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                showAlert(data.message || 'Failed to fetch sub industries', 'error');
            }
        } catch (error) {
            console.error('Error fetching sub industries:', error);
            showAlert('Failed to fetch sub industries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData._industry) {
            showAlert('Please fill all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            const url = isEditing ? `${API.subIndustries}/${editingId}` : API.subIndustries;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({
                    name: formData.name.trim(),
                    _industry: formData._industry,
                }),
            });
            const data = await response.json();

            if (data.status) {
                showAlert(
                    isEditing ? 'Sub industry updated successfully!' : 'Sub industry added successfully!',
                    'success'
                );
                resetForm();
                fetchSubIndustries(page);
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving sub industry:', error);
            showAlert('Failed to save sub industry', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        const industryId = item._industry?._id || item._industry || '';
        const industryName = item._industry?.name;
        if (industryId && industryName && !industries.some((row) => row._id === industryId)) {
            setIndustries((prev) => [...prev, { _id: industryId, name: industryName }]);
        }
        setFormData({ name: item.name || '', _industry: industryId });
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
                    model: 'subIndustry',
                }),
            });
            const data = await response.json();

            if (data.status !== false) {
                setSubIndustry((prev) =>
                    prev.map((row) => (row._id === item._id ? { ...row, status: newStatus } : row))
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
                            <h3 className="content-header-title float-left mb-0">Sub Industries</h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <a href="/institute/dashboard">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">Sub Industries</li>
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
                                        {isEditing ? 'Update Sub Industry' : 'Add Sub Industry'}
                                    </h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <form className="form-horizontal" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-xl-4 mb-1">
                                                    <label>Sub Industry Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        name="name"
                                                        placeholder="Sub industry name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>

                                                <div className="col-xl-4 mb-1">
                                                    <label>Select Industry</label>
                                                    <select
                                                        className="form-control"
                                                        name="_industry"
                                                        required
                                                        style={{ cursor: 'pointer' }}
                                                        value={formData._industry}
                                                        onChange={(e) => setFormData({ ...formData, _industry: e.target.value })}
                                                    >
                                                        <option value="">Select Option</option>
                                                        {industries.map((item) => (
                                                            <option key={item._id} value={item._id} className="text-capitalize">
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                    </select>
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
                                                <h4 className="card-title">All Sub Industry</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="table-responsive">
                                        {subIndustry && subIndustry.length > 0 ? (
                                            <table className="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Sub Industry Name</th>
                                                        <th>Industry</th>
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
                                                    {subIndustry.map((row) => (
                                                        <tr key={row._id}>
                                                            <td className="text-capitalize">{row.name}</td>
                                                            <td className="text-capitalize">{row._industry?.name || ''}</td>
                                                            {view ? (
                                                                <td>{row.status ? 'True' : 'False'}</td>
                                                            ) : (
                                                                <>
                                                                    <td className="qs-status-cell">
                                                                        <NeoStatusToggle
                                                                            id={`sub-industry-status-${row._id}`}
                                                                            checked={row.status === true || row.status === 'true'}
                                                                            onChange={() => handleStatusToggle(row)}
                                                                        />
                                                                    </td>
                                                                    <td className="qs-action-cell">
                                                                        <button
                                                                            type="button"
                                                                            className="qs-edit-btn"
                                                                            onClick={() => handleEdit(row)}
                                                                        >
                                                                            <i className="feather icon-edit"></i>
                                                                            Edit
                                                                        </button>
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

export default SubIndustry;
