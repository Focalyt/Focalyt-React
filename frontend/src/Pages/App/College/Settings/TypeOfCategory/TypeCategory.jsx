import React, { useState, useEffect } from 'react';

function TypeCategory() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    // State management
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        hasDocuments: 'no', // 'yes' | 'no' (kept as string for radio inputs)
        documents: [] // [{ name: string, isMandatory: boolean }]
    });
    const [questions, setQuestions] = useState([]); 
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

        if (formData.hasDocuments === 'yes') {
            if (!Array.isArray(formData.documents) || formData.documents.length === 0) {
                showAlert('Please add at least one document', 'error');
                return;
            }

            const hasEmptyDocName = formData.documents.some((d) => !String(d?.name || '').trim());
            if (hasEmptyDocName) {
                showAlert('Please enter document name for all documents', 'error');
                return;
            }
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
                body: JSON.stringify({
                    ...formData,
                    // If user selected "No", ensure documents are not sent accidentally
                    documents: formData.hasDocuments === 'yes' ? formData.documents : []
                })
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

    // Handle delete
    const handleDelete = async (categoryId, categoryName) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${categoryName}"?`);

        if (!confirmed) return;

        try {
            setLoading(true);

            const response = await fetch(`${backendUrl}/college/b2b/lead-categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.status) {
                setCategories(prev => prev.filter(category => category._id !== categoryId));

                if (editingId === categoryId) {
                    resetForm();
                }

                showAlert('Category deleted successfully!', 'success');
            } else {
                showAlert(data.message || 'Failed to delete category', 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showAlert('Failed to delete category', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle edit button click
    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            hasDocuments: Array.isArray(category?.documents) && category.documents.length > 0 ? 'yes' : 'no',
            documents: Array.isArray(category?.documents)
                ? category.documents.map((d) => ({
                    name: d?.name || '',
                    isMandatory: Boolean(d?.isMandatory)
                }))
                : []
        });
        setIsEditing(true);
        setEditingId(category._id);
    };

    // Reset form
    const resetForm = () => {
        setFormData({ name: '', description: '', hasDocuments: 'no', documents: [] });
        setIsEditing(false);
        setEditingId(null);
        setQuestions([]);
    };

    const handleHasDocumentsChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            hasDocuments: value,
            documents: value === 'yes'
                ? (Array.isArray(prev.documents) && prev.documents.length > 0 ? prev.documents : [{ name: '', isMandatory: true }])
                : []
        }));
    };

    const addDocumentRow = () => {
        setFormData((prev) => ({
            ...prev,
            documents: [...(prev.documents || []), { name: '', isMandatory: true }]
        }));
    };

    const removeDocumentRow = (idx) => {
        setFormData((prev) => ({
            ...prev,
            documents: (prev.documents || []).filter((_, i) => i !== idx)
        }));
    };

    const updateDocumentRow = (idx, patch) => {
        setFormData((prev) => ({
            ...prev,
            documents: (prev.documents || []).map((d, i) => (i === idx ? { ...d, ...patch } : d))
        }));
    };

    const addQuestion = () => {
        setQuestions((prev) => [
            ...(prev || []),
            { question: '', type: 'text', required: true, options: ['Option 1', 'Option 2'] }
        ]);
    };

    const removeQuestion = (idx) => {
        setQuestions((prev) => (prev || []).filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx, patch) => {
        setQuestions((prev) => (prev || []).map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    };

    const addRadioOption = (qIdx) => {
        setQuestions((prev) =>
            (prev || []).map((q, i) => {
                if (i !== qIdx) return q;
                const nextOptions = Array.isArray(q.options) ? [...q.options] : [];
                nextOptions.push(`Option ${nextOptions.length + 1}`);
                return { ...q, options: nextOptions };
            })
        );
    };

    const updateRadioOption = (qIdx, optIdx, value) => {
        setQuestions((prev) =>
            (prev || []).map((q, i) => {
                if (i !== qIdx) return q;
                const nextOptions = Array.isArray(q.options) ? [...q.options] : [];
                nextOptions[optIdx] = value;
                return { ...q, options: nextOptions };
            })
        );
    };

    const removeRadioOption = (qIdx, optIdx) => {
        setQuestions((prev) =>
            (prev || []).map((q, i) => {
                if (i !== qIdx) return q;
                const nextOptions = (Array.isArray(q.options) ? q.options : []).filter((_, oi) => oi !== optIdx);
                return { ...q, options: nextOptions };
            })
        );
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
                                {isEditing ? 'Edit B2B Source' : 'Add B2B Source'}
                            </h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <a href="/">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">
                                        {isEditing ? 'Edit B2B Source' : 'Add B2B Source'}
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
                            <div className="card b2b-card">
                                <div className="card-header b2b-card-header">
                                    <div className="d-flex align-items-start justify-content-between gap-2">
                                        <div>
                                            <h4 className="card-title mb-25">
                                                {isEditing ? 'Edit B2B Source' : 'Add B2B Source'}
                                            </h4>
                                            
                                        </div>
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <div className="form-horizontal b2b-form">
                                            <div className="row">
                                                <div className="col-12 mb-1">
                                                    <label className="b2b-label">
                                                        Enter Category
                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <input
                                                        className="form-control b2b-control"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Enter Category"
                                                        required
                                                        maxLength={50}
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="col-12 mb-1">
                                                    <label className="b2b-label">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        className="form-control b2b-control"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        placeholder="Enter description (optional)"
                                                        rows="3"
                                                        maxLength={200}
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="col-12 mb-1">
                                                    <label className="b2b-label">
                                                        Documents Required?
                                                    </label>
                                                    <div className="b2b-segment mt-50">
                                                        <div className="form-check form-check-inline">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="hasDocuments"
                                                                id="hasDocumentsYes"
                                                                value="yes"
                                                                checked={formData.hasDocuments === 'yes'}
                                                                onChange={() => handleHasDocumentsChange('yes')}
                                                                disabled={loading}
                                                            />
                                                            <label className="form-check-label" htmlFor="hasDocumentsYes">
                                                                Yes
                                                            </label>
                                                        </div>

                                                        <div className="form-check form-check-inline">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="hasDocuments"
                                                                id="hasDocumentsNo"
                                                                value="no"
                                                                checked={formData.hasDocuments === 'no'}
                                                                onChange={() => handleHasDocumentsChange('no')}
                                                                disabled={loading}
                                                            />
                                                            <label className="form-check-label" htmlFor="hasDocumentsNo">
                                                                No
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {formData.hasDocuments === 'yes' && (
                                                    <div className="col-12 mb-1">
                                                        <div className="b2b-section">
                                                            <div className="b2b-section-header">
                                                                <div>
                                                                    <div className="b2b-section-title">
                                                                        Documents
                                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                                    </div>
                                                                    <div className="b2b-section-subtitle">Add required documents for this source.</div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-success b2b-btn"
                                                                    onClick={addDocumentRow}
                                                                    disabled={loading}
                                                                >
                                                                    + Add Document
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="d-none"
                                                                onClick={() => {}}
                                                                disabled
                                                            ></button>

                                                            <div className="mt-1">
                                                                {(formData.documents || []).map((doc, idx) => (
                                                                    <div className="b2b-item-card mb-1" key={`${idx}`}>
                                                                        <div className="row g-1 align-items-end">
                                                                            <div className="col-lg-6 col-md-12">
                                                                                <label className="b2b-label">
                                                                            Document Name
                                                                            <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                                        </label>
                                                                        <input
                                                                            className="form-control b2b-control"
                                                                            value={doc?.name || ''}
                                                                            onChange={(e) => updateDocumentRow(idx, { name: e.target.value })}
                                                                            placeholder="Enter document name"
                                                                            disabled={loading}
                                                                            maxLength={80}
                                                                        />
                                                                    </div>

                                                                            <div className="col-lg-4 col-md-10">
                                                                                <label className="b2b-label">
                                                                            Mandatory?
                                                                            <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                                        </label>
                                                                                <div className="b2b-segment mt-50">
                                                                                    <div className="form-check form-check-inline">
                                                                                <input
                                                                                    className="form-check-input"
                                                                                    type="radio"
                                                                                    name={`docMandatory_${idx}`}
                                                                                    id={`docMandatoryYes_${idx}`}
                                                                                    value="yes"
                                                                                    checked={Boolean(doc?.isMandatory) === true}
                                                                                    onChange={() => updateDocumentRow(idx, { isMandatory: true })}
                                                                                    disabled={loading}
                                                                                />
                                                                                <label className="form-check-label" htmlFor={`docMandatoryYes_${idx}`}>
                                                                                    Yes
                                                                                </label>
                                                                            </div>
                                                                                    <div className="form-check form-check-inline">
                                                                                <input
                                                                                    className="form-check-input"
                                                                                    type="radio"
                                                                                    name={`docMandatory_${idx}`}
                                                                                    id={`docMandatoryNo_${idx}`}
                                                                                    value="no"
                                                                                    checked={Boolean(doc?.isMandatory) === false}
                                                                                    onChange={() => updateDocumentRow(idx, { isMandatory: false })}
                                                                                    disabled={loading}
                                                                                />
                                                                                <label className="form-check-label" htmlFor={`docMandatoryNo_${idx}`}>
                                                                                    No
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                            <div className="col-lg-2 col-md-2 d-flex justify-content-end">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-danger b2b-icon-btn"
                                                                            onClick={() => removeDocumentRow(idx)}
                                                                            disabled={loading || (formData.documents || []).length <= 1}
                                                                            title={(formData.documents || []).length <= 1 ? 'At least one document is required' : 'Remove document'}
                                                                        >
                                                                            <i className="fa-solid fa-xmark"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Questions Builder UI */}
                                                <div className="col-12 mb-1 mt-1">
                                                    <div className="b2b-section">
                                                        <div className="b2b-section-header">
                                                            <div>
                                                                <div className="b2b-section-title">Questions</div>
                                                                <div className="b2b-section-subtitle">Add custom fields you want to collect.</div>
                                                            </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary b2b-btn"
                                                            onClick={addQuestion}
                                                            disabled={loading}
                                                        >
                                                            + Add Question
                                                        </button>
                                                    </div>

                                                    {(questions || []).length > 0 && (
                                                        <div className="mt-1">
                                                            {(questions || []).map((q, qIdx) => (
                                                                <div className="b2b-item-card mb-1" key={`q_${qIdx}`}>
                                                                    <div className="row g-1 align-items-end">
                                                                        <div className="col-lg-6 col-md-12">
                                                                            <label className="b2b-label">Question</label>
                                                                            <input
                                                                                className="form-control b2b-control"
                                                                                value={q?.question || ''}
                                                                                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                                                                                placeholder="Enter question"
                                                                                disabled={loading}
                                                                                maxLength={150}
                                                                            />
                                                                        </div>

                                                                        <div className="col-lg-3 col-md-6">
                                                                            <label className="b2b-label">Type</label>
                                                                            <select
                                                                                className="form-control b2b-control"
                                                                                value={q?.type || 'text'}
                                                                                onChange={(e) => {
                                                                                    const nextType = e.target.value;
                                                                                    updateQuestion(qIdx, {
                                                                                        type: nextType,
                                                                                        options:
                                                                                            nextType === 'radio'
                                                                                                ? (Array.isArray(q?.options) && q.options.length > 0 ? q.options : ['Option 1', 'Option 2'])
                                                                                                : []
                                                                                    });
                                                                                }}
                                                                                disabled={loading}
                                                                            >
                                                                                <option value="text">Text</option>
                                                                                <option value="number">Number</option>
                                                                                <option value="radio">Radio</option>
                                                                            </select>
                                                                        </div>

                                                                        <div className="col-lg-2 col-md-4">
                                                                            <label className="d-block b2b-label">Required</label>
                                                                            <div className="form-check form-switch mt-50">
                                                                                <input
                                                                                    className="form-check-input"
                                                                                    type="checkbox"
                                                                                    checked={Boolean(q?.required)}
                                                                                    onChange={() => updateQuestion(qIdx, { required: !Boolean(q?.required) })}
                                                                                    disabled={loading}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-lg-1 col-md-2 d-flex justify-content-end">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-danger b2b-icon-btn"
                                                                                onClick={() => removeQuestion(qIdx)}
                                                                                disabled={loading}
                                                                                title="Remove question"
                                                                            >
                                                                                <i className="fa-solid fa-xmark"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {q?.type === 'radio' && (
                                                                        <div className="mt-1">
                                                                            <div className="d-flex align-items-center justify-content-between">
                                                                                <label className="mb-0 b2b-label">Radio Options</label>
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-sm btn-outline-success b2b-btn"
                                                                                    onClick={() => addRadioOption(qIdx)}
                                                                                    disabled={loading}
                                                                                >
                                                                                    + Add Option
                                                                                </button>
                                                                            </div>

                                                                            <div className="mt-1">
                                                                                {(Array.isArray(q?.options) ? q.options : []).map((opt, optIdx) => (
                                                                                    <div className="row g-1 align-items-end mb-50" key={`q_${qIdx}_opt_${optIdx}`}>
                                                                                        <div className="col-xl-10 col-lg-10 col-md-10">
                                                                                            <input
                                                                                                className="form-control b2b-control"
                                                                                                value={opt || ''}
                                                                                                onChange={(e) => updateRadioOption(qIdx, optIdx, e.target.value)}
                                                                                                placeholder={`Option ${optIdx + 1}`}
                                                                                                disabled={loading}
                                                                                                maxLength={80}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="col-xl-2 col-lg-2 col-md-2 d-flex justify-content-end">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn btn-sm btn-outline-danger b2b-icon-btn"
                                                                                                onClick={() => removeRadioOption(qIdx, optIdx)}
                                                                                                disabled={loading || (Array.isArray(q?.options) ? q.options.length : 0) <= 2}
                                                                                                title={(Array.isArray(q?.options) ? q.options.length : 0) <= 2 ? 'Keep at least 2 options' : 'Remove option'}
                                                                                            >
                                                                                                <i className="fa-solid fa-xmark"></i>
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>

                                                <div className="col-12 mb-1 d-flex align-items-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success font-small-3 b2b-primary-btn"
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
                                                            className="btn btn-outline-secondary font-small-3 b2b-btn"
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
                                                <h4 className="card-title">All Sources</h4>
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
                                                        <th>Source</th>
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
                                                                    <div className="d-flex gap-2">
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => handleEdit(category)}
                                                                            title="Edit Category"
                                                                            disabled={loading}
                                                                        >
                                                                            <i className="fas fa-edit me-1"></i>
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => handleDelete(category._id, category.name)}
                                                                            title="Delete Category"
                                                                            disabled={loading}
                                                                        >
                                                                            <i className="fas fa-trash me-1"></i>
                                                                            Delete
                                                                        </button>
                                                                    </div>
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
        .b2b-card {
          border: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .b2b-card-header {
          background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
          border-bottom: 1px solid rgba(0,0,0,0.06) !important;
          padding: 1rem 1.25rem;
        }
        .b2b-subtitle{
          color: #6b7280;
          font-size: 0.825rem;
          margin-top: 0.15rem;
        }
        .b2b-form .b2b-label{
          font-weight: 600;
          color: #111827;
          letter-spacing: 0.01em;
          margin-bottom: 0.35rem;
        }
        .b2b-control{
          border-radius: 10px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          background: #fff;
          transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease;
        }
        .b2b-control::placeholder{
          color: #9ca3af;
        }
        .b2b-control:focus{
          border-color: rgba(37, 99, 235, 0.45);
          box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.12);
        }
        .b2b-segment{
          display: flex;
          gap: 1.25rem;
          align-items: center;
          padding: 0.4rem 0.6rem;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          background: #fafafa;
          width: fit-content;
        }
        .b2b-section{
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 14px;
          background: #fcfcfd;
          padding: 0.9rem;
        }
        .b2b-section-header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 0.75rem;
        }
        .b2b-section-title{
          font-weight: 700;
          color: #111827;
          font-size: 0.95rem;
          line-height: 1.15;
        }
        .b2b-section-subtitle{
          color: #6b7280;
          font-size: 0.8rem;
          margin-top: 0.1rem;
        }
        .b2b-item-card{
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          background: #ffffff;
          padding: 0.85rem;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
        }
        .b2b-btn{
          border-radius: 10px;
        }
        .b2b-icon-btn{
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 0;
        }
        .b2b-primary-btn{
          border-radius: 12px;
          padding-left: 1.1rem;
          padding-right: 1.1rem;
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
          text-transform: capitalize;
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
