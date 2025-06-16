import React, { useState, useEffect } from 'react';

const SearchCandidate = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State management
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Form state
  const [searchFilters, setSearchFilters] = useState({
    state: '',
    city: '',
    qualification: '',
    experience: '0'
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (searchFilters.state) {
      loadCities(searchFilters.state);
    } else {
      setCities([]);
      setSearchFilters(prev => ({ ...prev, city: '' }));
    }
  }, [searchFilters.state]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Try to get from localStorage first (as in original code)
      const storedStates = localStorage.getItem("stateValues");
      const storedQualifications = localStorage.getItem("qualifications");
      
      if (storedStates && storedQualifications) {
        const statesArray = JSON.parse(storedStates);
        const qualificationsArray = JSON.parse(storedQualifications);
        
        setStates(statesArray);
        setQualifications(qualificationsArray);
        
        // Load initial cities for first state if available
        if (statesArray.length > 0) {
          loadCities(statesArray[0].stateId);
          setSearchFilters(prev => ({ ...prev, state: statesArray[0].stateId }));
        }
      } else {
        // Fallback to API if localStorage is empty
        await loadFromAPI();
      }
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load states and qualifications from API
      const [statesResponse, qualificationsResponse] = await Promise.all([
        fetch(`${backendUrl}/app/candidate/getstates`, {
          headers: { 'x-auth': token }
        }),
        fetch(`${backendUrl}/app/candidate/getqualifications`, {
          headers: { 'x-auth': token }
        })
      ]);

      if (statesResponse.ok && qualificationsResponse.ok) {
        const statesData = await statesResponse.json();
        const qualificationsData = await qualificationsResponse.json();
        
        setStates(statesData);
        setQualifications(qualificationsData);
        
        // Load initial cities for first state
        if (statesData.length > 0) {
          loadCities(statesData[0].stateId);
          setSearchFilters(prev => ({ ...prev, state: statesData[0].stateId }));
        }
      }
    } catch (error) {
      console.error('Error loading from API:', error);
    }
  };

  const loadCities = async (stateId) => {
    try {
      const response = await fetch(`${backendUrl}/app/candidate/getcities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const citiesData = await response.json();
        setCities(citiesData);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSearchPerformed(true);

      const body = {
        expToSearch: searchFilters.experience,
        quaToSearch: searchFilters.qualification,
        cityToSearch: searchFilters.city,
        stateToSearch: searchFilters.state
      };

      const response = await fetch(`${backendUrl}/app/corporate/get-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.candidates && data.candidates.length > 0) {
          setCandidates(data.candidates);
        } else {
          setCandidates([]);
        }
      } else {
        setError('Failed to search candidates');
        setCandidates([]);
      }
    } catch (error) {
      setError('Error occurred while searching');
      setCandidates([]);
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const CandidatesTable = ({ candidates }) => {
    if (!candidates || candidates.length === 0) {
      return (
        <div className="text-center p-4">
          <p>Unable to find the candidates.</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-hover-animation mb-0 table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Qualification</th>
              <th>Experience</th>
              <th>Location</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr key={candidate.id || index}>
                <td>{candidate.name || 'N/A'}</td>
                <td>{candidate.qualification || 'N/A'}</td>
                <td>{candidate.experience ? `${candidate.experience} Years` : 'Fresher'}</td>
                <td>{candidate.city || 'N/A'}, {candidate.state || 'N/A'}</td>
                <td>{candidate.mobile || candidate.phone || 'N/A'}</td>
                <td>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => window.open(`/candidate/${candidate.id}`, '_blank')}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <h3 className="content-header-title float-left mb-0">Search Candidates</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Search Candidates</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section id="Concerned-Person">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Search Candidates</h4>
                </div>
                
                <div className="card-content">
                  <div className="card-content">
                    <div className="card-body">
                      
                      {/* Search Filters */}
                      <div className="row">
                        
                        {/* State Filter */}
                        <div className="col-xl-2 mb-1">
                          <label>State</label>
                          <select 
                            className="form-control"
                            value={searchFilters.state}
                            onChange={(e) => handleFilterChange('state', e.target.value)}
                          >
                            <option value="">Select State</option>
                            {states.map((state, index) => (
                              <option key={state.stateId || index} value={state.stateId}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City Filter */}
                        <div className="col-xl-2 mb-1">
                          <label>City</label>
                          <select 
                            className="form-control"
                            value={searchFilters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                            disabled={!searchFilters.state}
                          >
                            <option value="">Select City</option>
                            {cities.map((city, index) => (
                              <option key={city.value || index} value={city.value}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Qualification Filter */}
                        <div className="col-xl-2 mb-1">
                          <label>Qualification</label>
                          <select 
                            className="form-control"
                            value={searchFilters.qualification}
                            onChange={(e) => handleFilterChange('qualification', e.target.value)}
                          >
                            <option value="">Select Qualification</option>
                            {qualifications.map((qualification, index) => (
                              <option key={qualification.name || index} value={qualification.name}>
                                {qualification.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Experience Filter */}
                        <div className="col-xl-2 mb-1">
                          <label>Experience</label>
                          <select 
                            className="form-control"
                            value={searchFilters.experience}
                            onChange={(e) => handleFilterChange('experience', e.target.value)}
                          >
                            {Array.from({ length: 16 }, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>

                        {/* Submit Button */}
                        <div className="col-xl-2 mb-1">
                          <label></label>
                          <br />
                          <button 
                            className="btn btn-success waves-effect waves-light mb-3 text-white"
                            onClick={handleSubmit}
                            disabled={loading}
                          >
                            {loading ? (
                              <span>
                                <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
                                Searching...
                              </span>
                            ) : (
                              'SUBMIT'
                            )}
                          </button>
                        </div>
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

                {/* Results Section */}
                <section id="printTheResults">
                  {loading && !error && (
                    <div className="text-center p-4">
                      <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                      <p className="mt-2">Searching candidates...</p>
                    </div>
                  )}

                  {!loading && searchPerformed && (
                    <div className="card-content">
                      <div className="card-body">
                        <h5 className="mb-3">Search Results</h5>
                        <CandidatesTable candidates={candidates} />
                        
                        {candidates.length > 0 && (
                          <div className="mt-3">
                            <p className="text-muted">
                              Found {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} matching your criteria.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </section>
      </>
 
  );
};

export default SearchCandidate;