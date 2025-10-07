import React, { useState, useEffect } from 'react';

function TypeCategory() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    // State management
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    // Fetch all categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/college/b2b/lead-categories`, {
                method: 'GET',
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.status) {
                setCategories(data.data || []);
            } else {
                showAlert(data.message || 'Failed to fetch categories', 'error');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showAlert('Failed to fetch categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showAlert('Please enter category name', 'error');
            return;
        }

        try {
            setLoading(true);

            const url = isEditing
                ? `${backendUrl}/college/b2b/lead-categories/${editingId}`
                : `${backendUrl}/college/b2b/lead-categories`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.status) {
                showAlert(
                    isEditing ? 'Category updated successfully!' : 'Category added successfully!',
                    'success'
                );
                resetForm();
                fetchCategories();
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showAlert('Failed to save category', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (categoryId, currentStatus) => {
        try {
            const newStatus = !currentStatus;

            const response = await fetch(`${backendUrl}/college/b2b/lead-categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isActive: newStatus
                })
            });

            const data = await response.json();

            if (data.status) {
                // Update local state
                setCategories(prev => prev.map(category =>
                    category._id === categoryId
                        ? { ...category, isActive: newStatus }
                        : category
                ));
                showAlert('Status updated successfully!', 'success');
            } else {
                showAlert(data.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showAlert('Failed to update status', 'error');
        }
    };

    // Handle edit button click
    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            description: category.description || ''
        });
        setIsEditing(true);
        setEditingId(category._id);
    };

    // Reset form
    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    // Show alert
    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => {
            setAlert({ show: false, message: '', type: '' });
        }, 5000);
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
                <div className="content-header-left col-md-9 col-12 mb-2">
                    <div className="row breadcrumbs-top">
                        <div className="col-12">
                            <h3 className="content-header-title float-left mb-0">
                                {isEditing ? 'Edit B2B Category' : 'Add B2B Category'}
                            </h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <a href="/">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">
                                        {isEditing ? 'Edit B2B Category' : 'Add B2B Category'}
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert */}
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

            {/* Main Content */}
            <div className="content-body">
                <section className="list-view">
                    <div className="row category-main-row">
                        {/* Add B2B Form */}
                        <div className="col-6 equal-height-2 category-form-col">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">
                                        {isEditing ? 'Edit B2B Category' : 'Add B2B Category'}
                                    </h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <div className="form-horizontal">
                                            <div className="row">
                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Enter Category
                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Enter Category"
                                                        required
                                                        maxLength={50}
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Description
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        placeholder="Enter description (optional)"
                                                        rows="3"
                                                        maxLength={200}
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="col-xl-4 mb-1 d-flex align-items-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success font-small-3"
                                                        onClick={handleSubmit}
                                                        disabled={loading || !formData.name.trim()}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                                {isEditing ? 'Updating...' : 'Adding...'}
                                                            </>
                                                        ) : (
                                                            isEditing ? 'Update' : 'Add'
                                                        )}
                                                    </button>

                                                    {isEditing && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary font-small-3"
                                                            onClick={resetForm}
                                                            disabled={loading}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="col-6 rounded equal-height-2 coloumn-2 category-table-col">
                            <div className="card">
                                <div className="row p-1">
                                    <div className="col-xl-6">
                                        <div className="row">
                                            <div className="card-header">
                                                <h4 className="card-title">All Categories</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="table-responsive">
                                        {loading && categories.length === 0 ? (
                                            <div className="text-center p-4">
                                                <div className="spinner-border text-primary"></div>
                                                <p className="mt-2">Loading B2B types...</p>
                                            </div>
                                        ) : (
                                            <table className="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th>Description</th>
                                                        <th>Status</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categories.length > 0 ? (
                                                        categories.map((category) => (
                                                            <tr key={category._id}>
                                                                <td>{category.name}</td>
                                                                <td>
                                                                    <span className="text-muted">
                                                                        {category.description || 'No description'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={category.isActive}
                                                                            onChange={() => handleStatusToggle(category._id, category.isActive)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleEdit(category)}
                                                                        title="Edit Category"
                                                                    >
                                                                        <i className="fas fa-edit me-1"></i>
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center">
                                                                {loading ? 'Loading...' : 'No Categories found'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}

                                        {!loading && categories.length === 0 && (
                                            <p className="text-center mt-3">No result found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
        .asterisk {
          color: red;
        }
        .content-header-title{
        font-size: 1.2rem;
        font-weight: 600;
        color: #000;
        }
        .breadcrumb a {
    font-size: 0.8rem;
      } 
    .breadcrumb-item .active {
    font-size: 0.8rem;
    }
        .card .card-title {
    font-size: 1rem !important;
}
    .table th {
    font-size: 12px !important;
    text-transform: uppercase;
}
    .table-hover-animation thead th {
    border-top: 2px solid #f8f8f8;
    border-bottom: 0;
    background-color: #fff;
}
    label {
    font-size: 0.80rem !important;
}
    label {
    text-transform: capitalize;
}

        
        }
        .card {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 8px;
        }
        
        .card-header {
          border-bottom: 1px solid #dee2e6;
        }
        .table {
    width: 100%;
    margin-bottom: 1rem;
    color: #626262;
}
        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          border-top: none;
        }
        
        .form-control:focus {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }
        
        .btn-success {
          background-color: #28a745;
          border-color: #28a745;
        }
        
        .btn-success:hover {
          background-color: #218838;
          border-color: #1e7e34;
        }
        
        .btn-success:disabled {
          background-color: #6c757d;
          border-color: #6c757d;
        }
        
        .form-check-input:checked {
          background-color: #28a745;
          border-color: #28a745;
        }
        
        .content-header {
          margin-bottom: 2rem;
        }
        
        .breadcrumb {
          background-color: transparent;
          padding: 0;
        }
        
        .alert {
          margin-bottom: 1rem;
        }
        
        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }
        
        .btn-link {
          text-decoration: none;
        }
        
        .btn-link:hover {
          text-decoration: none;
        }
        
        .gap-2 {
          gap: 0.5rem;
        }
        
        .font-small-3 {
          font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
        
          
          .content-header {
            display: none;
          }
          
          
        }

        @media (max-width: 414px) {
          .category-main-row {
            flex-direction: column;
          }
          
          .category-form-col,
          .category-table-col {
            width: 100% !important;
            max-width: 100% !important;
            flex: 0 0 100% !important;
            margin-bottom: 1rem;
          }
          
          .equal-height-2 {
            height: auto !important;
          }
          
          .coloumn-2 {
            margin-top: 0 !important;
          }
          
          .table-responsive {
            font-size: 0.8rem;
          }
          
          .table th,
          .table td {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
          
          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.7rem;
          }
          
          .form-control {
            font-size: 0.8rem;
          }
          
          .card-body {
            padding: 1rem 0.75rem;
          }
        }
      `}</style>
        </div>
    );
}

export default TypeCategory;