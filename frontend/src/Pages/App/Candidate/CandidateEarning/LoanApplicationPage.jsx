import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoanApplicationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    purpose: '',
    amount: '',
    salary: '',
    remarks: ''
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  
  // Define loan purpose options (replace with your actual constants)
  const loanPurpose = {
    Bike: "bike_loan",
    Home: "home_loan",
    Wedding: "wedding_loan",
    Education: "education_loan",
    Car: "car_loan",
    Business: "business_loan",
    Others: "others"
  };

  useEffect(() => {
    // Check for any server-provided error message (equivalent to EJS' errMessage)
    // This might come from query params or context depending on your routing
    const urlParams = new URLSearchParams(window.location.search);
    const errMessage = urlParams.get('errMessage');
    
    if (errMessage) {
      setIsSubmitDisabled(true);
      setErrorMessage(errMessage);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: false
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.purpose.trim()) {
      newErrors.purpose = true;
      isValid = false;
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return false;
    }
    
    // Prepare data for submission
    const body = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '') {
        body[key] = formData[key];
      }
    });

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Send request to server
      const result = await axios.post('/candidate/requestLoan', body, {
        headers: { 'x-auth': token }
      });
      
      if (result.data.status === false) {
        setErrorMessage(result.data.message);
        setSuccessMessage('');
      }
      
      if (result.data.status === true) {
        setErrorMessage('');
        setSuccessMessage(result.data.message);
        
        // Optional: Reset form on success
        // setFormData({
        //   purpose: '',
        //   amount: '',
        //   salary: '',
        //   remarks: ''
        // });
      }
    } catch (error) {
      console.error('Error submitting loan request:', error);
      setErrorMessage('An error occurred while submitting your loan application. Please try again.');
    }
  };

  const handleReset = () => {
    // Navigate to the same page which will reset the form
    navigate('/candidate/requestLoan');
  };

  return (
    <div className="">
      <div className="content-overlay"></div>
      <div className="header-navbar-shadow"></div>
      <div className="content-wrapper">
        {/* Breadcrumb section */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Apply for Loan</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/candidate/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item"><a href="#">Apply for Loan</a>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header border border-top-0 border-left-0 border-right-0">
            <h3 className="card-title pb-1">Loan Application / ऋण आवेदन </h3>
          </div>
          <div className="content-body">
            <section id="requestLoan-section">
              <form onSubmit={handleSubmit} className="col-xl-12 p-3">
                <div className="row mt-2">
                  <div className={`col-xl-3 col-lg-3 col-ms-3 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-2 mb-sm-2 mb-2 ${errors.purpose ? 'error' : ''}`} id="purpose">
                    <label>Select Purpose / उद्देश्य का चयन करें<span className="mandatory"> *</span></label>
                    <select 
                      className="form-control text-capitalize" 
                      id="loanPurpose" 
                      name="purpose" 
                      value={formData.purpose}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Option</option>
                      <option value={loanPurpose.Bike}>Bike Loan / बाइक लोन</option>
                      <option value={loanPurpose.Home}>Home Loan / घर के लिए</option>
                      <option value={loanPurpose.Wedding}>Marriage / शादी</option>
                      <option value={loanPurpose.Education}>Education / शिक्षा</option>
                      <option value={loanPurpose.Car}>Car Loan / कार लोन</option>
                      <option value={loanPurpose.Business}>For Business / व्यापार के लिए</option>
                      <option value={loanPurpose.Others}>Others / अन्य</option>
                    </select>
                  </div>
                  <div className={`col-xl-3 col-lg-3 col-ms-3 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-2 mb-sm-2 mb-2 ${errors.amount ? 'error' : ''}`} id="amount">
                    <label>Select Amount / राशि का चयन करें<span className="mandatory"> *</span></label>
                    <select 
                      className="form-control text-capitalize" 
                      id="loanAmount" 
                      name="amount" 
                      value={formData.amount}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Option</option>
                      <option value="20000">Rs. 20,000</option>
                      <option value="50000">Rs. 50,000</option>
                      <option value="80000">Rs. 80,000</option>
                      <option value="100000">Rs. 1,00,000</option>
                      <option value="200000">Rs. 2,00,000</option>
                      <option value="500000">Rs. 5,00,000</option>
                    </select>
                  </div>
                  <div className="col-xl-3 col-lg-3 col-ms-3 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-2 mb-sm-2 mb-2" id="salary">
                    <label>Current Salary / वर्तमान वेतन </label>
                    <input 
                      type="number" 
                      name="salary" 
                      className="form-control" 
                      value={formData.salary} 
                      onChange={handleInputChange}
                      maxLength="6"
                      id="loan-salary"
                    />
                  </div>
                  <div className="col-xl-3 col-lg-3 col-ms-3 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-2 mb-sm-2 mb-2" id="remarks">
                    <label>Remarks / टिप्पणियां</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="remarks" 
                      name="remarks" 
                      value={formData.remarks}
                      onChange={handleInputChange}
                      maxLength="100"
                    />
                  </div>
                </div>
                <div className="row mt-2 requestLoan-btn">
                  <div className="col-12 mb-2">
                    <button type="button" className="btn btn-danger me-3" onClick={handleReset}>Reset</button>
                    <button 
                      type="submit" 
                      className={`btn btn-success ${isSubmitDisabled ? 'disabled' : ''}`} 
                      id="submit-btn"
                      disabled={isSubmitDisabled}
                    >
                      Submit
                    </button>
                  </div>
                </div>
                <div className="row mb-1">
                  <div className="col-xl-12">
                    {errorMessage && (
                      <div id="msg" style={{ color: 'red' }}>
                        {errorMessage}
                      </div>
                    )}
                    {successMessage && (
                      <div id="success" style={{ color: 'green' }}>
                        {successMessage}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplicationPage;