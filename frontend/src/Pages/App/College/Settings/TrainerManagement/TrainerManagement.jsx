import React, { useState, useEffect } from 'react';
import axios from 'axios'


function TrainerManagement() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    // State management
    const [trainers, setTrainers] = useState([]);
    
    const [b2bTypes, setB2bTypes] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        designation: '',
        trinerBriefSummary: '',
        cv: null,
        passportSizePhoto: null
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    // Fetch all trainers on component mount
    useEffect(() => {
        // fetchB2bTypes();
        fetchTrainers()
    }, []);

    // Fetch B2B types from API
    // const fetchB2bTypes = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await fetch(`${backendUrl}/college/trainer/trainers`, {
    //             method: 'GET',
    //             headers: {
    //                 'x-auth': token,
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         const data = await response.json();

    //         if (data.status) {
    //             setB2bTypes(data.data || []);
    //         } else {
    //             showAlert(data.message || 'Failed to fetch B2B types', 'error');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching trainers:', error);
    //         showAlert('Failed to fetch trainers', 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const fetchTrainers = async () => {
        try {
            setLoading(true);
    
            const response = await axios.get(
                `${backendUrl}/college/trainer/trainers?all=true`,
                {
                    headers: {
                        'x-auth': token,
                        'Content-Type': 'application/json'
                    }
                }
            );
    console.log("response" , response.data)
    
  
    if (response.data.status && response.data.data) {
        setTrainers(response.data.data);
    } else {
        setTrainers([]);
        showAlert(response.data.message || 'No trainers found', 'warning');
    }
            
        } catch (error) {
            console.error('Error fetching trainers:', error);
            showAlert(
                error?.response?.data?.message || 'Failed to fetch trainers',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };
    


    // Handle form submission
    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
    //         showAlert('Please enter all required fields (Name, Email, Mobile)', 'error');
    //         return;
    //     }

    //     try {
    //         setLoading(true);

    //         const url = isEditing
    //             ? `${backendUrl}/college//${editingId}`
    //             : `${backendUrl}/college/trainer/login`;

    //         const method = isEditing ? 'PUT' : 'POST';

    //         const response = await fetch(url, {
    //             method,
    //             headers: {
    //                 'x-auth': token,
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify(formData)
    //         });

    //         const data = await response.json();

    //         if (data.status) {
    //             showAlert(
    //                 isEditing ? ' type updated successfully!' : 'B2B type added successfully!',
    //                 'success'
    //             );
    //             resetForm();
    //             fetchB2bTypes();
    //         } else {
    //             showAlert(data.message || 'Operation failed', 'error');
    //         }
    //     } catch (error) {
    //         console.error('Error submitting form:', error);
    //         showAlert('Failed to save B2B type', 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!formData.name.trim() || !formData.email.trim() || !String(formData.mobile).trim()) {
            showAlert('Please enter all required fields (Name, Email, Mobile)', 'error');
            return;
        }
    
        try {
            setLoading(true);
    
            const url = isEditing 
                ? `${backendUrl}/college/trainer/update/${editingId}`
                : `${backendUrl}/college/trainer/addTrainer`;
            
            const method = isEditing ? 'PUT' : 'POST';
    
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('mobile', formData.mobile);
            formDataToSend.append('designation', formData.designation || '');
            formDataToSend.append('trainerBriefSummary', formData.trinerBriefSummary || formData.trainerBriefSummary || '');
            
            // Append CV file if it exists
            if (formData.cv && formData.cv instanceof File) {
                formDataToSend.append('cv', formData.cv);
            }
            
            // Append Passport Size Photo if it exists
            if (formData.passportSizePhoto && formData.passportSizePhoto instanceof File) {
                formDataToSend.append('passportSizePhoto', formData.passportSizePhoto);
            }
    
            const response = await axios({
                method,
                url,
                data: formDataToSend,
                headers: {
                    'x-auth': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            const data = response.data;
    
            if (data.status) {
                showAlert(data.message || (isEditing ? 'Trainer updated successfully' : 'Trainer created successfully'), 'success');
                resetForm();
                fetchTrainers(); // Refresh the trainer list
            } else {
                showAlert(data.message || 'Something went wrong', 'error');
            }
        } catch (err) {
            console.error('Error:', err);
            showAlert(err?.response?.data?.message || 'Something went wrong while submitting the form', 'error');
        } finally {
            setLoading(false);
        }
    };
    

    // Handle status toggle
    const handleStatusToggle = async (trainerId, currentStatus) => {
        try {
            const newStatus = !currentStatus;

            const response = await axios.put(
                `${backendUrl}/college/trainer/toggle-status/${trainerId}`,
                { status: newStatus },
                {
                    headers: {
                        'x-auth': token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = response.data;

            if (data.status) {
                // Update local state
                setTrainers(prev => prev.map(trainer =>
                    trainer._id === trainerId
                        ? { ...trainer, status: newStatus }
                        : trainer
                ));
                showAlert('Status updated successfully!', 'success');
            } else {
                showAlert(data.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showAlert(error?.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    // Handle edit button click
    const handleEdit = (trainer) => {
        setFormData({
            name: trainer.name || '',
            email: trainer.email || '',
            mobile: trainer.mobile || '',
            designation: trainer.designation || '',
            trinerBriefSummary: trainer.trainerBriefSummary || '',
            cv: trainer.cv || null,
            passportSizePhoto: trainer.passportSizePhoto || null
        });
        setIsEditing(true);
        setEditingId(trainer._id);
    };

    // Reset form
    const resetForm = () => {
        setFormData({ name: '', email: '', mobile: '', designation: '', trinerBriefSummary: '', cv: null, passportSizePhoto: null });
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
                                {isEditing ? 'Edit Trainer' : 'Add Trainer'}
                            </h3>
                            <div className="breadcrumb-wrapper col-12">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <a href="/">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">
                                        {isEditing ? 'Edit Trainer' : 'Add Trainer'}
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
                    <div className="row trainer-main-row">
                        {/* Add B2B Form */}
                        <div className="col-6 equal-height-2 trainer-form-col">
                            <div className="card">
                                <div className="card-header border border-top-0 border-left-0 border-right-0">
                                    <h4 className="card-title pb-1">
                                        {isEditing ? 'Edit Trainer' : 'Add Trainer'}
                                    </h4>
                                </div>
                                <div className="card-content">
                                    <div className="card-body">
                                        <div className="form-horizontal">
                                            <div className="row">
                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Enter Trainer Name
                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Enter Trainer Name"
                                                        required
                                                        maxLength={50}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Enter Trainer Email
                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <input type="email"
                                                        className="form-control"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        placeholder="Enter Trainer Email"
                                                        required
                                                        maxLength={50}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Enter Trainer Number
                                                        <span className="asterisk" style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <input type="number"
                                                        className="form-control"
                                                        name="mobile"
                                                        value={formData.mobile}
                                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                        placeholder="Enter Trainer Number"
                                                        required
                                                        maxLength={50}
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Designation
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="designation"
                                                        value={formData.designation}
                                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                        placeholder="Enter designation (optional)"
                                                        required
                                                        maxLength={50}
                                                        disabled={loading}
                                                    />

                                                </div>

                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Triner Brief Summary
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        name="trinerBriefSummary"
                                                        value={formData.trinerBriefSummary}
                                                        onChange={(e) => setFormData({ ...formData, trinerBriefSummary: e.target.value })}
                                                        placeholder="Enter trainer brief summary"
                                                        rows={3}
                                                        maxLength={500}
                                                        disabled={loading}
                                                    />

                                                </div>

                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        Passport size Photo (JPG, PNG)
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="passportSizePhoto"
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png"
                                                        onChange={(e) => setFormData({ ...formData, passportSizePhoto: e.target.files[0] || null })}
                                                        disabled={loading}
                                                    />
                                                    {formData.passportSizePhoto && typeof formData.passportSizePhoto === 'string' && (
                                                        <small className="text-muted d-block mt-1">
                                                            Current Photo: <a href={formData.passportSizePhoto} target="_blank" rel="noopener noreferrer">View Photo</a>
                                                        </small>
                                                    )}
                                                    {formData.passportSizePhoto && formData.passportSizePhoto instanceof File && (
                                                        <small className="text-success d-block mt-1">
                                                            Selected: {formData.passportSizePhoto.name}
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="col-xl-8 mb-1">
                                                    <label>
                                                        CV (PDF, DOC, DOCX)
                                                    </label>
                                                    <input
                                                        className="form-control"
                                                        name="cv"
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={(e) => setFormData({ ...formData, cv: e.target.files[0] || null })}
                                                        disabled={loading}
                                                    />
                                                    {formData.cv && typeof formData.cv === 'string' && (
                                                        <small className="text-muted d-block mt-1">
                                                            Current CV: <a href={formData.cv} target="_blank" rel="noopener noreferrer">View CV</a>
                                                        </small>
                                                    )}
                                                    {formData.cv && formData.cv instanceof File && (
                                                        <small className="text-success d-block mt-1">
                                                            Selected: {formData.cv.name}
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="col-xl-4 mb-1 d-flex align-items-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success font-small-3"
                                                        onClick={handleSubmit}
                                                        disabled={loading || !formData.name.trim() || !formData.email.trim() || !String(formData.mobile).trim()}
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

                        {/* Centers List */}
                        <div className="col-6 rounded equal-height-2 coloumn-2 trainer-table-col">
                            <div className="card">
                                <div className="row p-1">
                                    <div className="col-xl-6">
                                        <div className="row">
                                            <div className="card-header">
                                                <h4 className="card-title">All Trainers</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="table-responsive">
                                        {loading && trainers.length === 0 ? (
                                            <div className="text-center p-4">
                                                <div className="spinner-border text-primary"></div>
                                                <p className="mt-2">Loading Trainers...</p>
                                            </div>
                                        ) : (
                                            <table className="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th style={{whiteSpace: 'nowrap'}}>Trainer Name</th>
                                                        <th>Trainer Email</th>
                                                        <th>Designation</th>
                                                        <th>Status</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trainers.length > 0 ? (
                                                        trainers.map((trainer) => (
                                                            <tr key={trainer._id}>
                                                                <td style={{whiteSpace: 'nowrap'}}>{trainer.name || 'N/A'}</td>
                                                                <td>{trainer.email || 'N/A'}</td>
                                                                <td>{trainer.designation || 'N/A'}</td>
                                                                <td>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={trainer.status}
                                                                            onChange={() => handleStatusToggle(trainer._id, trainer.status)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleEdit(trainer)}
                                                                        title="Edit Trainer"
                                                                    >
                                                                        <i className="fas fa-edit me-1"></i>
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="text-center">
                                                                {loading ? 'Loading...' : 'No Trainers found'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}

                                        {/* {!loading && b2bTypes.length === 0 && (
                                            <p className="text-center mt-3">No result found</p>
                                        )} */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
            .trainer-main-row .table-responsive tbody tr td{
            font-size: 1rem;
            }
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
          .trainer-main-row {
            flex-direction: column;
          }
          
          .trainer-form-col,
          .trainer-table-col {
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

export default TrainerManagement;