import React, { useState, useEffect } from 'react';

const ListCandidate = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_MIPIE_RAZORPAY_KEY;

  // State management
  const [candidates, setCandidates] = useState([]);
  const [company, setCompany] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter data
  const [jdLocation, setJdLocation] = useState([]);
  const [qualification, setQualification] = useState([]);
  const [subQualification, setSubQualification] = useState([]);
  const [state, setState] = useState([]);
  const [city, setCity] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [offers, setOffers] = useState([]);
  const [coinsRequired, setCoinsRequired] = useState({});

  // Search filters state
  const [filters, setFilters] = useState({
    jdLocation: '',
    highestqualification: '',
    subQualification: '',
    experience: '',
    gender: '',
    stateId: '',
    cityId: '',
    techSkills: '',
    nonTechSkills: ''
  });

  // Modal states
  const [showPromote, setShowPromote] = useState(false);
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [showCoinOffer, setShowCoinOffer] = useState(false);
  const [showApplyVoucher, setShowApplyVoucher] = useState(false);

  // Promote modal state
  const [promoteForm, setPromoteForm] = useState({
    job: '',
    categories: '',
    template: '',
    preview: ''
  });

  // Bulk action state
  const [bulkForm, setBulkForm] = useState({
    status: '',
    job: '',
    concernedPerson: '',
    comment: ''
  });

  // Payment state
  const [paymentData, setPaymentData] = useState({
    offerId: '',
    amount: '',
    offerAmount: ''
  });

  const [voucher, setVoucher] = useState('');
  const [voucherMessage, setVoucherMessage] = useState({ success: '', error: '' });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load candidates when filters or page change
  useEffect(() => {
    loadCandidates();
  }, [currentPage]);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/list-candidates-data`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setJdLocation(data.jdLocation || []);
        setQualification(data.qualification || []);
        setSubQualification(data.subQualification || []);
        setState(data.state || []);
        setSkills(data.skills || []);
        setJobs(data.jobs || []);
        setCompany(data.company || {});
        setCoinsRequired(data.coinsRequired || {});
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: currentPage,
        ...filters
      });

      const response = await fetch(`${backendUrl}/company/list-candidates?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
        setTotalPages(data.totalPages || 1);
        setPageCount(data.pageCount || 0);
      } else {
        setError('Failed to load candidates');
      }
    } catch (error) {
      setError('Error loading candidates');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Load cities when state changes
    if (field === 'stateId' && value) {
      loadCities(value);
    }

    // Clear city when state is cleared
    if (field === 'stateId' && !value) {
      setCity([]);
      setFilters(prev => ({ ...prev, cityId: '' }));
    }
  };

  const loadCities = async (stateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/getcitiesbyId?stateId=${stateId}`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setCity(data.cityValues || []);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadSubQualifications = async (qualificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/getSubQualifications?qualificationId=${qualificationId}`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setSubQualification(data.subQualifications || []);
      }
    } catch (error) {
      console.error('Error loading sub qualifications:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCandidates();
  };

  const handleReset = () => {
    setFilters({
      jdLocation: '',
      highestqualification: '',
      subQualification: '',
      experience: '',
      gender: '',
      stateId: '',
      cityId: '',
      techSkills: '',
      nonTechSkills: ''
    });
    setCity([]);
    setSubQualification([]);
    setCurrentPage(1);
    loadCandidates();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const openMap = (lat, lng) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleViewCandidate = (candidateId) => {
    window.location.href = `/company/candidate/${candidateId}?src=list`;
  };

  // Template functions
  const loadTemplatesByCategory = async (category) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/getTemplateByCategory?value=${category}`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.template || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCategoryChange = (category) => {
    setPromoteForm(prev => ({ ...prev, categories: category, template: '', preview: '' }));
    if (category) {
      loadTemplatesByCategory(category);
    } else {
      setTemplates([]);
    }
  };

  const handleTemplateChange = (templateId) => {
    const selectedTemplate = templates.find(t => t._id === templateId);
    setPromoteForm(prev => ({
      ...prev,
      template: templateId,
      preview: selectedTemplate ? selectedTemplate.message : ''
    }));
  };

  const sendPromotion = async () => {
    try {
      const token = localStorage.getItem('token');
      const body = {
        job: promoteForm.job,
        template: promoteForm.template,
        messages: pageCount
      };

      const response = await fetch(`${backendUrl}/company/promote`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowPromote(false);
        alert('Promotion sent successfully');
      }
    } catch (error) {
      console.error('Error sending promotion:', error);
    }
  };

  const updateBulkStatus = async () => {
    try {
      const candidateIds = candidates.map(candidate => candidate._id);
      const requiredCoins = pageCount * coinsRequired.shortlist;

      if (pageCount === 0) {
        alert('No candidates found');
        return;
      }

      if (company.creditLeft < requiredCoins) {
        setShowBulkAction(false);
        setShowCoinOffer(true);
        await getOffers();
        return;
      }

      const token = localStorage.getItem('token');
      const body = {
        status: bulkForm.status,
        job: bulkForm.job,
        comment: bulkForm.comment,
        concernedPerson: bulkForm.concernedPerson,
        candidateIds,
        count: pageCount
      };

      const response = await fetch(`${backendUrl}/company/candidate/bulkStatusUpdate`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        if (data.status) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error updating bulk status:', error);
    }
  };

  const getOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/getCoinOffers`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      }
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
        code: voucher
      };

      const response = await fetch(`${backendUrl}/company/checkvoucher`, {
        method: 'PUT',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.status) {
        setVoucherMessage({ success: result.message, error: '' });
        setPaymentData(prev => ({ ...prev, amount: result.amount }));
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

      const response = await fetch(`${backendUrl}/company/payment`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

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

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    const pages = [];

    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>
            First
          </button>
        </li>
      );
    }

    for (let i = first; i <= last; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button
            className="page-link"
            onClick={() => handlePageChange(i)}
            disabled={i === currentPage}
          >
            {i}
          </button>
        </li>
      );
    }

    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(last + 1)}>
            ...
          </button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            Last
          </button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2">
        {pages}
      </ul>
    );
  };

  // Modal component
  const Modal = ({ show, onClose, title, children, footer, size = '' }) => {
    if (!show) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className={`modal-dialog modal-dialog-centered ${size}`}>
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
        
        {/* Content Header */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">List Candidates</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">List Candidates</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <section id="Concerned-Person">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Search Candidates</h4>
                  <p id="subscription"></p>
                </div>

                <div className="content-body px-2">
                  {/* Search Filters */}
                  <div className="row mb-2">
                    <div className="col-xl-12 col-lg-12">
                      <div className="row">
                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mt-1">
                          <label>Set Location As Per JD</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.jdLocation}
                            onChange={(e) => handleFilterChange('jdLocation', e.target.value)}
                          >
                            <option value="">Select</option>
                            {jdLocation.map(jd => (
                              <option key={jd._id} value={jd.location?.coordinates} className="text-capitalize">
                                {jd.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mt-1">
                          <label>Qualification</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.highestqualification}
                            onChange={(e) => {
                              handleFilterChange('highestqualification', e.target.value);
                              if (e.target.value) {
                                loadSubQualifications(e.target.value);
                              }
                            }}
                          >
                            <option value="">Select</option>
                            {qualification.map(qual => (
                              <option key={qual._id} value={qual._id} className="text-capitalize">
                                {qual.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                          <label>Stream</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.subQualification}
                            onChange={(e) => handleFilterChange('subQualification', e.target.value)}
                          >
                            <option value="">Select</option>
                            {subQualification.map(subQual => (
                              <option key={subQual._id} value={subQual._id} className="text-capitalize">
                                {subQual.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                          <label>Experience</label>
                          <select 
                            className="form-control"
                            value={filters.experience}
                            onChange={(e) => handleFilterChange('experience', e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="0">0</option>
                            {Array.from({ length: 15 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                          <label>Gender</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.gender}
                            onChange={(e) => handleFilterChange('gender', e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                          <label>Preferred State</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.stateId}
                            onChange={(e) => handleFilterChange('stateId', e.target.value)}
                          >
                            <option value="">Select</option>
                            {state.map(st => (
                              <option key={st._id} value={st._id} className="text-capitalize">
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mt-xl-2 mt-1">
                          <label>Preferred City</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.cityId}
                            onChange={(e) => handleFilterChange('cityId', e.target.value)}
                          >
                            <option value="">Select</option>
                            {city.map(ct => (
                              <option key={ct._id} value={ct._id} className="text-capitalize">
                                {ct.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mt-xl-2">
                          <label>Tech Skills</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.techSkills}
                            onChange={(e) => handleFilterChange('techSkills', e.target.value)}
                          >
                            <option value="">Select</option>
                            {skills.filter(skill => skill.type === 'technical').map(skill => (
                              <option key={skill._id} value={skill._id} className="text-capitalize">
                                {skill.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 mr-0 mt-xl-2">
                          <label>Non Tech Skills</label>
                          <select 
                            className="form-control text-capitalize"
                            value={filters.nonTechSkills}
                            onChange={(e) => handleFilterChange('nonTechSkills', e.target.value)}
                          >
                            <option value="">Select</option>
                            {skills.filter(skill => skill.type === 'non technical').map(skill => (
                              <option key={skill._id} value={skill._id} className="text-capitalize">
                                {skill.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-12 mt-xl-3 mt-lg-2 mt-md-3 mt-sm-2 mt-2 text-right">
                          <button 
                            className="btn btn-success waves-effect waves-light text-white d-inline px-xl-3 px-lg-3 px-md-2 px-sm-1 px-1"
                            onClick={handleSearch}
                          >
                            Go
                          </button>
                          <button 
                            className="btn btn-danger d-inline waves-effect waves-light mb-2 text-white mx-sm-1 mx-0 px-xl-3 px-lg-3 px-md-2 px-sm-1 px-1"
                            onClick={handleReset}
                          >
                            RESET
                          </button>
                          <button 
                            className="btn btn-primary waves-effect waves-light text-white d-inline ml-xl-1 px-xl-3 px-lg-3 px-md-2 px-sm-1 px-1"
                            onClick={() => setShowPromote(true)}
                          >
                            Promote
                          </button>
                          <button 
                            className={`btn btn-success waves-effect waves-light text-white d-inline ml-xl-1 px-xl-3 px-lg-3 px-md-2 px-sm-1 px-1 ${pageCount === 0 ? 'disabled' : ''}`}
                            onClick={() => setShowBulkAction(true)}
                            disabled={pageCount === 0}
                          >
                            Bulk Action
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Candidates Table */}
                  <div className="row">
                    <div className="col-12">
                      <div className="card mb-0">
                        <div className="card-content">
                          {loading && (
                            <div className="text-center p-4">
                              <div className="spinner-border" role="status">
                                <span className="sr-only">Loading...</span>
                              </div>
                            </div>
                          )}

                          {error && (
                            <div className="alert alert-danger m-3">
                              {error}
                              <button className="btn btn-sm btn-outline-danger ml-2" onClick={loadCandidates}>
                                Retry
                              </button>
                            </div>
                          )}

                          {!loading && !error && (
                            <div className="table-responsive">
                              <table className="table table-hover-animation mb-0 table-hover">
                                <thead>
                                  <tr>
                                    <th className="long_text">CANDIDATES</th>
                                    <th>GENDER</th>
                                    <th>Qualification</th>
                                    <th className="long_text">Branch</th>
                                    <th>Experience</th>
                                    <th>ACTIONS</th>
                                    <th>Location</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {candidates && candidates.length > 0 ? (
                                    candidates.map((candidate, index) => (
                                      <tr key={candidate._id}>
                                        <td className="appliedTag">
                                          {candidate.name || 'NA'}
                                          {candidate.appliedJobs && candidate.appliedJobs.length > 0 && (
                                            <span className="badge bg-success ml-1 rounded">
                                              Applied
                                            </span>
                                          )}
                                        </td>
                                        <td>{candidate.sex || 'NA'}</td>
                                        <td>
                                          {candidate.highestQualification 
                                            ? qualification.find(q => q._id === candidate.highestQualification)?.name || 'NA'
                                            : 'NA'
                                          }
                                        </td>
                                        <td className="long_text">
                                          {candidate.subQualifications && candidate.subQualifications[0]?.name || 'NA'}
                                        </td>
                                        <td>
                                          {candidate.totalExperience ? `${candidate.totalExperience} Years` : 'Fresher'}
                                        </td>
                                        <td className="actions">
                                          <button
                                            className="btn btn-link p-0"
                                            onClick={() => handleViewCandidate(candidate._id)}
                                          >
                                            <i className="fa-regular fa-user"></i>
                                          </button>
                                        </td>
                                        <td>
                                          <button
                                            className="btn btn-link p-0"
                                            onClick={() => openMap(candidate.latitude, candidate.longitude)}
                                          >
                                            <i className="fa-sm fa-solid text-danger fa-location-dot">
                                              <span className="ml-1">
                                                {Math.round(candidate.distance / 1000)} KMs
                                              </span>
                                            </i>
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="7" className="text-center">
                                        No Result Found
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              <Pagination />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
     

      {/* Promote Modal */}
      <Modal
        show={showPromote}
        onClose={() => setShowPromote(false)}
        title="Promote Now"
        footer={
          <div>
            <button className="btn btn-primary" onClick={sendPromotion}>
              Send
            </button>
            <button className="btn btn-danger" onClick={() => setShowPromote(false)}>
              Cancel
            </button>
          </div>
        }
      >
        <div className="row">
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Select JD</label>
            <select 
              className="form-control text-capitalize"
              value={promoteForm.job}
              onChange={(e) => setPromoteForm(prev => ({ ...prev, job: e.target.value }))}
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
            <label>Categories <span className="asterisk">*</span></label>
            <select 
              className="form-control"
              value={promoteForm.categories}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Select Categories</option>
              <option value="Job Promotion">Job Promotion</option>
              <option value="Interview Scheduling">Interview Scheduling</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Select Template</label>
            <select 
              className="form-control text-capitalize"
              value={promoteForm.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">Select Option</option>
              {templates.map(template => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-xl-12 mb-1 text-left">
            <label>Template Preview</label>
            <textarea 
              className="form-control" 
              cols="5" 
              rows="3" 
              value={promoteForm.preview}
              readOnly
            />
          </div>
        </div>

        <div className="d-inline border border-top-0 border-left-0 border-right-0 pb-1 mb-1">
          <span>Total Messages: </span>
          <span className="text-left font-weight-bold">{pageCount}</span>
        </div>

        <div className="row ml-1">
          <p className="text-left font-weight-bold text-dark">
            Coins Balance: {company?.creditLeft}
          </p>
          <p className="text-right font-weight-bold text-danger ml-5">
            <i>Coins Required: {pageCount * (coinsRequired?.SMS || 0)}</i>
          </p>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        show={showBulkAction}
        onClose={() => setShowBulkAction(false)}
        title="UPDATE STATUS"
        footer={
          <div>
            <button className="btn btn-primary" onClick={updateBulkStatus}>
              Update
            </button>
            <button className="btn btn-danger" onClick={() => setShowBulkAction(false)}>
              Cancel
            </button>
          </div>
        }
      >
        <div className="row">
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Status <span className="asterisk">*</span></label>
            <select 
              className="form-control"
              value={bulkForm.status}
              onChange={(e) => setBulkForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Select Categories</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview due">Interview Due</option>
              <option value="offer letter rollout">Offer Letter Rollout</option>
              <option value="hired">Hired</option>
            </select>
          </div>

          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-1 text-left">
            <label>Select JD</label>
            <select 
              className="form-control text-capitalize"
              value={bulkForm.job}
              onChange={(e) => setBulkForm(prev => ({ ...prev, job: e.target.value }))}
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
            <label>Select Concerned Person</label>
            <select 
              className="form-control text-capitalize"
              value={bulkForm.concernedPerson}
              onChange={(e) => setBulkForm(prev => ({ ...prev, concernedPerson: e.target.value }))}
            >
              <option value="">Select options</option>
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
              value={bulkForm.comment}
              onChange={(e) => setBulkForm(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>
        </div>

        <div className="col ml-1">
          <div className="row">
            <p className="text-left font-weight-bold text-dark">
              Current Page Candidates: {pageCount}
            </p>
          </div>
          <div className="row">
            <p className="text-right font-weight-bold text-dark mr-5">
              Available Coins: {company.creditLeft}
            </p>
            <p>
              <span className="text-right credit font-weight-bold ml-5">
                Coins Required: {pageCount * (coinsRequired?.shortlist || 0)}
              </span>
            </p>
          </div>
        </div>
      </Modal>

      {/* Coin Offer Modal */}
      <Modal
        show={showCoinOffer}
        onClose={() => setShowCoinOffer(false)}
        title="COIN OFFERS"
        footer={
          <div>
            <button 
              className="btn btn-primary waves-effect waves-light"
              onClick={() => {
                const checkedInput = document.querySelector('input[name="offerName"]:checked');
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
            <button className="btn btn-outline-light waves-effect waves-light" onClick={() => setShowCoinOffer(false)}>
              Cancel
            </button>
          </div>
        }
      >
        <ul className="list-unstyled">
          <li>
            <div className="col-xl-8 mx-auto">
              {offers.map((offer, index) => (
                <div key={offer._id} className="row my-2 text-white py-1" style={{ border: '1px solid #dee2e6', backgroundColor: '#6c757d' }}>
                  <div className="col-9 pr-0">{offer.displayOffer}</div>
                  <div className="col-3 text-left">
                    <input 
                      type="radio" 
                      id={offer._id} 
                      name="offerName" 
                      value={offer.payAmount?.$numberDecimal || offer.payAmount} 
                      defaultChecked={index === 0}
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
        size="modal-sm"
        footer={
          <div className="text-center">
            <button 
              className="btn shadow" 
              style={{ backgroundColor: '#007bff', color: 'white' }}
              onClick={makePayment}
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
            style={{ backgroundColor: '#007bff', color: 'white' }}
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

export default ListCandidate;