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

  // Share job function
  const handleShareJob = async (jobId, jobTitle, companyName) => {
    const jobUrl = `${window.location.origin}/candidate/job/${jobId}`;
    const jobTitleText = jobTitle || 'Job Opportunity';
    const companyText = companyName ? ` at ${companyName}` : '';
    const shareText = `Check out this job opportunity${companyText}: ${jobTitleText}\n\n${jobUrl}\n\nनौकरी का मौका देखें${companyText}: ${jobTitleText}`;

    // Try Web Share API first (works on mobile devices and modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: jobTitleText,
          text: shareText,
          url: jobUrl,
        });
        return;
      } catch (error) {
        // User cancelled or error occurred, fall through to WhatsApp
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }

    // Fallback to WhatsApp sharing (common pattern in this codebase)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
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
                    <div className="col-lg-4 col-md-4 col-sm-9" key={job._id || index}>
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
                                style={{ fontWeight: 'bold' }}
                              >
                                <i className="la la-paper-plane"></i>
                                Apply for Job / नौकरी के लिए आवेदन
                              </Link>
                            </div>
                            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 offset-xl-3 offset-lg-3 mt-3">
                              <button
                                className="apply-thisjob text-center px-1 apply-padding mb-0 mt-0 w-100"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleShareJob(
                                    job._id,
                                    job.title,
                                    job.displayCompanyName || job._company?.[0]?.name
                                  );
                                }}
                                title="Share Job"
                              >
                                <i className="la la-share"></i>
                                Share
                              </button>
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
          <div className="modal-content p-0">
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
          <div className="modal-content p-0">
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

      <style>
        {
          `
          .card .card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  border-bottom: none;
  padding: 1.5rem 1.5rem 0;
  background-color: transparent;
}

.card-header {
  padding: 1.5rem 1.5rem;
  margin-bottom: 0;
  background-color: rgba(34, 41, 47, 0.03);
  border-bottom: 1px solid rgba(34, 41, 47, 0.125);
}

.card-header:first-child {
  border-radius: calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0;
}

.fliter-block {
  display: block !important;
}

form #debt-amount-slider {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  position: relative;
  width: 100%;
  height: 50px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form #debt-amount-slider::before {
  content: " ";
  position: absolute;
  height: 2px;
  width: 100%;
  width: calc(100%*(4 / 5));
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #a39a9a;
}

form #debt-amount-slider input {
  display: none;
}

form #debt-amount-slider input,
form #debt-amount-slider label {
  box-sizing: border-box;
  flex: 1;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: pointer;
}

form #debt-amount-slider label {
  display: inline-block;
  position: relative;
  width: 20%;
  height: 100%;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form:valid #debt-amount-slider input+label::before {
  transform: translate(-50%, 40px) scale(0.8);
  transition: all 0.15s linear;
}

form #debt-amount-slider label::before {
  content: attr(data-debt-amount);
  position: absolute;
  left: 50%;
  padding-top: 10px;
  transform: translate(-50%, 40px);
  font-size: 14px;
  letter-spacing: 0.4px;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0.85;
  transition: all 0.15s ease-in-out;
}

form #debt-amount-slider label::after {
  content: " ";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #625c5c;
  background: #fff;
  border-radius: 50%;
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: 1;
  cursor: pointer;
  transition: all 0.15sease-in-out;
}
form #debt-amount-slider input:checked:nth-child(3) ~ #debt-amount-pos {
  left: 30%;
}
form #debt-amount-slider input:checked:nth-child(5) ~ #debt-amount-pos {
  left: 50%;
}
form #debt-amount-slider input:checked:nth-child(7) ~ #debt-amount-pos {
  left: 70%;
}

form #debt-amount-slider input:checked:nth-child(9)~#debt-amount-pos {
  left: 90%;
}

form #debt-amount-slider input:checked~#debt-amount-pos {
  opacity: 1;
}

form #debt-amount-slider #debt-amount-pos {
  display: block;
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #FC2B5A;
  border-radius: 50%;
  transition: all 0.15sease-in-out;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  opacity: 0;
  z-index: 2;
}

/* .card-body {
    flex: 1 1 auto;
    padding: 1.5rem;
} */
form:valid #debt-amount-slider input:checked+label::before {
  color: #FC2B5A;
  transform: translate(-50%, 40px) scale(1.1);
  transition: all 0.15slinear;
}

form #debt-amount-slider input:checked+label::before {
  font-weight: 800;
  opacity: 1;
}

form #debt-amount-slider input:checked:nth-child(1)~#debt-amount-pos {
  left: 10%;
}

.searchjobspage .card {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1rem;
}

.fliter-block {
  background-color: #fff;
  border-bottom: 1px solid #dfe3e7;
}

.filterSearchJob {
  margin-bottom: 1rem;
}

.filterSearchJob label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Course/Job Card Styles */
.course_nw {
  margin-top: 1rem;
}

.cr_nw_in {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cr_nw_in:hover {
  transform: translateY(-5px);
}

.video_thum {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.course_inf {
  padding: 1rem;
}

.course_inf h5 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.job_cate {
  color: #6e6b7b;
  display: block;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.curs_description span.job_cate {
  background: #1b95391a;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: #1b9539;
  border: solid 1px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: inline;
}
.course_spec {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.spe_icon {
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.spe_icon i {
  color: #7367f0;
  font-size: 1.5rem;
}

.spe_detail h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.spe_detail span {
  color: #6e6b7b;
  font-size: 0.8rem;
}

.jobDetails-wrap {
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* Job action buttons */
.act_btn {
  margin-top: 1rem;
}

.apply-thisjob {
  background-color: #FC2B5A;
  float: left;
  width: calc(100% - 30px);
  border: 2px solid #FC2B5A;
  text-align: center;
  color: #fff;
  -webkit-border-radius: 8px;
  -moz-border-radius: 8px;
  -ms-border-radius: 8px;
  -o-border-radius: 8px;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 12px;
  font-family: Open Sans;
  font-weight: bold;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 0.5rem;
}

.call-btn {
  background-color: #1b9539 !important;
  border:
    2px solid #1b9539 !important;
}

.call-btn:hover {
  color: #1b9539 !important;
  border: 2px solid #1b9539 !important;
  background-color: #fff !important;
}

.act_btn .apply-thisjob {
  width: 100% !important;
  margin-bottom: 0px;
  text-align: center !important;
}

@media only screen and (max-width: 1400px) {
  .act_btn .apply-thisjob {
    padding:
      7px !important;
    font-size: 11px;
    height:50px
  }

  .act_btn .apply-thisjob i {
    font-size: 18px;
    top: 2px;
    margin-right: 3px;

  }
}

.call-btn:hover {
  background-color: #24b263;
}

.same-plane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.plane-font {
  font-size: 1.2rem;
}

/* Map section styles */
.map {
  margin-top: 1rem;
}

#map {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
}

/* Distance slider styles */
#debt-amount-slider {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  margin-top: 1rem;
}

#debt-amount-slider input[type="radio"] {
  position: absolute;
  opacity: 0;
}

#debt-amount-slider label {
  cursor: pointer;
  position: relative;
  display: block;
  width: 20%;
  height: 100%;
  text-align: center;
}

#debt-amount-slider label:after {
  content: attr(data-debt-amount);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #6e6b7b;
}

#debt-amount-slider label:before {
  content: '';
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  /* background-color: #ddd; */
  transition: background-color 0.3s ease;
}

/* #debt-amount-slider input[type="radio"]:checked+label:before {
  background-color: #7367f0;
} */

#debt-amount-pos {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background-color: #7367f0;
  pointer-events: none;
  transition: width 0.2s ease, left 0.2s ease;
}

/* Pagination styles */
.pagination {
  margin-top: 1rem;
}

.page-link {
  color: #7367f0;
  border-radius: 4px;
  margin: 0 2px;
}

.page-item.active .page-link {
  background-color: #7367f0;
  border-color: #7367f0;
}

.pagi_custom {
  background-color: #7367f0;
  color: #fff;
}

.pagi_customtwo:hover {
  background-color: rgba(115, 103, 240, 0.1);
}

/* Responsive styles */
@media (max-width: 768px) {
  .content-header {
    display: none;
  }

  .searchjobspage .card-body {
    padding: 0.75rem;
  }

  .forsmallscrn {
    display: block !important;
  }

  .forlrgscreen {
    display: none;
  }

  .cr_nw_in {
    margin-bottom: 1rem;
  }

  .act_btn .col-xl-6 {
    margin-bottom: 0.5rem;
  }

  /* Row width auto for mobile devices only on this page */
  .row {
    width: auto;
  }
}

/* Modal styles */
.modal-content {
  border-radius: 8px;
  /* overflow: hidden; */
}

.modal-header {
  background-color: #7367f0;
  color: #fff;
}

.modal-title {
  font-weight: 600;
}

.close {
  color: #fff;
}

.btn-primary {
  background-color: #7367f0;
  border-color: #7367f0;
}

.btn-primary:hover {
  background-color: #5e50ee;
  border-color: #5e50ee;
}

/* Job Details Styles */

/* Rating Star Styles */
label.review {
  display: block;
}

input.star {
  display: none;
}

label.star {
  float: right;
  padding: 10px;
  font-size: 30px !important;
  color: #444;
  transition: all .2s;
}

input.star:hover ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star:checked ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star-5:hover ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

input.star-5:checked ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

label.star:hover {
  transform: rotate(-15deg) scale(1.3);
}

label.star:before {
  content: '\f006';
  font-family: FontAwesome;
}

input.star:checked ~ .rev-box {
  height: 125px;
  overflow: visible;
}

/* Job Details Specific Styles */
.course_dtl {
  margin-bottom: 20px;
}

.curs_description h4 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
}

.job_cate {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
  display: block;
}

.course_spec {
  display: flex;
  margin-top: 25px;
}

.spe_icon {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.spe_detail h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 0;
}

.jobDetails-wrap {
  margin-bottom: 5px;
}

.job-single-sec {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px 0;
}

.job-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 15px;
}
.v_pal img {
  border-radius: 8px;
}
.course_dtl h6 {
  font-size: 17px;
  font-weight: 600;
  margin-top: 35px;
}
.apply-thisjob {
  background-color: #FC2B5A;
  color: #fff;
  border-radius: 5px;
  padding: 12px 20px;
  font-weight: 500;
  display: inline-block;
  text-decoration: none !important;
  transition: background-color 0.3s;
  margin-bottom: 10px;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 8px;
}

.disabled-button {
  background-color: #888;
  cursor: not-allowed;
}

.disabled-button:hover {
  background-color: #888;
  border: 2px solid#888;
  color: #fff!important;
}

.call-btn {
  background-color: #28a745;
}

.call-btn:hover {
  background-color: #218838;
}

.rebase-job {
  background-color: #17a2b8;
}

.rebase-job:hover {
  background-color: #138496;
  border: 2px solid #138496;
  color: #fff!important;
}
.btn{
  border: 1px solid #FC2B5A!important;
}

.rebase-job.disabled {
  background-color: #888;
  cursor: not-allowed;
  border: 1px solid #888;
}

.extra-job-info {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.extra-job-info span {
  display: block;
  margin-bottom: 10px;
  color: #666;
}

.extra-job-info strong {
  display: inline-block;
  margin-right: 5px;
  color: #333;
  min-width: 150px;
}

.extra-job-info i {
  margin-right: 8px;
  color: #FC2B5A;
}

/* Course Card Styles */
.pointer {
  cursor: pointer;
}

.job-overview {
  margin-bottom: 20px;
}

.job-overview h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.job-overview ul li {
  display: flex;
  margin-bottom: 15px;
}

.job-overview ul li i {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.custom_sty {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

/* Media Gallery Styles */
.carousel-gallery {
  position: relative;
  margin-bottom: 30px;
}

.swiper-wrapper {
  display: flex;
}

.swiper-slide {
  width: 33.333%;
  transition: 0.3s;
}

.swiper-slide .image {
  width: 100%;
  height: 200px;
  border-radius: 5px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.swiper-slide .image .overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
}

.swiper-slide .image .overlay em {
  color: #fff;
  font-size: 24px;
}

.swiper-slide:hover .image .overlay {
  opacity: 1;
}

.swiper-pagination {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.swiper-pagination-bullet {
  width: 10px;
  height: 10px;
  background: #ccc;
  margin: 0 5px;
  border-radius: 50%;
  cursor: pointer;
}

.swiper-pagination-bullet-active {
  background: #FC2B5A;
}

/* Video Gallery Styles */
.position-relative {
  position: relative;
}

.play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.pluscenter .pulse {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: pulse 1.5s infinite;
}

.uplay {
  width: 30px;
  height: 30px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal Styles */
.modal-content {
  border-radius: 5px;
  overflow: hidden;
}

.modal-header {
  background-color: #FC2B5A;
  color: #fff;
  border-bottom: none;
}

.modal-title {
  font-weight: 600;
}

.modal-header .close {
  color: #fff;
  opacity: 0.8;
}

.modal-header .close:hover {
  opacity: 1;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  border-top: none;
  padding: 15px 20px;
}

.vchr_header {
  background-color: #6f42c1;
}

.mode-dice {
  background-color: #532e92;
  color: #fff;
}

.coupon-text {
  font-size: 16px;
  padding: 0 15px;
}

.voucher-btn {
  background-color: #28a745;
  color: #fff;
  border: none;
}

.voucher-btn.disabled {
  background-color: #888;
  cursor: not-allowed;
}

.button-vchr {
  background-color: #6f42c1;
  color: #fff;
  border: none;
}

.button-vchr:hover {
  background-color: #5e37a6;
  color: #fff;
}

.review-border .modal-header {
  background-color: #28a745;
}

.inner-border {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  padding: 10px;
}

.popup-bg {
  background-color: rgba(255, 255, 255, 0.1);
}

.radio-size {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.modal{
  background-color: rgba(0,0,0,0.5);
  }
  .job-thumb {
    display: table-cell;
    vertical-align: top;
    width: 107px;
}
.job-thumb img {
  float: left;
  width: 100%;
  border: 2px solid #e8ecec;
  border-radius: 8px;
}
@media (max-width: 767px) {
  .swiper-slide {
    width: 50%;
  }
  
  .viewjob-apply {
    margin-top: 20px;
  }
  
  .spe_icon {
    font-size: 20px;
    width: 30px;
  }
  
  .extra-job-info strong {
    min-width: auto;
    margin-bottom: 5px;
    display: block;
  }
}

@media (max-width: 575px) {
  .swiper-slide {
    width: 100%;
  }
  
  .course_spec {
    flex-direction: column;
  }
  
  .spe_icon {
    margin-bottom: 5px;
  }
  
  .job-overview ul li {
    flex-direction: column;
  }
  
  .job-overview ul li i {
    margin-bottom: 5px;
  }
}
  html body .content .content-wrapper {
    margin-top: 6rem;
    padding: 1.8rem 2.2rem 0;
}
    .cr_nw_in {
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
    transition: all .3sease-in-out;
    margin: 15px 0px;
    position: relative;
}
.right_obj {
    color: #FC2B5A;
    background: #fff;
    width: fit-content;
    padding: 2px 10px;
    position: absolute;
    top: 30px;
    right: 17px;
    box-shadow: 0.5px 0px 2px rgba(0, 0, 0, 0.30);
    font-weight: 700;
    font-family: inter;
    border-bottom-left-radius: 15px;
    border: 1px dashed #FFD542;
    outline: 3px solid #FFF;
    border-right: 0px;
    z-index: 1;
}
.cr_nw_in img.video_thum {
    border-radius: 8px 8px 0px 0px;
    width: 100%;
}
.video-bttn:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    margin-left: -20px;
    margin-top: -20px;
    /* background-image: url(../images/icon-play.png); */
    background-size: contain;
    display: block;
    width: 44px;
    height: 44px;
    box-shadow: 0 .5rem 1rem rgb(252 43 90 / 39%) !important;
    border-radius: 50px;
}
.course_inf {
    padding: 15px;
}
.course_inf h5 {
    font-size: 17px;
    text-transform: capitalize;
    font-weight: 600;
    line-height: 24px;
    color: #000;
}
.course_inf span.job_cate {
    background: #1b95391a;
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 4px;
    color: #1b9539;
    border: solid 1px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.2px;
    display: inline-table;
    width: fit-content;
    overflow: auto;
    word-wrap: break-word;
}
.course_spec {
    display: flex
;
    margin-top: 20px;
    color: #000;
}
.course_spec .spe_icon {
    margin-right: 10px;
}
.width {
    width: 30px;
}
.apply-thisjob {
    background-color: #FC2B5A;
    float: left;
    width: calc(100% - 30px);
    border: 2px solid #FC2B5A;
    text-align: center;
    color: #fff;
    -webkit-border-radius: 8px;
    -moz-border-radius: 8px;
    -ms-border-radius: 8px;
    -o-border-radius: 8px;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 12px;
    font-family: Open Sans;
    font-weight: bold;
}
.apply-thisjob:hover {
    border: 2px solid #FC2B5A;
    background: #fff;
    color: #FC2B5A!important;
    text-decoration: none;
}
.ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  
  .para_ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .course_spec .spe_icon {
    margin-right: 10px;
}
.video-fluid{
    width: 100%;
}

@media screen and (max-width: 1261px) {
    .apply-thisjob {
        width: 100% !important;
    }
}
@media screen and (max-width: 992px) {
    .apply-thisjob {
        width: 100% !important;
    }
}
          `
        }
      </style>

      <style>
        {

          `
          .card .card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  border-bottom: none;
  padding: 1.5rem 1.5rem 0;
  background-color: transparent;
}

.card-header {
  padding: 1.5rem 1.5rem;
  margin-bottom: 0;
  background-color: rgba(34, 41, 47, 0.03);
  border-bottom: 1px solid rgba(34, 41, 47, 0.125);
}

.card-header:first-child {
  border-radius: calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0;
}

.fliter-block {
  display: block !important;
}

form #debt-amount-slider {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  position: relative;
  width: 100%;
  height: 50px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form #debt-amount-slider::before {
  content: " ";
  position: absolute;
  height: 2px;
  width: 100%;
  width: calc(100%*(4 / 5));
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #a39a9a;
}

form #debt-amount-slider input {
  display: none;
}

form #debt-amount-slider input,
form #debt-amount-slider label {
  box-sizing: border-box;
  flex: 1;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: pointer;
}

form #debt-amount-slider label {
  display: inline-block;
  position: relative;
  width: 20%;
  height: 100%;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form:valid #debt-amount-slider input+label::before {
  transform: translate(-50%, 40px) scale(0.8);
  transition: all 0.15s linear;
}

form #debt-amount-slider label::before {
  content: attr(data-debt-amount);
  position: absolute;
  left: 50%;
  padding-top: 10px;
  transform: translate(-50%, 40px);
  font-size: 14px;
  letter-spacing: 0.4px;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0.85;
  transition: all 0.15s ease-in-out;
}

form #debt-amount-slider label::after {
  content: " ";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #625c5c;
  background: #fff;
  border-radius: 50%;
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: 1;
  cursor: pointer;
  transition: all 0.15sease-in-out;
}
form #debt-amount-slider input:checked:nth-child(3) ~ #debt-amount-pos {
  left: 30%;
}
form #debt-amount-slider input:checked:nth-child(5) ~ #debt-amount-pos {
  left: 50%;
}
form #debt-amount-slider input:checked:nth-child(7) ~ #debt-amount-pos {
  left: 70%;
}

form #debt-amount-slider input:checked:nth-child(9)~#debt-amount-pos {
  left: 90%;
}

form #debt-amount-slider input:checked~#debt-amount-pos {
  opacity: 1;
}

form #debt-amount-slider #debt-amount-pos {
  display: block;
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #FC2B5A;
  border-radius: 50%;
  transition: all 0.15sease-in-out;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  opacity: 0;
  z-index: 2;
}

/* .card-body {
    flex: 1 1 auto;
    padding: 1.5rem;
} */
form:valid #debt-amount-slider input:checked+label::before {
  color: #FC2B5A;
  transform: translate(-50%, 40px) scale(1.1);
  transition: all 0.15slinear;
}

form #debt-amount-slider input:checked+label::before {
  font-weight: 800;
  opacity: 1;
}

form #debt-amount-slider input:checked:nth-child(1)~#debt-amount-pos {
  left: 10%;
}

.searchjobspage .card {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1rem;
}

.fliter-block {
  background-color: #fff;
  border-bottom: 1px solid #dfe3e7;
}

.filterSearchJob {
  margin-bottom: 1rem;
}

.filterSearchJob label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Course/Job Card Styles */
.course_nw {
  margin-top: 1rem;
}

.cr_nw_in {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cr_nw_in:hover {
  transform: translateY(-5px);
}

.video_thum {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.course_inf {
  padding: 1rem;
}

.course_inf h5 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.job_cate {
  color: #6e6b7b;
  display: block;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.curs_description span.job_cate {
  background: #1b95391a;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: #1b9539;
  border: solid 1px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: inline;
}
.course_spec {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.spe_icon {
  background-color: rgba(115, 103, 240, 0.1);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.spe_icon i {
  color: #7367f0;
  font-size: 1.5rem;
}

.spe_detail h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.spe_detail span {
  color: #6e6b7b;
  font-size: 0.8rem;
}

.jobDetails-wrap {
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* Job action buttons */
.act_btn {
  margin-top: 1rem;
}

.apply-thisjob {
  background-color: #FC2B5A;
  float: left;
  width: calc(100% - 30px);
  border: 2px solid #FC2B5A;
  text-align: center;
  color: #fff;
  -webkit-border-radius: 8px;
  -moz-border-radius: 8px;
  -ms-border-radius: 8px;
  -o-border-radius: 8px;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 12px;
  font-family: Open Sans;
  font-weight: bold;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 0.5rem;
}

.call-btn {
  background-color: #1b9539 !important;
  border:
    2px solid #1b9539 !important;
}

.call-btn:hover {
  color: #1b9539 !important;
  border: 2px solid #1b9539 !important;
  background-color: #fff !important;
}

.act_btn .apply-thisjob {
  width: 100% !important;
  margin-bottom: 0px;
  text-align: center !important;
}

@media only screen and (max-width: 1400px) {
  .act_btn .apply-thisjob {
    padding:
      7px !important;
    font-size: 11px;
  }

  .act_btn .apply-thisjob i {
    font-size: 18px;
    top: 2px;
    margin-right: 3px;
  }
}

.call-btn:hover {
  background-color: #24b263;
}

.same-plane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.plane-font {
  font-size: 1.2rem;
}

/* Map section styles */
.map {
  margin-top: 1rem;
}

#map {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
}

/* Distance slider styles */
#debt-amount-slider {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  margin-top: 1rem;
}

#debt-amount-slider input[type="radio"] {
  position: absolute;
  opacity: 0;
}

#debt-amount-slider label {
  cursor: pointer;
  position: relative;
  display: block;
  width: 20%;
  height: 100%;
  text-align: center;
}

#debt-amount-slider label:after {
  content: attr(data-debt-amount);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #6e6b7b;
}

#debt-amount-slider label:before {
  content: '';
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  /* background-color: #ddd; */
  transition: background-color 0.3s ease;
}

/* #debt-amount-slider input[type="radio"]:checked+label:before {
  background-color: #7367f0;
} */

#debt-amount-pos {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background-color: #7367f0;
  pointer-events: none;
  transition: width 0.2s ease, left 0.2s ease;
}

/* Pagination styles */
.pagination {
  margin-top: 1rem;
}

.page-link {
  color: #7367f0;
  border-radius: 4px;
  margin: 0 2px;
}

.page-item.active .page-link {
  background-color: #7367f0;
  border-color: #7367f0;
}

.pagi_custom {
  background-color: #7367f0;
  color: #fff;
}

.pagi_customtwo:hover {
  background-color: rgba(115, 103, 240, 0.1);
}

/* Responsive styles */
@media (max-width: 768px) {
  .content-header {
    display: none;
  }

  .searchjobspage .card-body {
    padding: 0.75rem;
  }

  .forsmallscrn {
    display: block !important;
  }

  .forlrgscreen {
    display: none;
  }

  .cr_nw_in {
    margin-bottom: 1rem;
  }

  .act_btn .col-xl-6 {
    margin-bottom: 0.5rem;
  }

  /* Row width auto for mobile devices only on this page */
  .row {
    width: auto;
  }
}

/* Modal styles */
.modal-content {
  border-radius: 8px;
  /* overflow: hidden; */
}

.modal-header {
  background-color: #7367f0;
  color: #fff;
}

.modal-title {
  font-weight: 600;
}

.close {
  color: #fff;
}

.btn-primary {
  background-color: #7367f0;
  border-color: #7367f0;
}

.btn-primary:hover {
  background-color: #5e50ee;
  border-color: #5e50ee;
}

/* Job Details Styles */

/* Rating Star Styles */
label.review {
  display: block;
}

input.star {
  display: none;
}

label.star {
  float: right;
  padding: 10px;
  font-size: 30px !important;
  color: #444;
  transition: all .2s;
}

input.star:hover ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star:checked ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star-5:hover ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

input.star-5:checked ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

label.star:hover {
  transform: rotate(-15deg) scale(1.3);
}

label.star:before {
  content: '\f006';
  font-family: FontAwesome;
}

input.star:checked ~ .rev-box {
  height: 125px;
  overflow: visible;
}

/* Job Details Specific Styles */
.course_dtl {
  margin-bottom: 20px;
}

.curs_description h4 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
}

.job_cate {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
  display: block;
}

.course_spec {
  display: flex;
  margin-top: 25px;
}

.spe_icon {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.spe_detail h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 0;
}

.jobDetails-wrap {
  margin-bottom: 5px;
}

.job-single-sec {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px 0;
}

.job-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 15px;
}
.v_pal img {
  border-radius: 8px;
}
.course_dtl h6 {
  font-size: 17px;
  font-weight: 600;
  margin-top: 35px;
}
.apply-thisjob {
  background-color: #FC2B5A;
  color: #fff;
  border-radius: 5px;
  padding: 12px 20px;
  font-weight: 500;
  display: inline-block;
  text-decoration: none !important;
  transition: background-color 0.3s;
  margin-bottom: 10px;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 8px;
}

.disabled-button {
  background-color: #888;
  cursor: not-allowed;
}

.disabled-button:hover {
  background-color: #888;
  border: 2px solid#888;
  color: #fff!important;
}

.call-btn {
  background-color: #28a745;
}

.call-btn:hover {
  background-color: #218838;
}

.rebase-job {
  background-color: #17a2b8;
}

.rebase-job:hover {
  background-color: #138496;
  border: 2px solid #138496;
  color: #fff!important;
}
.btn{
  border: 1px solid #FC2B5A!important;
}

.rebase-job.disabled {
  background-color: #888;
  cursor: not-allowed;
  border: 1px solid #888;
}

.extra-job-info {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.extra-job-info span {
  display: block;
  margin-bottom: 10px;
  color: #666;
}

.extra-job-info strong {
  display: inline-block;
  margin-right: 5px;
  color: #333;
  min-width: 150px;
}

.extra-job-info i {
  margin-right: 8px;
  color: #FC2B5A;
}

/* Course Card Styles */
.pointer {
  cursor: pointer;
}

.job-overview {
  margin-bottom: 20px;
}

.job-overview h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.job-overview ul li {
  display: flex;
  margin-bottom: 15px;
}

.job-overview ul li i {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.custom_sty {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

/* Media Gallery Styles */
.carousel-gallery {
  position: relative;
  margin-bottom: 30px;
}

.swiper-wrapper {
  display: flex;
}

.swiper-slide {
  width: 33.333%;
  transition: 0.3s;
}

.swiper-slide .image {
  width: 100%;
  height: 200px;
  border-radius: 5px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.swiper-slide .image .overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
}

.swiper-slide .image .overlay em {
  color: #fff;
  font-size: 24px;
}

.swiper-slide:hover .image .overlay {
  opacity: 1;
}

.swiper-pagination {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.swiper-pagination-bullet {
  width: 10px;
  height: 10px;
  background: #ccc;
  margin: 0 5px;
  border-radius: 50%;
  cursor: pointer;
}

.swiper-pagination-bullet-active {
  background: #FC2B5A;
}

/* Video Gallery Styles */
.position-relative {
  position: relative;
}

.play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.pluscenter .pulse {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: pulse 1.5s infinite;
}

.uplay {
  width: 30px;
  height: 30px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal Styles */
.modal-content {
  border-radius: 5px;
  overflow: hidden;
}

.modal-header {
  background-color: #FC2B5A;
  color: #fff;
  border-bottom: none;
}

.modal-title {
  font-weight: 600;
}

.modal-header .close {
  color: #fff;
  opacity: 0.8;
}

.modal-header .close:hover {
  opacity: 1;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  border-top: none;
  padding: 15px 20px;
}

.vchr_header {
  background-color: #6f42c1;
}

.mode-dice {
  background-color: #532e92;
  color: #fff;
}

.coupon-text {
  font-size: 16px;
  padding: 0 15px;
}

.voucher-btn {
  background-color: #28a745;
  color: #fff;
  border: none;
}

.voucher-btn.disabled {
  background-color: #888;
  cursor: not-allowed;
}

.button-vchr {
  background-color: #6f42c1;
  color: #fff;
  border: none;
}

.button-vchr:hover {
  background-color: #5e37a6;
  color: #fff;
}

.review-border .modal-header {
  background-color: #28a745;
}

.inner-border {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  padding: 10px;
}

.popup-bg {
  background-color: rgba(255, 255, 255, 0.1);
}

.radio-size {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.modal{
  background-color: rgba(0,0,0,0.5);
  }
  .job-thumb {
    display: table-cell;
    vertical-align: top;
    width: 107px;
}
.job-thumb img {
  float: left;
  width: 100%;
  border: 2px solid #e8ecec;
  border-radius: 8px;
}
@media (max-width: 767px) {
  .swiper-slide {
    width: 50%;
  }
  
  .viewjob-apply {
    margin-top: 20px;
  }
  
  .spe_icon {
    font-size: 20px;
    width: 30px;
  }
  
  .extra-job-info strong {
    min-width: auto;
    margin-bottom: 5px;
    display: block;
  }
}

@media (max-width: 575px) {
  .swiper-slide {
    width: 100%;
  }
  
  .course_spec {
    flex-direction: column;
  }
  
  .spe_icon {
    margin-bottom: 5px;
  }
  
  .job-overview ul li {
    flex-direction: column;
  }
  
  .job-overview ul li i {
    margin-bottom: 5px;
  }
}
          `
        }
      </style>
<style>
  {
    `
    /* Rating Star Styles */
label.review {
  display: block;
}

input.star {
  display: none;
}

label.star {
  float: right;
  padding: 10px;
  font-size: 30px !important;
  color: #444;
  transition: all .2s;
}

label.star:before {
    content: '\f006';
    font-family: FontAwesome;
}

input.star:hover ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star:checked ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star-5:hover ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

input.star-5:checked ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

label.star:hover {
  transform: rotate(-15deg) scale(1.3);
}

label.star:before {
  content: '\f006';
  font-family: FontAwesome;
}

input.star:checked ~ .rev-box {
  height: 125px;
  overflow: visible;
}

.breadcrumb-item a {
    color: #FC2B5A;
        }   
    `
  }
</style>
    </>
  );
};

export default CandidatesJobs;