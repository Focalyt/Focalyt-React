import React, { useState, useEffect } from 'react';
import NeoStatusToggle from '../qualificationSetting/NeoStatusToggle';
import '../qualificationSetting/qualificationSetting.css';
import './industrySetting.css';

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9&\s]*$/;

const Industry = ({ view = false }) => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const bucketUrl = (process.env.REACT_APP_MIPIE_BUCKET_URL || '').replace(/\/$/, '');
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = userData.token;

    const API = {
        industries: `${backendUrl}/college/industry`,
        changeStatus: `${backendUrl}/college/industry/changestatus`,
        upload: `${backendUrl}/api/uploadSingleFile/industry`,
    };

    const headers = { 'x-auth': token, 'Content-Type': 'application/json' };

    const [industry, setIndustry] = useState([]);
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchIndustries(page);
    }, [page]);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
    };

    const imageSrc = (key) => (key ? `${bucketUrl}/${key}` : '');

    const fetchIndustries = async (pageNo = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`${API.industries}?page=${pageNo}`, { headers });
            const data = await response.json();
            if (data.status) {
                setIndustry(data.data || []);
                setTotalPages(data.totalPages || 1);
            } else {
                showAlert(data.message || 'Failed to fetch industries', 'error');
            }
        } catch (error) {
            console.error('Error fetching industries:', error);
            showAlert('Failed to fetch industries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setImage('');
        setIsEditing(false);
        setEditingId(null);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showAlert('Please upload an image file', 'error');
            return;
        }

        try {
            setUploading(true);
            const body = new FormData();
            body.append('file', file);
            const response = await fetch(API.upload, {
                method: 'POST',
                headers: { 'x-auth': token },
                body,
            });
            const data = await response.json();
            const key = data?.data?.Key || data?.data?.key;
            if (!data.status || !key) {
                throw new Error(data.message || 'Unable to upload image');
            }
            setImage(key);
        } catch (error) {
            console.error('Error uploading image:', error);
            showAlert(error.message || 'Failed to upload image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || !NAME_PATTERN.test(trimmed)) {
            showAlert('Industry name must start with a letter and can include letters, numbers, spaces, and &', 'error');
            return;
        }

        try {
            setLoading(true);
            const url = isEditing ? `${API.industries}/${editingId}` : API.industries;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({ name: trimmed, image }),
            });
            const data = await response.json();

            if (data.status) {
                showAlert(isEditing ? 'Industry updated successfully!' : 'Industry added successfully!', 'success');
                resetForm();
                fetchIndustries(page);
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving industry:', error);
            showAlert('Failed to save industry', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setName(item.name || '');
        setImage(item.image || '');
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
                    model: 'industry',
                }),
            });
            const data = await response.json();

            if (data.status !== false) {
                setIndustry((prev) =>
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
                            <h3 className="content-header-title float-left mb-0">Industries</h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <a href="/institute/dashboard">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">Industries</li>
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
                                        {isEditing ? 'Update Industry' : 'Add Industry'}
                                    </h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <form className="form-horizontal" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-xl-4 mb-1">
                                                    <label>Industry Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        name="name"
                                                        placeholder="Industry name"
                                                        pattern="[a-zA-Z][a-zA-Z0-9&\s]*"
                                                        minLength={1}
                                                        maxLength={50}
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-xl-4 mb-1">
                                                    <label>Upload image</label>
                                                    {image ? (
                                                        <div className="mt-1">
                                                            <img className="ind-thumb" src={imageSrc(image)} alt="" />
                                                            <div className="ind-image-actions">
                                                                <button type="button" onClick={() => setImage('')}>Remove</button>
                                                                <a href={imageSrc(image)} target="_blank" rel="noreferrer">View</a>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label className="ind-upload-label mt-1" htmlFor="industry-image">
                                                            <img src="/Assets/images/add_receipt.png" alt="" />
                                                            <p className="ind-upload-hint">
                                                                {uploading ? 'Uploading...' : 'Click to upload image'}
                                                            </p>
                                                            <input
                                                                id="industry-image"
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={view || uploading}
                                                                onChange={handleImageChange}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                <div className="col-xl-4 mb-1 qs-form-actions">
                                                    <button
                                                        type="submit"
                                                        className="qs-edit-btn"
                                                        disabled={view || loading || uploading}
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
                                                <h4 className="card-title">All Industry</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="table-responsive">
                                        {industry && industry.length > 0 ? (
                                            <table className="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Industry Name</th>
                                                        <th>Image</th>
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
                                                    {industry.map((row) => (
                                                        <tr key={row._id}>
                                                            <td>{row.name}</td>
                                                            <td>
                                                                {row.image ? (
                                                                    <img className="ind-thumb" src={imageSrc(row.image)} alt="" />
                                                                ) : (
                                                                    'No image'
                                                                )}
                                                            </td>
                                                            {view ? (
                                                                <td>{row.status ? 'True' : 'False'}</td>
                                                            ) : (
                                                                <>
                                                                    <td className="qs-status-cell">
                                                                        <NeoStatusToggle
                                                                            id={`industry-status-${row._id}`}
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

export default Industry;
