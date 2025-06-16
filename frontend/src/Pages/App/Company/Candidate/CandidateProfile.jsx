import React, { useState, useEffect } from 'react';

const CandidateProfile = ({ candidateId = "default-candidate-id" }) => {
  // Add inline styles for elements that might not have CSS
  const inlineStyles = {
    preloader: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontSize: '18px'
    },
    expBadge: {
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      display: 'inline-block'
    },
    dwnloadBtn: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      textDecoration: 'none',
      display: 'inline-block'
    },
    bgCsOne: {
      backgroundColor: '#17a2b8'
    },
    bgCsTwo: {
      backgroundColor: '#28a745'
    },
    voucherBtn: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    popupBg: {
      backgroundColor: '#6c757d'
    },
    innerBorder: {
      border: '1px solid #dee2e6'
    }
  };

  // State management
  const [candidate, setCandidate] = useState({});
  const [hiringStatus, setHiringStatus] = useState(null);
  const [company, setCompany] = useState({});
  const [jobs, setJobs] = useState([]);
  const [qualification, setQualification] = useState([]);
  const [coins, setCoins] = useState({});
  const [masked, setMasked] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showAddCoins, setShowAddCoins] = useState(false);
  const [showCoinOffer, setShowCoinOffer] = useState(false);
  const [showApplyVoucher, setShowApplyVoucher] = useState(false);
  
  // Form states
  const [statusForm, setStatusForm] = useState({
    status: '',
    job: '',
    eventDate: '',
    concernedPerson: '',
    comment: ''
  });
  
  const [voucher, setVoucher] = useState('');
  const [paymentData, setPaymentData] = useState({
    offerId: '',
    amount: '',
    offerAmount: ''
  });
  const [offers, setOffers] = useState([]);
  const [voucherMessage, setVoucherMessage] = useState({ success: '', error: '' });

  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_MIPIE_RAZORPAY_KEY;

  // Load data on component mount
  useEffect(() => {
    loadCandidateData();
  }, [candidateId]);

  const loadCandidateData = async () => {
    try {
      // Load candidate, hiring status, company, jobs, etc.
      // This would be multiple API calls in real implementation
      const token = localStorage.getItem('token');
      
      // Example API calls - adjust endpoints as needed
      const candidateRes = await fetch(`${backendUrl}/company/candidate/${candidateId}`, {
        headers: { 'x-auth': token }
      });
      const candidateData = await candidateRes.json();
      
      setCandidate(candidateData.candidate);
      setHiringStatus(candidateData.hiringStatus);
      setCompany(candidateData.company);
      setJobs(candidateData.jobs);
      setQualification(candidateData.qualification);
      setCoins(candidateData.coins);
      setMasked(candidateData.masked);
      
      // Initialize status form with current hiring status
      if (candidateData.hiringStatus) {
        setStatusForm({
          status: candidateData.hiringStatus.status || '',
          job: candidateData.hiringStatus.job?._id || '',
          eventDate: candidateData.hiringStatus.eventDate ? formatDate(candidateData.hiringStatus.eventDate) : '',
          concernedPerson: candidateData.hiringStatus.concernedPerson || '',
          comment: candidateData.hiringStatus.comment || ''
        });
      }
    } catch (error) {
      console.error('Error loading candidate data:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'NA';
    return new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonthYear = (date) => {
    if (!date) return 'NA';
    return new Date(date).toLocaleDateString('en-GB', { 
      month: 'short', 
      year: 'numeric'
    });
  };

  const maskUnmask = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (masked) {
        const res = await fetch(`${backendUrl}/company/get-candidate-details?userId=${candidateId}`, {
          headers: { 'x-auth': token }
        });
        
        if (res.ok) {
          const data = await res.json();
          setCandidate(prev => ({
            ...prev,
            mobile: data.mobile,
            email: data.email
          }));
          setMasked(false);
          
          // Refresh credit count
          const creditRes = await fetch(`${backendUrl}/company/getCreditCount`, {
            headers: { 'x-auth': token }
          });
          const creditData = await creditRes.json();
          setCompany(prev => ({ ...prev, creditLeft: creditData.credit }));
        } else if (res.status === 400) {
          setShowAddCoins(true);
        }
      }
    } catch (error) {
      console.error('Error unmasking candidate:', error);
    }
  };

  const downloadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/company/createResume/${candidateId}`, {
        headers: { 'x-auth': token }
      });
      const data = await res.json();
      window.open(data.uploadData, '_blank');
    } catch (error) {
      console.error('Error downloading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = () => {
    if (candidate.resume) {
      window.open(`${bucketUrl}/${candidate.resume}`, '_blank');
    }
  };

  const updateStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const body = {
        candidate: candidateId,
        ...statusForm
      };
      
      await fetch(`${backendUrl}/company/candidate/statusUpdate`, {
        method: 'POST',
        headers: { 
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      setShowUpdateStatus(false);
      loadCandidateData(); // Reload data
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/company/getCoinOffers`, {
        headers: { 'x-auth': token }
      });
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.error('Error getting offers:', error);
    }
  };

  const handleOfferSelect = (offerId, amount) => {
    setPaymentData({
      offerId,
      amount,
      offerAmount: amount
    });
  };

  const applyVoucher = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        amount: paymentData.offerAmount,
        code: voucher,
        offerId: paymentData.offerId
      };
      
      const res = await fetch(`${backendUrl}/company/checkvoucher`, {
        method: 'PUT',
        headers: { 
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (result.status) {
        setVoucherMessage({ success: result.message, error: '' });
        setPaymentData(prev => ({ ...prev, amount: result.amount }));
        
        if (result.amount === 0) {
          window.location.reload();
        }
      } else {
        setVoucherMessage({ success: '', error: result.message });
        setVoucher('');
        setPaymentData(prev => ({ ...prev, amount: prev.offerAmount }));
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
    }
  };

  const makePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        offerId: paymentData.offerId,
        amount: paymentData.amount
      };
      
      const res = await fetch(`${backendUrl}/company/payment`, {
        method: 'POST',
        headers: { 
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      const options = {
        key: razorpayKey,
        amount: result.order.amount,
        currency: result.order.currency,
        name: "MiPie",
        description: "",
        image: "/images/logo/logo.png",
        order_id: result.order.id,
        handler: async (response) => {
          const paymentData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            _company: result.company._id,
            _offer: data.offerId,
            amount: data.amount,
            code: voucher
          };
          
          await fetch(`${backendUrl}/company/paymentStatus`, {
            method: 'POST',
            headers: { 
              'x-auth': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
          });
          
          window.location.reload();
        },
        prefill: {
          name: result.company.name,
          email: result.company.email,
          contact: result.company._concernPerson.mobile
        },
        theme: {
          color: "#FC2B5A"
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error making payment:', error);
    }
  };

  const Modal = ({ show, onClose, title, children, footer }) => {
    if (!show) return null;
    
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-white text-uppercase">{title}</h5>
              <button type="button" className="close" onClick={onClose}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body pt-1">
              {children}
            </div>
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading && (
        <div style={inlineStyles.preloader}>
          Loading...
        </div>
      )}
      
      <div>
        <section id="Concerned-Person">
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3 hiring-head">
              
              {/* Hiring Status Table */}
              {hiringStatus && (
                <div className="card mb-2">
                  <div className="card-header border border-top-0 border-left-0 border-right-0 py-1 px-1">
                    <h4 className="card-title">
                      <img src="/images/icons/hiring.png" className="img-fluid pr-1" />
                      Hiring Status
                    </h4>
                  </div>
                  <div className="card-content">
                    <div className="table-responsive">
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Current Status</th>
                            <th>Status Change Date</th>
                            <th>JD</th>
                            <th>Event DATE/TIME</th>
                            <th>COMMENT</th>
                            <th>Concerned Person</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-capitalize">
                              {hiringStatus.status || "NA"}
                            </td>
                            <td title={formatDisplayDate(hiringStatus.updatedAt)}>
                              {formatDisplayDate(hiringStatus.updatedAt)}
                            </td>
                            <td className="text-capitalize">
                              {hiringStatus.job?.title || "NA"}
                            </td>
                            <td>{formatDisplayDate(hiringStatus.eventDate)}</td>
                            <td title={hiringStatus.comment}>
                              {hiringStatus.comment || "NA"}
                            </td>
                            <td>
                              {hiringStatus.concernedPerson ? 
                                company?.companyExecutives?.find(exec => 
                                  exec._id === hiringStatus.concernedPerson
                                )?.name || 'NA' : 'NA'}
                            </td>
                            <td>
                              <button 
                                className="btn btn-primary me-3 waves-effect waves-light btn-sm"
                                style={{ fontSize: '12px' }}
                                onClick={() => setShowUpdateStatus(true)}
                              >
                                Click
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                {/* Left Column - Candidate Info */}
                <div className="col-xl-4">
                  <div className="card bg-white shadow">
                    <div className="card-body">
                      <div className="user-avatar-section">
                        <div className="d-flex align-items-center flex-column border-bottom mb-2 pb-2">
                          {candidate.image ? (
                            <img 
                              className="img-fluid rounded mb-2 mt-2" 
                              height="60" 
                              width="80"
                              src={`${bucketUrl}/${candidate.image}`}
                              alt="User avatar"
                            />
                          ) : (
                            <img 
                              className="img-fluid rounded mb-2 mt-2" 
                              src="/images/elements/1.png" 
                              alt="User avatar"
                            />
                          )}
                          <div className="user-info text-center">
                            <h4 className="text-capitalize">
                              {candidate.name || 'NA'}
                            </h4>
                            <span className="exp-badge bg-label-secondary" style={inlineStyles.expBadge}>
                              {candidate.isExperienced ? 'Experienced' : 'Fresher'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="info-container">
                        <ul className="list-unstyled">
                          <li className="mb-1">
                            <span className="font-weight-bold">Gender:</span>
                            <span className="text-capitalize">
                              {candidate.sex || 'NA'}
                            </span>
                          </li>
                          <li className="mb-1">
                            <span className="font-weight-bold">Mobile No.</span>
                            <span className="mobile">
                              {masked || candidate.mobile === 0 ? 'xxxxxxxxxx' : candidate.mobile}
                            </span>
                          </li>
                          <li className="mb-1">
                            <span className="font-weight-bold">Email:</span>
                            <span className="email">
                              {masked ? 'xxxxxxxxxx' : candidate.email}
                            </span>
                          </li>
                          <li className="mb-1">
                            <span className="font-weight-bold">Experience:</span>
                            <span className="exp-badge bg-label-success" style={inlineStyles.expBadge}>
                              {candidate.totalExperience ? `${candidate.totalExperience} Years` : 'Fresher'}
                            </span>
                          </li>
                          <li className="mb-1">
                            <span className="font-weight-bold">Highest Qualification:</span>
                            <span className="text-capitalize">
                              {qualification.find(q => q._id === candidate.highestQualification)?.name || 'NA'}
                            </span>
                          </li>
                          <li className="mb-1">
                            <span className="font-weight-bold">Residence:</span>
                            <span className="text-capitalize">
                              {candidate.city && candidate.state ? 
                                `${candidate.city.name} (${candidate.state.name})` :
                                candidate.state ? candidate.state.name :
                                candidate.city ? candidate.city.name : 'NA'
                              }
                            </span>
                          </li>
                        </ul>
                        
                        <div className="d-flex justify-content-center">
                          {masked && (
                            <button 
                              onClick={maskUnmask}
                              className="btn btn-primary me-3 waves-effect waves-light btn-sm"
                            >
                              UNMASK
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Download Section */}
                  <section id="profile">
                    <div className="col-xl-12" id="mipie_profile">
                      <div className="row">
                        <div className="col-xl-2 col-lg-2 col-md-2 col-sm-2 col-2 bg-cs-one px-0 text-center">
                          <img src="/images/icons/profile.png" className="img-fluid pt-1" />
                        </div>
                        <div className="col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 py-1 my-auto">
                          <h5 className="p-0 m-0">Focalyt Profile</h5>
                        </div>
                        <div className="col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 py-1 text-right">
                          <button className="dwnload btn" style={inlineStyles.dwnloadBtn} onClick={downloadProfile}>
                            DOWNLOAD&nbsp;<i className="feather icon-arrow-down text-white font-weight-bold"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Resume Download Section */}
                    {candidate.resume && !masked && (
                      <div className="col-xl-12 mt-2 mb-xl-0 mb-lg-0 mb-md-3 mb-sm-3 mb-3">
                        <div className="row">
                          <div className="col-xl-2 col-lg-2 col-md-2 col-sm-2 col-2 px-0 text-center" style={inlineStyles.bgCsTwo}>
                            <img src="/images/icons/resume.png" className="img-fluid pt-1" />
                          </div>
                          <div className="col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 py-1 my-auto">
                            <h5 className="p-0 m-0">Resume</h5>
                          </div>
                          <div className="col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 py-1 text-right">
                            <button className="dwnload btn" style={inlineStyles.dwnloadBtn} onClick={downloadResume}>
                              DOWNLOAD&nbsp;<i className="feather icon-arrow-down text-white font-weight-bold"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {candidate.resume && masked && (
                      <div className="row pt-1">
                        <img src="/images/disable_button.jpg" className="img-fluid" alt="Disabled" />
                      </div>
                    )}
                  </section>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="col-xl-8">
                  <div className="content-body">
                    <section className="list-view">
                      <div className="row">
                        {/* Qualifications Table */}
                        <div className="col-12">
                          <div className="card mb-0 mb-sm-0 mb-md-2 mb-lg-2 mb-xl-2 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-4 mt-4">
                            <div className="card-header border border-top-0 border-left-0 border-right-0 py-1 px-1">
                              <h4 className="card-title">
                                <img src="/images/icons/qualification.png" className="img-fluid pr-1" />
                                Qualification
                              </h4>
                            </div>
                            <div className="card-content">
                              <div className="table-responsive">
                                <table className="table table-hover-animation mb-0 table-hover">
                                  <thead>
                                    <tr>
                                      <th>Qualification</th>
                                      <th>College</th>
                                      <th>University</th>
                                      <th>Grade/CGPA</th>
                                      <th>Year of Passing</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {candidate.qualifications?.length > 0 ? (
                                      candidate.qualifications.map((qual, index) => (
                                        <tr key={index}>
                                          <td className="text-capitalize">
                                            {qual.Qualification?.name || 'NA'}
                                          </td>
                                          <td className="text-capitalize">
                                            {qual.College || 'NA'}
                                          </td>
                                          <td className="text-capitalize">
                                            {qual.University?.name || 'NA'}
                                          </td>
                                          <td className="text-capitalize">
                                            {qual.Result || 'NA'}
                                          </td>
                                          <td>
                                            {qual.PassingYear || 'NA'}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td className="text-center" colSpan="5">
                                          No record found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Technical Skills */}
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                          <div className="card mt-1 mb-0 mb-sm-0 mb-md-2 mb-lg-2 mb-xl-2">
                            <div className="card-header border border-top-0 border-left-0 border-right-0 py-1 px-1">
                              <h4 className="card-title">
                                <img src="/images/icons/technicalskill.png" className="img-fluid pr-1" />
                                Technical Skills
                              </h4>
                            </div>
                            <div className="card-content">
                              <div className="table-responsive">
                                <table className="table table-hover-animation mb-0 table-hover">
                                  <thead>
                                    <tr>
                                      <th>Technical</th>
                                      <th>Media</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {candidate.techSkills?.length > 0 ? (
                                      candidate.techSkills.map((skill, index) => (
                                        <tr key={index}>
                                          <td className="text-capitalize">
                                            {skill.id.name}
                                          </td>
                                          <td>
                                            <a href={`${bucketUrl}/${skill.URL}`} target="_blank" rel="noopener noreferrer">
                                              View
                                            </a>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td className="text-center" colSpan="2">
                                          No record found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Non-Technical Skills */}
                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
                          <div className="card mt-1 mb-0 mb-sm-0 mb-md-2 mb-lg-2 mb-xl-2">
                            <div className="card-header border border-top-0 border-left-0 border-right-0 py-1 px-1">
                              <h4 className="card-title">
                                <img src="/images/icons/technicalskill.png" className="img-fluid pr-1" />
                                Non Technical Skills
                              </h4>
                            </div>
                            <div className="card-content">
                              <div className="table-responsive">
                                <table className="table table-hover-animation mb-0 table-hover">
                                  <thead>
                                    <tr>
                                      <th>Non Technical</th>
                                      <th>Media</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {candidate.nonTechSkills?.length > 0 ? (
                                      candidate.nonTechSkills.map((skill, index) => (
                                        <tr key={index}>
                                          <td className="text-capitalize">
                                            {skill.id.name}
                                          </td>
                                          <td>
                                            <a href={`${bucketUrl}/${skill.URL}`} target="_blank" rel="noopener noreferrer">
                                              View
                                            </a>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td className="text-center" colSpan="2">
                                          No record found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Experience */}
                        <div className="col-12">
                          <div className="card mt-1 mb-0 mb-sm-0 mb-md-2 mb-lg-2 mb-xl-2">
                            <div className="card-header border border-top-0 border-left-0 border-right-0 py-1 px-1">
                              <h4 className="card-title">
                                <img src="/images/icons/experince.png" className="img-fluid pr-1" />
                                Experience
                              </h4>
                            </div>
                            <div className="card-content">
                              <div className="table-responsive">
                                <table className="table table-hover-animation mb-0 table-hover">
                                  <thead>
                                    <tr>
                                      <th>Duration</th>
                                      <th>Company Name</th>
                                      <th>Industry</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {candidate.experiences?.length > 0 ? (
                                      candidate.experiences.map((exp, index) => (
                                        <tr key={index}>
                                          <td>
                                            {formatMonthYear(exp.FromDate)} To {formatMonthYear(exp.ToDate)}
                                          </td>
                                          <td className="text-capitalize">
                                            {exp.Company_Name || 'NA'}
                                          </td>
                                          <td className="text-capitalize">
                                            {exp.Industry_Name?.name || 'NA'}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td className="text-center" colSpan="3">
                                          No record found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Location Preferences */}
                        <div className="col-12">
                          <div className="card mt-1 mb-5">
                            <div className="card-header border border-top-0 border-left-0 border-right-0 py-1 px-1">
                              <h4 className="card-title">
                                <img src="/images/icons/location.png" className="img-fluid pr-1" />
                                Location Preferences
                              </h4>
                            </div>
                            <div className="card-content">
                              <div className="table-responsive">
                                <table className="table table-hover-animation mb-0 table-hover">
                                  <thead>
                                    <tr>
                                      <th>Location 1</th>
                                      <th>Location 2</th>
                                      <th>Location 3</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {candidate.locationPreferences?.length > 0 ? (
                                      <tr>
                                        <td className="text-capitalize">
                                          {candidate.locationPreferences[0]?.city?.name || 'NA'}
                                        </td>
                                        <td className="text-capitalize">
                                          {candidate.locationPreferences[1]?.city?.name || 'NA'}
                                        </td>
                                        <td className="text-capitalize">
                                          {candidate.locationPreferences[2]?.city?.name || 'NA'}
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr>
                                        <td className="text-center" colSpan="3">
                                          No record found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Update Status Modal */}
      <Modal
        show={showUpdateStatus}
        onClose={() => setShowUpdateStatus(false)}
        title="Update Status"
        footer={
          <div>
            <button 
              type="submit" 
              className={`btn btn-primary ${!statusForm.status ? 'disabled' : ''}`}
              onClick={updateStatus}
              disabled={!statusForm.status}
            >
              Update
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => setShowUpdateStatus(false)}
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="row">
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Status<span className="required text-danger"> *</span></label>
            <select 
              className="form-control text-capitalize" 
              value={statusForm.status}
              onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Select Option</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview due">Interview Due</option>
              <option value="interviewed">Interviewed</option>
              <option value="on hold">On Hold</option>
              <option value="offer letter rollout">Offer Letter Rollout</option>
              <option value="hiring on hold">Hiring on Hold</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Select JD</label>
            <select 
              className="form-control text-capitalize" 
              value={statusForm.job}
              onChange={(e) => setStatusForm(prev => ({ ...prev, job: e.target.value }))}
            >
              <option value="">Select Option</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Event Date/Time</label>
            <input 
              type="date" 
              className="form-control" 
              value={statusForm.eventDate}
              onChange={(e) => setStatusForm(prev => ({ ...prev, eventDate: e.target.value }))}
            />
          </div>
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Select Concerned Person</label>
            <select 
              className="form-control text-capitalize" 
              value={statusForm.concernedPerson}
              onChange={(e) => setStatusForm(prev => ({ ...prev, concernedPerson: e.target.value }))}
            >
              <option value="">Select Option</option>
              {company.companyExecutives?.map(executive => (
                <option key={executive._id} value={executive._id}>
                  {executive.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-xl-12 mb-1 text-left">
            <label>Comment</label>
            <textarea 
              className="form-control" 
              cols="5" 
              rows="3"
              value={statusForm.comment}
              onChange={(e) => setStatusForm(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Add Coins Modal */}
      <Modal
        show={showAddCoins}
        onClose={() => setShowAddCoins(false)}
        title="Insufficient Coins"
        footer={
          <div>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                getOffers();
                setShowAddCoins(false);
                setShowCoinOffer(true);
              }}
            >
              Buy Coins
            </button>
            <button 
              type="button" 
              className="btn btn-outline-light" 
              onClick={() => setShowAddCoins(false)}
            >
              Cancel
            </button>
          </div>
        }
      >
        <h5 className="pb-1 mb-0 mt-1">
          You need {coins.shortlist} Coin to Shortlist the Candidate
        </h5>
        <ul className="list-unstyled">
          <li className="mb-1">
            <span className="credit font-weight-bold">
              Current Coins Balance: {company?.creditLeft}
            </span>
          </li>
        </ul>
      </Modal>

      {/* Coin Offer Modal */}
      <Modal
        show={showCoinOffer}
        onClose={() => setShowCoinOffer(false)}
        title="COIN OFFERS"
        footer={
          <div>
            <button 
              type="submit" 
              className="btn btn-primary waves-effect waves-light"
              onClick={() => {
                const checkedInput = document.querySelector(`input[name="offerName"]:checked`);
                if (checkedInput) {
                  const selectedOffer = offers.find(offer => offer._id === checkedInput.id);
                  if (selectedOffer) {
                    handleOfferSelect(selectedOffer._id, selectedOffer.payAmount?.$numberDecimal || selectedOffer.payAmount);
                    setShowCoinOffer(false);
                    setShowApplyVoucher(true);
                  }
                }
              }}
            >
              Pay Now
            </button>
            <button 
              type="button" 
              className="btn btn-outline-light waves-effect waves-light"
              onClick={() => setShowCoinOffer(false)}
            >
              Cancel
            </button>
          </div>
        }
      >
        <ul className="list-unstyled">
          <li>
            <div className="col-xl-8 mx-auto">
              {offers.map(offer => (
                <div key={offer._id} className="row my-2 text-white py-1" style={{...inlineStyles.innerBorder, ...inlineStyles.popupBg}}>
                  <div className="col-9 pr-0">{offer.displayOffer}</div>
                  <div className="col-3 text-left">
                    <input 
                      type="radio" 
                      id={offer._id} 
                      name="offerName" 
                      value={offer.payAmount?.$numberDecimal || offer.payAmount} 
                      className="radio-size"
                      defaultChecked={offers.indexOf(offer) === 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </li>
          <li className="mb-1">
            <span className="credit font-weight-bold">
              Current Coins Balance: {company?.creditLeft}
            </span>
          </li>
        </ul>
      </Modal>

      {/* Apply Voucher Modal */}
      <Modal
        show={showApplyVoucher}
        onClose={() => setShowApplyVoucher(false)}
        title="Buy Coins"
        footer={
          <div className="text-center">
            <button 
              className="btn button-vchr shadow" 
              onClick={voucher.trim() === '' ? makePayment : makePayment}
            >
              Pay ₹{paymentData.amount}
            </button>
          </div>
        }
      >
        <div className="my-3">
          <h3 className="coupon-text">
            If you have <strong>Coupon Code</strong>, apply here
          </h3>
          <input 
            type="text" 
            className="text-white mt-1" 
            placeholder="Enter Code" 
            value={voucher.toUpperCase()}
            onChange={(e) => setVoucher(e.target.value.toUpperCase())}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                makePayment();
              }
            }}
          />
          <button 
            type="button" 
            className={`btn btn-sm ml-1 ${voucher.trim() === '' ? 'disabled' : ''}`}
            style={inlineStyles.voucherBtn}
            disabled={voucher.trim() === ''}
            onClick={applyVoucher}
          >
            Apply
          </button>
        </div>
        
        {voucherMessage.success && (
          <p className="text-success font-weight-bolder font-italic">
            {voucherMessage.success}
          </p>
        )}
        {voucherMessage.error && (
          <p className="text-danger font-weight-bolder font-italic">
            {voucherMessage.error}
          </p>
        )}
      </Modal>
    </>
  );
};

export default CandidateProfile;