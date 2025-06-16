import React, { useState, useEffect, useRef } from 'react';

const NearByCandidate = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // State management
  const [filterCollapsed, setFilterCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');

  // Filter data
  const [jdLocation, setJdLocation] = useState([]);
  const [qualification, setQualification] = useState([]);
  const [subQualification, setSubQualification] = useState([]);
  const [state, setState] = useState([]);
  const [city, setCity] = useState([]);
  const [skills, setSkills] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    jdLocation: '',
    highestQualification: '',
    subQualification: '',
    experience: '',
    gender: '',
    state: '',
    city: '',
    techSkills: '',
    nonTechSkills: ''
  });

  // Candidates data
  const [candidates, setCandidates] = useState([]);
  const [nearest, setNearest] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadGoogleMapsScript();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      initializeMap();
    }
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${backendUrl}/company/nearby-candidates-data`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setJdLocation(data.jdLocation || []);
        setQualification(data.qualification || []);
        setSubQualification(data.subQualification || []);
        setState(data.state || []);
        setSkills(data.skills || []);
      }
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initGoogleMap&libraries=&v=weekly`;
    script.async = true;
    
    // Create global callback function
    window.initGoogleMap = () => {
      initializeMap();
    };
    
    document.head.appendChild(script);
  };

  const initializeMap = async (filterData = {}) => {
    if (!window.google || !window.google.maps) {
      setMapError('Google Maps failed to load');
      return;
    }

    try {
      setMapError('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${backendUrl}/company/getNearbyCandidatesForMap?${new URLSearchParams(filterData)}`, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.status === false) {
        setMapError('Add your Current Location');
        // Initialize empty map
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 9
        });
        mapInstanceRef.current = map;
        return;
      }

      setCandidates(data.candidates || []);
      setNearest(data.nearest);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Initialize map with center
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 9,
        center: {
          lat: data.nearest?.location?.coordinates[1],
          lng: data.nearest?.location?.coordinates[0],
        },
      });

      mapInstanceRef.current = map;

      // Add markers for each candidate
      data.candidates.forEach(candidate => {
        const position = {
          lat: candidate.location.coordinates[1],
          lng: candidate.location.coordinates[0],
        };

        const infoWindowContent = `
          <div>
            <p><strong>${candidate.name}</strong></p>
            <p>${candidate.sex}, ${candidate.isExperienced ? 'Experienced' : 'Fresher'}</p>
            <p>Qualification: ${candidate.highestQualification && candidate.highestQualification[0]?.name ? candidate.highestQualification[0].name : 'NA'}</p>
            <p>Location: ${Math.round(candidate.distance / 1000)} km</p>
            <a href="/company/candidate/${candidate._id}" target="_blank">View Details</a>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoWindowContent,
        });

        const marker = new window.google.maps.Marker({
          position,
          icon: {
            url: "/images/marker.png",
            scaledSize: new window.google.maps.Size(35, 35),
          },
          map,
        });

        marker.addListener('click', () => {
          // Close all other info windows
          markersRef.current.forEach(m => {
            if (m.infoWindow) {
              m.infoWindow.close();
            }
          });
          
          infoWindow.open(map, marker);
        });

        // Store reference to marker and its info window
        marker.infoWindow = infoWindow;
        markersRef.current.push(marker);
      });

    } catch (error) {
      setMapError('Failed to load candidates data');
      console.error('Error initializing map:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Load cities when state changes
    if (field === 'state' && value) {
      loadCities(value);
    }

    // Clear city when state is cleared
    if (field === 'state' && !value) {
      setCity([]);
      setFilters(prev => ({ ...prev, city: '' }));
    }

    // Load sub-qualifications when qualification changes
    if (field === 'highestQualification' && value) {
      loadSubQualifications(value);
    }

    // Clear sub-qualification when qualification is cleared
    if (field === 'highestQualification' && !value) {
      setSubQualification([]);
      setFilters(prev => ({ ...prev, subQualification: '' }));
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

  const handleFilter = () => {
    // Create filter object with non-empty values
    const filterData = Object.keys(filters).reduce((acc, key) => {
      if (filters[key] && filters[key].trim() !== '') {
        acc[key] = filters[key];
      }
      return acc;
    }, {});

    initializeMap(filterData);
  };

  const handleReset = () => {
    setFilters({
      jdLocation: '',
      highestQualification: '',
      subQualification: '',
      experience: '',
      gender: '',
      state: '',
      city: '',
      techSkills: '',
      nonTechSkills: ''
    });
    setCity([]);
    setSubQualification([]);
    initializeMap();
  };

  // Inline styles for elements that might not have CSS
  const styles = {
    filterBlock: {
      display: 'block !important'
    },
    filterImg: {
      width: '90px',
      cursor: 'pointer'
    },
    mapContainer: {
      width: '100%',
      height: '400px'
    },
    errorText: {
      color: 'red',
      marginLeft: '20px',
      marginBottom: '10px'
    }
  };

  // Responsive filter image size
  if (window.innerWidth <= 992) {
    styles.filterImg.width = '60px';
  }

  return (
    <>
     
        
        {/* Content Header */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Candidates Near Me</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#">Candidates Near Me</a>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <section>
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div id="accordion">
                <div className="card">
                  
                  {/* Filter Header */}
                  <div className="card-header px-1 pt-1" style={styles.filterBlock}>
                    <div className="row">
                      <div className="col-6 my-auto">
                        <h5>Filter Data / डेटा फ़िल्टर करें</h5>
                      </div>
                      <div className="col-6 text-right">
                        <img 
                          src="/images/filtern.png" 
                          className="btn btn-link collapsed py-0 mx-0"
                          style={styles.filterImg}
                          onClick={() => setFilterCollapsed(!filterCollapsed)}
                          alt="Filter Toggle"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Filter Content */}
                  <div className={`collapse ${!filterCollapsed ? 'show' : ''}`}>
                    <div className="card-body px-0 py-0">
                      <div className="card">
                        <div className="card-content">
                          <div className="card-body px-0">
                            <div className="row my-0 mx-0">

                              {/* JD Location Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
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

                              {/* Qualification Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                                <label>Qualification</label>
                                <select 
                                  className="form-control text-capitalize"
                                  value={filters.highestQualification}
                                  onChange={(e) => handleFilterChange('highestQualification', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  {qualification.map(qual => (
                                    <option key={qual._id} value={qual._id} className="text-capitalize">
                                      {qual.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Stream Filter */}
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

                              {/* Experience Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                                <label>Experience</label>
                                <select 
                                  className="form-control"
                                  value={filters.experience}
                                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  {Array.from({ length: 16 }, (_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Gender Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                                <label>Gender</label>
                                <select 
                                  className="form-control text-capitalize"
                                  value={filters.gender}
                                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  <option value="Male" className="text-capitalize">Male</option>
                                  <option value="Female" className="text-capitalize">Female</option>
                                </select>
                              </div>

                              {/* State Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                                <label>Preferred State</label>
                                <select 
                                  className="form-control text-capitalize"
                                  value={filters.state}
                                  onChange={(e) => handleFilterChange('state', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  {state.map(st => (
                                    <option key={st._id} value={st._id} className="text-capitalize">
                                      {st.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* City Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
                                <label>Preferred City</label>
                                <select 
                                  className="form-control text-capitalize"
                                  value={filters.city}
                                  onChange={(e) => handleFilterChange('city', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  {city.map(ct => (
                                    <option key={ct._id} value={ct._id} className="text-capitalize">
                                      {ct.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Tech Skills Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
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

                              {/* Non Tech Skills Filter */}
                              <div className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-12 ml-0 mt-1">
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

                              {/* Action Buttons */}
                              <div className="col-xl-12 mt-xl-3 mt-lg-2 mt-md-3 mt-sm-2 mt-2 text-right">
                                <button 
                                  className="btn btn-success waves-effect waves-light text-white d-inline px-xl-3 px-lg-3 px-md-2 px-sm-1 px-1"
                                  onClick={handleFilter}
                                >
                                  Go
                                </button>
                                <button 
                                  className="btn btn-danger d-inline waves-effect waves-light mb-2 text-white mx-sm-1 mx-0 px-xl-3 px-lg-3 px-md-2 px-sm-1 px-1"
                                  onClick={handleReset}
                                >
                                  RESET
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {loading && (
                <div className="text-center p-3">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-danger mx-3">
                  {error}
                </div>
              )}

              {mapError && (
                <div style={styles.errorText}>
                  {mapError}
                </div>
              )}

              {/* Map Container */}
              <div 
                ref={mapRef}
                style={styles.mapContainer}
                id="map"
              ></div>
            </div>
          </div>
        </section>
      </>
 
  );
};

export default NearByCandidate;