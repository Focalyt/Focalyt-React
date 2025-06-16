import React, { useState, useEffect } from 'react';

const OnGoingHiring = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State management
  const [ongoingCandidates, setOngoingCandidates] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState({ type: '', message: '' });

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    status: ''
  });

  // Load initial data and URL params
  useEffect(() => {
    // Parse URL parameters on component mount
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name') || '';
    const statusParam = urlParams.get('status') || '';

    setFilters({
      name: nameParam,
      status: statusParam
    });

    loadOngoingCandidates();
  }, []);

  // Load candidates when filters change
  useEffect(() => {
    if (filters.name !== '' || filters.status !== '') {
      loadOngoingCandidates();
    }
  }, [filters]);

  const loadOngoingCandidates = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      // Add non-empty filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key].trim() !== '') {
          queryParams.set(key, filters[key]);
        }
      });

      const response = await fetch(`${backendUrl}/company/ongoing-candidates?${queryParams}`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setOngoingCandidates(data.ongoingCandidates || []);
        setQualifications(data.qualifications || []);
        setCandidateCount(data.ongoingCandidates?.length || 0);
        
        // Handle flash messages if any
        if (data.flashMessage) {
          setFlashMessage(data.flashMessage);
          setTimeout(() => setFlashMessage({ type: '', message: '' }), 5000);
        }
      } else {
        setError('Failed to load ongoing candidates');
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
  };

  const handleSearch = () => {
    // Update URL with current filters
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.status) params.set('status', filters.status);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);

    loadOngoingCandidates();
  };

  const getQualificationName = (qualificationId) => {
    const qualification = qualifications.find(q => q._id === qualificationId);
    return qualification ? qualification.name : 'NA';
  };

  const handleViewCandidate = (candidateId) => {
    window.location.href = `/company/candidate/${candidateId}?src=onGoing`;
  };

  const handleWhatsApp = (whatsappNumber) => {
    if (whatsappNumber) {
      window.open(`https://wa.me/91${whatsappNumber}`, '_blank');
    }
  };

  const handlePhoneCall = (mobile) => {
    if (mobile) {
      window.open(`tel:${mobile}`);
    }
  };

  const getExperienceText = (candidate) => {
    if (!candidate.isExperienced) {
      return 'Fresher';
    }
    return candidate.totalExperience ? `${candidate.totalExperience} Years` : 'NA';
  };

  // Flash message component
  const FlashMessage = () => {
    if (!flashMessage.message) return null;

    const alertClass = flashMessage.type === 'success' ? 'alert-success' : 
                     flashMessage.type === 'error' ? 'alert-danger' : 
                     'alert-info';

    return (
      <div className={`alert ${alertClass} alert-dismissible fade show mx-3 mb-3`}>
        {flashMessage.message}
        <button 
          type="button" 
          className="close" 
          onClick={() => setFlashMessage({ type: '', message: '' })}
        >
          <span>&times;</span>
        </button>
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
                <h2 className="content-header-title float-left mb-0">Ongoing Candidates</h2>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Ongoing Candidates</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="content-body">
          {/* Flash Message */}
          <FlashMessage />

          <section className="list-view">
            <div className="row">
              <div className="col-12">
                <div className="card mt-1 mb-5">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Ongoing Candidates</h4>
                    <h6 className="text-bold-500">
                      Candidate Count: {candidateCount}
                    </h6>
                  </div>

                  {/* Search Filters */}
                  <div className="col-xl-12 col-lg-12 mt-2">
                    <div>
                      <div className="row">
                        <div className="col-xl-4">
                          <label>Name/ Mobile/ Whatsapp</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={filters.name}
                            onChange={(e) => handleFilterChange('name', e.target.value)}
                            maxLength="25"
                            placeholder="Search by name, mobile, or WhatsApp"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSearch();
                              }
                            }}
                          />
                        </div>
                        
                        <div className="col-xl-4">
                          <h6>Hiring Status</h6>
                          <select 
                            className="form-control" 
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                          >
                            <option value="">Select Option</option>
                            <option value="interview due">Interview Due</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="on hold">On Hold</option>
                            <option value="offer letter rollout">Offer Letter Rollout</option>
                            <option value="hiring on hold">Hiring on Hold</option>
                            <option value="hired">Hired</option>
                          </select>
                        </div>
                        
                        <div className="col-xl-2">
                          <label>&nbsp;</label>
                          <br />
                          <button 
                            type="button"
                            className="btn btn-success waves-effect waves-light text-white"
                            onClick={handleSearch}
                            disabled={loading}
                          >
                            {loading ? 'Searching...' : 'SUBMIT'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="alert alert-danger mx-3">
                      {error}
                      <button 
                        className="btn btn-sm btn-outline-danger ml-2"
                        onClick={() => setError('')}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Candidates Table */}
                  <div className="card-content">
                    {loading && (
                      <div className="text-center p-4">
                        <div className="spinner-border" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2">Loading candidates...</p>
                      </div>
                    )}

                    {!loading && (
                      <div className="table-responsive mt-1">
                        <table className="table table-hover-animation mb-0 table-hover">
                          <thead>
                            <tr>
                              <th>CANDIDATES</th>
                              <th>Qualification</th>
                              <th>Hiring Stage</th>
                              <th>Experience</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="text-capitalize">
                            {ongoingCandidates && ongoingCandidates.length > 0 ? (
                              ongoingCandidates.map((ongoing, index) => (
                                <tr key={ongoing.candidate?.[0]?._id || index}>
                                  <td>
                                    {ongoing.candidate?.[0]?.name || 'NA'}
                                  </td>
                                  <td>
                                    {ongoing.candidate?.[0]?.highestQualification 
                                      ? getQualificationName(ongoing.candidate[0].highestQualification)
                                      : 'NA'
                                    }
                                  </td>
                                  <td>
                                    {ongoing?.status || 'NA'}
                                  </td>
                                  <td>
                                    {ongoing.candidate?.[0] 
                                      ? getExperienceText(ongoing.candidate[0])
                                      : 'NA'
                                    }
                                  </td>
                                  <td className="actions">
                                    <button
                                      className="btn btn-link p-0 mr-2"
                                      onClick={() => handleViewCandidate(ongoing.candidate?.[0]?._id)}
                                      title="View Profile"
                                      style={{ background: 'none', border: 'none' }}
                                    >
                                      <i className="fa-regular fa-user fa-lg"></i>
                                    </button>
                                    
                                    {ongoing.candidate?.[0]?.whatsapp && (
                                      <button
                                        className="btn btn-link p-0 mr-1"
                                        onClick={() => handleWhatsApp(ongoing.candidate[0].whatsapp)}
                                        title="WhatsApp"
                                        style={{ background: 'none', border: 'none' }}
                                      >
                                        <img 
                                          src="/public_assets/images/whatsappicon.png" 
                                          alt="WhatsApp"
                                          style={{ width: '1.5rem', height: '1.5rem' }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline';
                                          }}
                                        />
                                        <span style={{ display: 'none', color: '#25D366', fontSize: '1.5rem' }}>📱</span>
                                      </button>
                                    )}
                                    
                                    {ongoing.candidate?.[0]?.mobile && (
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => handlePhoneCall(ongoing.candidate[0].mobile)}
                                        title="Call"
                                        style={{ background: 'none', border: 'none' }}
                                      >
                                        <img 
                                          src="/public_assets/images/telephone.png" 
                                          alt="Phone"
                                          style={{ width: '1.5rem', height: '1.5rem' }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline';
                                          }}
                                        />
                                        <span style={{ display: 'none', color: '#007bff', fontSize: '1.5rem' }}>📞</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center py-4">
                                  {loading ? 'Loading...' : 'No Result Found'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
 
  );
};

export default OnGoingHiring;