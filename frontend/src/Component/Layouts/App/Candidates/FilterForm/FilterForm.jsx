import React, { useState, useEffect } from 'react';

const FilterForm = ({ initialData, onSubmit, onReset, isChecked }) => {
  const [formData, setFormData] = useState({
    name: '',
    FromDate: '',
    ToDate: '',
    Profile: '',
    verified: '',
    status: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        status: isChecked ? false : true
      });
    }
  }, [initialData, isChecked]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when field is corrected
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    let hasError = false;
    let firstError = null;

    // Check if fromDate is provided but toDate is not
    if (formData.FromDate && !formData.ToDate) {
      newErrors.ToDate = 'To Date is required when From Date is provided';
      firstError = firstError || 'ToDate';
      hasError = true;
    }

    // Check if toDate is provided but fromDate is not
    if (!formData.FromDate && formData.ToDate) {
      newErrors.FromDate = 'From Date is required when To Date is provided';
      firstError = firstError || 'FromDate';
      hasError = true;
    }

    setErrors(newErrors);
    return { hasError, firstError };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { hasError, firstError } = validate();
    if (hasError) {
      // Focus on the first error field
      if (firstError && document.getElementById(firstError)) {
        document.getElementById(firstError).focus();
      }
      return;
    }
    
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      FromDate: '',
      ToDate: '',
      Profile: '',
      verified: '',
      status: isChecked ? false : true
    });
    setErrors({});
    onReset();
  };

  return (
    <div className="row mb-2">
      <div className="col-xl-12 col-lg-12 px-3">
        <form onSubmit={handleSubmit} id="filterForm">
          <div className="row">
            {/* Name/Mobile/Whatsapp Filter */}
            <div className="col-xl-2 mt-1">
              <label htmlFor="username">Name/ Mobile/ Whatsapp</label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'error' : ''}`}
                id="username"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength="25"
              />
            </div>
            
            {/* From Date Filter */}
            <div className={`col-xl-2 mt-1 ${errors.FromDate ? 'error' : ''}`}>
              <label htmlFor="from-date">From Date</label>
              <input
                type="date"
                className={`form-control ${errors.FromDate ? 'error' : ''}`}
                id="FromDate"
                name="FromDate"
                value={formData.FromDate}
                onChange={handleChange}
              />
              {errors.FromDate && <small className="text-danger">{errors.FromDate}</small>}
            </div>
            
            {/* To Date Filter */}
            <div className={`col-xl-2 mt-1 ${errors.ToDate ? 'error' : ''}`}>
              <label htmlFor="to-date">To Date</label>
              <input
                type="date"
                className={`form-control ${errors.ToDate ? 'error' : ''}`}
                id="ToDate"
                name="ToDate"
                value={formData.ToDate}
                onChange={handleChange}
              />
              {errors.ToDate && <small className="text-danger">{errors.ToDate}</small>}
            </div>
            
            {/* Profile Status Filter */}
            <div className="col-xl-2 mt-1">
              <label htmlFor="profile">Profile</label>
              <select
                className="form-control text-capitalize"
                id="profile"
                name="Profile"
                value={formData.Profile}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option className="text-capitalize" value="All">All</option>
                <option className="text-capitalize" value="true">Completed</option>
                <option className="text-capitalize" value="false">Due</option>
              </select>
            </div>
            
            {/* Verified Status Filter */}
            <div className="col-xl-2 mt-1">
              <label htmlFor="verified">Verfied</label>
              <select
                className="form-control text-capitalize"
                id="verified"
                name="verified"
                value={formData.verified}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option className="text-capitalize" value="true">Verified</option>
                <option className="text-capitalize" value="false">Not Verified</option>
              </select>
            </div>
            
            {/* Hidden status field */}
            <input
              type="hidden"
              name="status"
              value={isChecked ? false : true}
            />
            
            {/* Submit and Reset Buttons */}
            <div style={{ marginTop: '2.5rem !important' }} className="col-xl-2 text-center mt-3">
              <button
                type="submit"
                className="btn btn-success waves-effect waves-light text-white d-inline"
                id="submit-btn"
              >
                Go
              </button>
              
              <button
                type="button"
                className="extra-ss btn btn-danger d-inline waves-effect waves-light mb-2 text-white mx-1"
                onClick={handleReset}
              >
                RESET
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilterForm;