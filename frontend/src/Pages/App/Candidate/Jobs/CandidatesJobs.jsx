// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import moment from "moment";
// // import "./CandidatesJobs.css";

// const CandidatesJobs = () => {
//   const [jobs, setJobs] = useState([]);
//   const [filters, setFilters] = useState({
//     name: "",
//     qualification: "",
//     experience: "",
//     industry: "",
//     jobType: "",
//     minSalary: "",
//     techSkills: "",
//     state: "",
//     distance: "all",
//   });
//   const [totalPages, setTotalPages] = useState(1);
//   const [currentPage, setCurrentPage] = useState(1);
//   const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

//   useEffect(() => {
//     fetchJobs();
//   }, [filters, currentPage]);

//   const fetchJobs = async () => {
//     try {
//       const response = await axios.get(`${backendUrl}/searchjob`, {
//         params: { ...filters, page: currentPage },
//       });
//       setJobs(response.data.jobs || []);
//       setTotalPages(response.data.totalPages || 1);
//     } catch (error) {
//       console.error("Error fetching jobs:", error);
//     }
//   };

//   const handleFilterChange = (e) => {
//     setFilters({ ...filters, [e.target.name]: e.target.value });
//   };

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   return (
//     <div className="container mt-3">
//       <h3 className="text-center">Search Jobs</h3>

//       <ul className="nav nav-tabs justify-content-center">
//         <li className="nav-item">
//           <Link className="nav-link" to="/candidate/searchcourses">Search Courses</Link>
//         </li>
//         <li className="nav-item">
//           <Link className="nav-link" to="/candidate/pendingFee">Pending for Fee</Link>
//         </li>
//         <li className="nav-item">
//           <Link className="nav-link active" to="/candidate/searchjob">Search Jobs</Link>
//         </li>
//       </ul>

//       {/* Job Search Filters */}
//       <section className="job-filters mt-3">
//         <form>
//           <div className="row">
//             <div className="col-md-4">
//               <label>Company Name</label>
//               <input type="text" className="form-control" name="name" value={filters.name} onChange={handleFilterChange} />
//             </div>

//             <div className="col-md-4">
//               <label>Qualification</label>
//               <select className="form-control" name="qualification" value={filters.qualification} onChange={handleFilterChange}>
//                 <option value="">Select</option>
//                 {/* Populate dynamically */}
//               </select>
//             </div>

//             <div className="col-md-4">
//               <label>Experience (Years)</label>
//               <select className="form-control" name="experience" value={filters.experience} onChange={handleFilterChange}>
//                 <option value="">Select</option>
//                 {[...Array(16).keys()].map(i => (
//                   <option key={i} value={i}>{i}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="col-md-4">
//               <label>Job Type</label>
//               <select className="form-control" name="jobType" value={filters.jobType} onChange={handleFilterChange}>
//                 <option value="">Select</option>
//                 <option value="Part Time">Part Time</option>
//                 <option value="Full Time">Full Time</option>
//               </select>
//             </div>

//             <div className="col-md-4">
//               <label>Min Salary</label>
//               <select className="form-control" name="minSalary" value={filters.minSalary} onChange={handleFilterChange}>
//                 <option value="">Select</option>
//                 {[5000, 10000, 15000, 20000, 30000, 40000, 50000, 70000, 80000].map(salary => (
//                   <option key={salary} value={salary}>{salary}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="col-md-4">
//               <label>State</label>
//               <select className="form-control" name="state" value={filters.state} onChange={handleFilterChange}>
//                 <option value="">Select</option>
//                 {/* Populate dynamically */}
//               </select>
//             </div>
//           </div>

//           <div className="mt-3 text-right">
//             <button type="button" className="btn btn-success" onClick={fetchJobs}>Search</button>
//             <button type="reset" className="btn btn-danger ml-2" onClick={() => setFilters({})}>Reset</button>
//           </div>
//         </form>
//       </section>

//       {/* Job Listings */}
//       <section className="job-listings mt-3">
//         <div className="row">
//           {jobs.length > 0 ? (
//             jobs.map(job => (
//               <div className="col-md-6" key={job._id}>
//                 <div className="job-card">
//                   <Link to={`/candidate/job/${job._id}`}>
//                     <h5>{job.displayCompanyName || job._company[0]?.name || "N/A"}</h5>
//                     <span className="job-title">{job.title || "N/A"}</span>
//                   </Link>

//                   <div className="row">
//                     <div className="col-md-6">
//                       <p>Salary: ₹{job.isFixed ? job.amount : `${job.min || "N/A"} - ${job.max || "N/A"}`}</p>
//                     </div>
//                     <div className="col-md-6">
//                       <p>Experience: {job.experience === 0 ? "Fresher" : `${job.experience} Years`}</p>
//                     </div>
//                     <div className="col-md-6">
//                       <p>Qualification: {job.qualifications[0]?.name || "N/A"}</p>
//                     </div>
//                     <div className="col-md-6">
//                       <p>Location: {job.city[0]?.name}, {job.state[0]?.name}</p>
//                     </div>
//                   </div>

//                   <div className="row mt-2">
//                     <div className="col-md-6">
//                       <Link to={`/candidate/job/${job._id}`} className="btn btn-primary">Apply</Link>
//                     </div>
//                     <div className="col-md-6">
//                       <a href={`tel:${job.contactNumber}`} className="btn btn-success">Call Now</a>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <h4 className="text-center w-100">No Jobs Found</h4>
//           )}
//         </div>
//       </section>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <nav className="mt-4">
//           <ul className="pagination justify-content-end">
//             {[...Array(totalPages).keys()].map(i => (
//               <li key={i} className={`page-item ${i + 1 === currentPage ? "active" : ""}`}>
//                 <button className="page-link" onClick={() => handlePageChange(i + 1)}>
//                   {i + 1}
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </nav>
//       )}
//     </div>
//   );
// };

// export default CandidatesJobs;


import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import './CandidateJobs.css';

const CandidatesJobs = () => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const googleMapsRef = useRef(null);

  // State variables
  const [jobs, setJobs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isMapView, setIsMapView] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(true);
  const [formOptions, setFormOptions] = useState({
    allQualification: [],
    allIndustry: [],
    allStates: [],
    skills: []
  });

  // Filter form data
  const [filterData, setFilterData] = useState({
    name: '',
    qualification: '',
    experience: '',
    industry: '',
    jobType: '',
    minSalary: '',
    techSkills: '',
    state: '',
    distance: 'all',
    jobView: 'list'
  });
  const [videoSrc, setVideoSrc] = useState("");
  const videoRef = useRef(null);


  const handleVideoClick = (videoUrl) => {
    setVideoSrc(videoUrl);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play();
      }
    }, 300); // delay to ensure modal is open
  };



  // Parse query parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const newFilterData = { ...filterData };

    // Update filter data from query params
    for (const [key, value] of queryParams.entries()) {
      if (key === 'page') {
        setPage(parseInt(value) || 1);
      } else if (key in newFilterData) {
        newFilterData[key] = value;
      }
    }

    // Set map view if specified in query params
    if (newFilterData.jobView === 'map') {
      setIsMapView(true);
    }

    setFilterData(newFilterData);

    // Load form options
    fetchFormOptions();
  }, [location.search]);

  // Fetch jobs when filter data or page changes
  useEffect(() => {
    fetchJobs();
  }, [filterData, page]);

  // Initialize Google Maps when map view is activated
  useEffect(() => {
    if (isMapView && window.google && mapRef.current) {
      initMap();
    }
  }, [isMapView, jobs]);

  // Fetch form options for dropdowns
  const fetchFormOptions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/candidate/form-options`);
      if (response.data) {
        setFormOptions({
          allQualification: response.data.qualifications || [],
          allIndustry: response.data.industries || [],
          allStates: response.data.states || [],
          skills: response.data.skills || []
        });
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
    }
  };

  // Fetch jobs based on filter criteria
  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      console.log("api hitting");

      // Add filters to params
      for (const [key, value] of Object.entries(filterData)) {
        if (value) {
          params.append(key, value);
        }
      }

      // Add pagination
      params.append('page', page);

      // const response = await axios.get(`${backendUrl}/candidate/searchjob?${params.toString()}`);
      const response = await axios.get(`${backendUrl}/candidate/searchjob?${params.toString()}`, {
        headers: {
          'x-auth': localStorage.getItem('token') || '', // token must be present
        },
      });
      
      console.log("response from localhost", response.data)
      if (response.data) {
        console.log("Fetched Jobs:", response.data.jobs);
        setJobs(response.data.jobs || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Initialize Google Maps
  const initMap = () => {
    if (!window.google || !mapRef.current) return;

    const fetchJobsForMap = async () => {
      try {
        const params = new URLSearchParams();

        // Add filters to params
        for (const [key, value] of Object.entries(filterData)) {
          if (value) {
            params.append(key, value);
          }
        }

        const response = await axios.get(
          `${backendUrl}/candidate/getNearbyJobsForMap?${params.toString()}`,
          {
            headers: {
              'x-auth': localStorage.getItem('token')
            }
          }
        );

        if (!response.data.status) {
          // If user location is not set
          const mapElement = document.getElementById('error');
          if (mapElement) {
            mapElement.textContent = 'Add your Current Location';
          }

          // Create a default map
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 9
          });

          googleMapsRef.current = map;
        } else {
          // Create a map centered on the nearest job
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 9,
            center: {
              lat: response.data.nearest?.location?.coordinates[1],
              lng: response.data.nearest?.location?.coordinates[0]
            }
          });

          googleMapsRef.current = map;

          // Add markers for each job
          response.data.jobs.forEach(job => {
            const position = {
              lat: job.location.coordinates[1],
              lng: job.location.coordinates[0]
            };

            // Create info window content
            const content = `
              <div>
                <p>${job.displayCompanyName ? job.displayCompanyName : job._company[0].name}</p>
                <p>${job.city[0]?.name}, ${job.state[0].name}</p>
                <p>Industry: ${job._industry[0].name}</p>
                <p>Qualification: ${job._qualification[0].name}</p>
                <p>Salary: ${job.isFixed && job.amount
                ? job.amount
                : job.isFixed === false && job.min
                  ? job.min
                  : "NA"}</p>
                <p>Location: ${Math.round(job.distance / 1000)} km</p>
                <a href="/candidate/job/${job._id}">View Details</a>
              </div>
            `;

            const infowindow = new window.google.maps.InfoWindow({
              content
            });

            const marker = new window.google.maps.Marker({
              position,
              map,
              icon: {
                url: "/images/marker.png",
                scaledSize: new window.google.maps.Size(35, 35)
              }
            });

            marker.addListener('click', () => {
              infowindow.open(map, marker);
            });
          });
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    fetchJobsForMap();
  };

  // Handle filter form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle radio button changes for distance filter
  const handleDistanceChange = (e) => {
    const { value } = e.target;
    setFilterData(prev => ({
      ...prev,
      distance: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Create query parameters from filter data
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filterData)) {
      if (value) {
        params.append(key, value);
      }
    }

    // Reset to page 1 when filtering
    params.append('page', '1');

    // Navigate to same page with new query params
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Handle reset button click
  const handleReset = () => {
    navigate('/candidate/searchjob');
    setFilterData({
      name: '',
      qualification: '',
      experience: '',
      industry: '',
      jobType: '',
      minSalary: '',
      techSkills: '',
      state: '',
      distance: 'all',
      jobView: 'list'
    });
    setPage(1);
    setIsMapView(false);
  };

  // Toggle between map and list view
  const toggleMapView = () => {
    const newIsMapView = !isMapView;
    setIsMapView(newIsMapView);

    setFilterData(prev => ({
      ...prev,
      jobView: newIsMapView ? 'map' : 'list'
    }));

    // Update query params
    const params = new URLSearchParams(location.search);
    params.set('jobView', newIsMapView ? 'map' : 'list');
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set('page', newPage);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Generate pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && page >= 2) {
      first = page - 1;
      last = page + 1;
      if (last > totalPages) last = totalPages;
    }

    const pages = [];

    // Add "First" button if needed
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="pageAnchor page-link" onClick={() => handlePageChange(1)}>First</button>
        </li>
      );
    }

    // Add page numbers
    for (let i = first; i <= last; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
          <button
            className={`page-link ${i === page ? 'pagi_custom' : 'pagi_customtwo'}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }

    // Add "Last" button if needed
    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="pageAnchor page-link" onClick={() => handlePageChange(last + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="pageAnchor page-link" onClick={() => handlePageChange(totalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2 text-right">
        {pages}
      </ul>
    );
  };

  return (
    <>

      {/* Header section */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12 my-auto">
              <h3 className="content-header-title float-left mb-0">Search Job</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Search Job</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter section */}
      <section id="personal-info">
        <div className="row">
          <div className="col-xl-12 col-lg-12">
            <div id="accordion">
              <div className="card mt-xl-0 mt-lg-0 mt-md-0 mt-sm-2 mt-2 mb-0">
                <div className="card-header fliter-block py-1" id="headingOne">
                  <div className="row">
                    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-7 col-6 my-auto">
                      <h5 className="mt-1">Search Job / नौकरी खोजें</h5>
                    </div>

                    <div className="col-xl-8 col-lg-8 col-md-8 col-sm-5 col-6 text-right my-auto">
                      <div className="d-flex flex-wrap align-items-center justify-content-end gap-3">
                        <img
                          src={isMapView ? "/Assets/images/icons/map.png" : "/Assets/images/icons/map.png"}
                          // src={isMapView ? "/Assets/images/icons/map.png" : "/images/icons/listing.png"} 
                          onClick={toggleMapView}
                          className="btn btn-link collapsed py-0 mx-0 px-1 list" style={{border: 'none!important'}}
                          id="view"
                          alt="View toggle"
                        />
                        <img
                          src="/Assets/images/filtern.png"
                          className="btn btn-link collapsed py-0 mx-0"
                          onClick={() => setFilterCollapsed(!filterCollapsed)} style={{border: 'none!important'}}
                          id="filter-img"
                          alt="Filter"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div id="collapseOne" className={`collapse ${!filterCollapsed ? 'show' : ''}`}>
                  <div className="card-body px-1 py-0">
                    <div className="card border border-top-1">
                      <div id="filter">
                        <div className="card-content">
                          <div className="card-body" style={{ padding: '1.5rem' }}>
                            <form onSubmit={handleSubmit}>
                              <div className="row my-0 mx-0" id="allFields">
                                {/* Company Name */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Company Name</label>
                                  <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    id="username"
                                    value={filterData.name}
                                    onChange={handleInputChange}
                                    maxLength="25"
                                  />
                                </div>

                                {/* Minimum Qualification */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Minimum Qualification</label>
                                  <select
                                    className="form-control"
                                    id="qualification"
                                    name="qualification"
                                    value={filterData.qualification}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select Option</option>
                                    {formOptions.allQualification.map(qualification => (
                                      <option
                                        key={qualification._id}
                                        value={qualification._id}
                                        className="text-capitalize"
                                      >
                                        {qualification.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Experience */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Experience(Yrs)</label>
                                  <select
                                    className="form-control"
                                    name="experience"
                                    id="exp-field"
                                    value={filterData.experience}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select</option>
                                    <option value="0">0</option>
                                    {[...Array(15)].map((_, i) => (
                                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Industry */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Industry</label>
                                  <select
                                    className="form-control"
                                    id="industry"
                                    name="industry"
                                    value={filterData.industry}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select Option</option>
                                    {formOptions.allIndustry.map(industry => (
                                      <option
                                        key={industry._id}
                                        value={industry._id}
                                        className="text-capitalize"
                                      >
                                        {industry.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Job Type */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Job Type</label>
                                  <select
                                    className="form-control"
                                    id="jobType"
                                    name="jobType"
                                    value={filterData.jobType}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select Option</option>
                                    <option value="Part Time">Part Time</option>
                                    <option value="Full Time">Full Time</option>
                                  </select>
                                </div>

                                {/* Minimum Offered Salary */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Minimum Offered Salary</label>
                                  <select
                                    className="form-control"
                                    id="minSalary"
                                    name="minSalary"
                                    value={filterData.minSalary}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select Option</option>
                                    <option value="5000">5000</option>
                                    <option value="10000">10000</option>
                                    <option value="15000">15000</option>
                                    <option value="20000">20000</option>
                                    <option value="30000">30000</option>
                                    <option value="40000">40000</option>
                                    <option value="50000">50000</option>
                                    <option value="70000">70000</option>
                                    <option value="80000">80000+</option>
                                  </select>
                                </div>

                                {/* Technical Skills */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>Technical Skills</label>
                                  <select
                                    className="form-control text-capitalize"
                                    name="techSkills"
                                    id="techSkills"
                                    value={filterData.techSkills}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select</option>
                                    {formOptions.skills.filter(skill => skill.type === 'technical').map(skill => (
                                      <option
                                        key={skill._id}
                                        value={skill._id}
                                        className="text-capitalize"
                                      >
                                        {skill.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* State */}
                                <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-6 col-12">
                                  <label>State</label>
                                  <select
                                    className="form-control"
                                    id="state"
                                    name="state"
                                    value={filterData.state}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">Select Option</option>
                                    {formOptions.allStates.map(state => (
                                      <option
                                        key={state._id}
                                        value={state._id}
                                        className="text-capitalize"
                                      >
                                        {state.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Distance Slider */}
                                <div className="col-xl-6 col-lg-6 col-md-8 col-sm-12 col-12 my-xl-2 my-lg-2 my-md-2 my-sm-2 my-1 px-xl-1 px-lg-1 px-md-1 px-sm-0 px-0">
                                  <div id="form-wrapper">
                                    <label className="px-1">Jobs Near Me (KMs)</label>
                                    <div id="debt-amount-slider">
                                      <input
                                        type="radio"
                                        name="distance"
                                        id="1"
                                        value="50"
                                        checked={filterData.distance === '50'}
                                        onChange={handleDistanceChange}
                                      />
                                      <label htmlFor="1" data-debt-amount="50 km"></label>

                                      <input
                                        type="radio"
                                        name="distance"
                                        id="2"
                                        value="100"
                                        checked={filterData.distance === '100'}
                                        onChange={handleDistanceChange}
                                      />
                                      <label htmlFor="2" data-debt-amount="100 km"></label>

                                      <input
                                        type="radio"
                                        name="distance"
                                        id="3"
                                        value="250"
                                        checked={filterData.distance === '250'}
                                        onChange={handleDistanceChange}
                                      />
                                      <label htmlFor="3" data-debt-amount="250 km"></label>

                                      <input
                                        type="radio"
                                        name="distance"
                                        id="4"
                                        value="500"
                                        checked={filterData.distance === '500'}
                                        onChange={handleDistanceChange}
                                      />
                                      <label htmlFor="4" data-debt-amount="500 km"></label>

                                      <input
                                        type="radio"
                                        name="distance"
                                        id="5"
                                        value="all"
                                        checked={!filterData.distance || filterData.distance === 'all'}
                                        onChange={handleDistanceChange}
                                      />
                                      <label htmlFor="5" data-debt-amount="500+ km"></label>

                                      <div id="debt-amount-pos"></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Submit & Reset Buttons */}
                                <div className="col-xl-6 col-lg-6 col-md-4 col-sm-12 col-12 mt-3 text-right">
                                  <input type="hidden" id="jobView" name="jobView" value={filterData.jobView} />
                                  <button
                                    className="btn-success-px extra-ss btn btn-success d-inline waves-effect waves-light mb-md-0 mb-sm-0 mb-2 text-white mx-md-4 mx-0 px-xl-2 px-lg-2 px-md-2 px-sm-2 px-1"
                                    id="search-button"
                                    type="submit"
                                  >
                                    Go
                                  </button>
                                  <button
                                    className="btn-success-px extra-ss btn btn-danger d-inline waves-effect waves-light mb-md-0 mb-sm-0 mb-2 text-white mx-md-0 mx-0 px-xl-2 px-lg-2 px-md-2 px-sm-2 px-1"
                                    type="button"
                                    onClick={handleReset}
                                  >
                                    RESET
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs listing section */}
      <section className="searchjobspage" style={{ display: isMapView ? 'none' : 'block' }}>
        <div className="">
          <div className="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
            <div className="course_nw mb-3">
              <div className="row justify-content-sm-center justify-content-md-start">
                {jobs && jobs.length > 0 ? (
                  jobs.map((job, index) => (
                    <div className="col-lg-6 col-md-6 col-sm-9" key={job._id || index}>
                      <div className="cr_nw_in">
                        <a
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#videoModal"
                          onClick={(e) => {
                            e.preventDefault();
                            handleVideoClick(job.jobVideo || "");

                          }}
                          className="video-bttn position-relative d-block"
                        >
                          <img
                            src={job.jobVideoThumbnail || "/Assets/images/pages/video_thum1.png"}
                            className="video_thum img-fluid"
                            alt="Job Thumbnail"
                          />

                        </a>

                        <div className="course_inf">
                          <Link to={`/candidate/job/${job._id}`}>
                            <h5>{job.displayCompanyName || job._company[0]?.name}</h5>
                            <span className="job_cate">{job.title || 'NA'}</span>
                            <div className="row">
                              {/* Salary */}
                              <div className="col-md-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-money"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">
                                      ₹ {job.isFixed ? (job.amount || 'NA') :
                                        ((job.min || 'NA') + ' - ' + (job.max || 'NA'))}
                                    </h3>
                                    <span className="text-capitalize jobDetails-wrap">
                                      Minimum Salary / न्यूनतम वेतन
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Experience */}
                              <div className="col-md-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-shield"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">
                                    {(job.experience == 0 && job.experienceMonths == 0) || (job.experience == 0 && !job.experienceMonths )
                                                ? "Fresher"
                                                : `${job.experience > 0 ? `${job.experience} ${job.experience === 1 ? 'Year' : 'Years'}` : ''} ${job.experienceMonths > 0 ? `${job.experienceMonths} ${job.experienceMonths === 1 ? 'Month' : 'Months'}` : ''}`.trim()}
                                    </h3>
                                    <span className="jobDetails-wrap">
                                      Experience / अनुभव
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Qualification */}
                              <div className="col-md-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-shield"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">
                                      {job.qualifications?.[0]?.name || 'NA'}
                                    </h3>
                                    <span className="text-capitalize jobDetails-wrap">
                                      Qualification / योग्यता
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Location */}
                              <div className="col-md-6">
                                <div className="course_spec">
                                  <div className="spe_icon">
                                    <i className="la la-map"></i>
                                  </div>
                                  <div className="spe_detail">
                                    <h3 className="jobDetails-wrap">Location</h3>
                                    <span className="text-capitalize jobDetails-wrap">
                                      {Math.round(job.distance)} Kms, {job.city?.[0]?.name}, {job.state?.[0]?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>

                          {/* Action Buttons */}
                          <div className="act_btn mt-2 row">
                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-2 mb-2">
                              <Link
                                className="apply-thisjob text-left apply-padding same-plane call-btn px-1"
                                to={`/candidate/job/${job._id}`}
                                title="Call Now"
                              >
                                <i className="la la-phone plane-font"></i> Call Now
                              </Link>
                            </div>
                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                              <Link
                                className="apply-thisjob text-left px-1 apply-padding mb-0 mt-0"
                                to={`/candidate/job/${job._id}`}
                                title="Apply for Job"
                              >
                                <i className="la la-paper-plane"></i>
                                Apply for Job / नौकरी के लिए आवेदन
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <h4 className="text-center">No Jobs found</h4>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile view jobs listing */}
        <div className="forsmallscrn d-none">
          <div className="container search-page pt-xl-5 pt-lg-0 pt-md-0 pt-sm-0 pt-0">
            {jobs && jobs.length > 0 ? (
              jobs.map((job, index) => (
                <div className="row pointer" key={job._id || index}>
                  <div className="card-body px-0">
                    <div className="col-lg-8 col-md-7 column">
                      <div className="job-single-sec">
                        <div className="job-single-head border-0 pb-0">
                          <div className="job-head-info">
                            <h6 className="text-capitalize font-weight-bolder">
                              {job.title || 'NA'}
                            </h6>
                            <span className="text-capitalize set-lineh">
                              {job.displayCompanyName || job._company?.[0]?.name}
                            </span>
                          </div>
                        </div>
                        <Link to={`/candidate/job/${job._id}`}>
                          <div className="job-overview mt-1">
                            <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                              <li>
                                <i className="la la-money"></i>
                                <h3 className="jobDetails-wrap">
                                  ₹ {job.isFixed ? (job.amount || 'NA') :
                                    ((job.min || 'NA') + ' - ' + (job.max || 'NA'))}
                                </h3>
                                <span className="text-capitalize jobDetails-wrap">
                                  Minimum Salary / न्यूनतम वेतन
                                </span>
                              </li>
                              <li>
                                <i className="la la-shield"></i>
                                <h3 className="jobDetails-wrap">
                                {(job.experience == 0 && job.experienceMonths == 0) || (job.experience == 0 && !job.experienceMonths )
                                                ? "Fresher"
                                                : `${job.experience > 0 ? `${job.experience} ${job.experience === 1 ? 'Year' : 'Years'}` : ''} ${job.experienceMonths > 0 ? `${job.experienceMonths} ${job.experienceMonths === 1 ? 'Month' : 'Months'}` : ''}`.trim()}
                                  
                                </h3>
                                <span className="jobDetails-wrap">
                                  Experience / अनुभव
                                </span>
                              </li>
                              <li>
                                <i className="la la-line-chart"></i>
                                <h3 className="jobDetails-wrap">
                                  {job.qualifications?.[0]?.name || 'NA'}
                                </h3>
                                <span className="text-capitalize jobDetails-wrap">
                                  Qualification / योग्यता
                                </span>
                              </li>
                              <li>
                                <i className="la la-map"></i>
                                <h3 className="jobDetails-wrap">
                                  Location
                                </h3>
                                <span className="text-capitalize jobDetails-wrap">
                                  {Math.round(job.distance)} Kms, {job.city?.[0]?.name}, {job.state?.[0]?.name}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </Link>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-5 column mt-xl-4 mt-lg-5 mt-md-5 mt-sm-3 mt-2">
                      <Link
                        className="apply-thisjob text-left px-0 d-xl-block d-lg-block d-md-block d-sm-none d-none apply-padding text-center"
                        to={`/candidate/job/${job._id}`}
                        title="Apply for Job"
                      >
                        <i className="la la-paper-plane"></i>
                        Apply for Job / नौकरी के लिए आवेदन
                      </Link>

                      <div className="row">
                        <div className="col-6 same-plane mt-2">
                          <Link
                            className="apply-thisjob text-center py-1 px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100 same-plane"
                            to={`/candidate/job/${job._id}`}
                            title="Apply"
                          >
                            <i className="la la-paper-plane ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl plane-font"></i>
                            Apply / आवेदन
                          </Link>
                        </div>
                        <div className="col-6 same-plane mt-2">
                          <Link
                            className="apply-thisjob text-center py-1 px-0 d-xl-none d-lg-none d-md-none d-sm-block d-block w-100 same-plane call-btn"
                            title="Call"
                            to={`/candidate/job/${job._id}`}
                          >
                            <i className="la la-phone ml-xl-3 mt-lg-3 mt-md-2 mt-sm-0 ml-xl-0 ml-lg-0 ml-md-1 ml-sm-2 ml-0 text-center-sm text-center-md text-center-lg text-center-xl plane-font"></i>
                            Call / कॉल
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <h4 className="text-center">No Jobs found</h4>
            )}
          </div>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </section>

      {/* Map section */}
      <section className="map" style={{ display: isMapView ? 'block' : 'none' }}>
        <div className="row">
          <div className="col-xl-12 col-lg-12">
            <div id="collapseOne" className="collapse" aria-labelledby="headingOne" data-parent="#accordion">
              <div className="card-body px-1 py-0">
                <div className="card border border-top-1">
                  <div id="filter">
                    <div className="card-content">
                      <div className="card-body p-0">
                        <div className="row my-0 mx-0" id="allFields">
                          <div className="cont" style={{ display: 'none' }}>
                            <p id="companyNameMarker"></p>
                            <p id="stateCityMarker"></p>
                            <p id="industryMarker"></p>
                            <p id="qualificationMarker"></p>
                            <p id="salaryMarker"></p>
                            <p id="locationMarker"></p>
                            <a id="jobDetailsMarker"></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-12 col-lg-12">
            <div id="error" style={{ color: 'red' }}></div>
            <div
              id="map"
              ref={mapRef}
              style={{ width: '100%', height: '400px' }}
              className="rounded"
            ></div>
          </div>
        </div>
      </section>

      {/* Complete Profile Modal */}
      <div
        className="modal fade"
        id="popup"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalCenterTitle"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">
                Complete Profile
              </h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <ul className="list-unstyled">
                <li className="mb-1"></li>
              </ul>
              <h5 className="pb-1 mb-0">
                Please set your location before looking for jobs nearby<br />
                आस-पास की नौकरियों की तलाश करने से पहले कृपया मेरी प्रोफ़ाइल पर अपना स्थान निर्धारित करें।
              </h5>
            </div>
            <div className="modal-footer">
              <Link to="/candidate/myProfile">
                <button type="submit" className="btn btn-primary">Complete Profile</button>
              </Link>
              <button type="button" className="btn btn-primary" data-dismiss="modal">
                <i className="feather icon-x d-block d-lg-none"></i>
                <span className="d-none d-lg-block">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <div
        className="modal fade"
        id="videoModal"
        tabIndex="-1"
        aria-labelledby="videoModalTitle"
        aria-hidden="true"
        onClick={() => setVideoSrc("")}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div className="modal-body p-0 text-center embed-responsive">
              <video ref={videoRef} controls className="video-fluid text-center" key={videoSrc}>
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>

      <style>
        {
          `
.btn-success-px{
padding-inline : 1.5rem!important;
} 
#view, #filter-img {
  border: none !important;
}   
    
    `
        }
      </style>

    </>
  );
};

export default CandidatesJobs;