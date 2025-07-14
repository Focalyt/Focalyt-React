import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
// Import Bootstrap if needed (if you're not importing it elsewhere)
// import 'bootstrap/dist/css/bootstrap.min.css';

// Add this CSS for smooth transitions
const styles = {
  filterContainer: {
    maxHeight: '0',
    overflow: 'hidden',
    transition: 'max-height 0.5s ease-in-out',
  },
  filterContainerOpen: {
    maxHeight: '1000px', // Set to a value larger than your content height
  }
};

const NearByJobs = () => {
  const [filters, setFilters] = useState({
    qualification: "",
    experience: "",
    industry: "",
    jobType: "",
    minSalary: "",
    techSkills: "",
    state: "",
  });

  const [jobs, setJobs] = useState([]);
  const [mapError, setMapError] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [allQualifications, setAllQualifications] = useState([]);
  const [allIndustry, setAllIndustry] = useState([]);
  const [techSkills, setTechSkills] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Fetch all filter options when component mounts
    fetchFilterOptions();
    
    // Check if user location is set
    if (latitude && longitude) {
      fetchJobs();
    } else {
      getUserLocation();
    }
  }, []);
  
  // Toggle filters with animation effect
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Initialize arrays to prevent map errors
  useEffect(() => {
    // Ensure these are always arrays even before data is loaded
    if (!Array.isArray(allQualifications)) setAllQualifications([]);
    if (!Array.isArray(allIndustry)) setAllIndustry([]);
    if (!Array.isArray(techSkills)) setTechSkills([]);
    if (!Array.isArray(allStates)) setAllStates([]);
  }, [allQualifications, allIndustry, techSkills, allStates]);

  // Re-fetch jobs when filters or location changes
  useEffect(() => {
    if (latitude && longitude) {
      fetchJobs();
    }
  }, [filters, latitude, longitude]);

  const fetchFilterOptions = async () => {
    try {
      // Initialize with empty arrays first to prevent map errors
      setAllQualifications([]);
      setAllIndustry([]);
      setTechSkills([]);
      setAllStates([]);
      
      // Fetch qualifications, industries, skills, and states
      const [qualResponse, indResponse, skillsResponse, statesResponse] = await Promise.all([
        axios.get(`${backendUrl}/getQualifications`),
        axios.get(`${backendUrl}/getIndustries`),
        axios.get(`${backendUrl}/getTechSkills`),
        axios.get(`${backendUrl}/getStates`)
      ]);

      // Ensure we're setting arrays
      setAllQualifications(Array.isArray(qualResponse.data) ? qualResponse.data : []);
      setAllIndustry(Array.isArray(indResponse.data) ? indResponse.data : []);
      setTechSkills(Array.isArray(skillsResponse.data) ? skillsResponse.data : []);
      setAllStates(Array.isArray(statesResponse.data) ? statesResponse.data : []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // Set empty arrays on error
      setAllQualifications([]);
      setAllIndustry([]);
      setTechSkills([]);
      setAllStates([]);
    }
  };

  const getUserLocation = () => {
    // First check if user has set a location in their profile
    const checkUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${backendUrl}/getUserLocation`, {
          headers: {
            "x-auth": token
          }
        });
        
        if (response.data && response.data.latitude && response.data.longitude) {
          setLatitude(response.data.latitude);
          setLongitude(response.data.longitude);
        } else {
          // If no location in profile, try to get current location
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
            },
            (error) => {
              console.error("Error getting location:", error);
              setMapError("Please set your location in your profile to see nearby jobs.");
              setShowProfileModal(true);
            }
          );
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        setShowProfileModal(true);
      }
    };
    
    checkUserProfile();
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${backendUrl}/getNearbyJobsForMap`, {
        headers: {
          "x-auth": token
        },
        params: { ...filters, lat: latitude, long: longitude },
      });
      
      if (response.data.status === false) {
        setMapError("No jobs found near your location.");
        setJobs([]);
      } else {
        setJobs(response.data.jobs);
        initMap(response.data.jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setMapError("Failed to fetch jobs.");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      qualification: "",
      experience: "",
      industry: "",
      jobType: "",
      minSalary: "",
      techSkills: "",
      state: "",
    });
  };

  const initMap = (jobsData) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded.");
      return;
    }

    const map = new window.google.maps.Map(document.getElementById("map"), {
      zoom: 9,
      center: { lat: latitude, lng: longitude },
    });

    jobsData.forEach((job) => {
      const marker = new window.google.maps.Marker({
        position: { lat: job.location.coordinates[1], lng: job.location.coordinates[0] },
        map: map,
        icon: {
          url: "/images/marker.png",
          scaledSize: new window.google.maps.Size(35, 35),
        },
        title: job.displayCompanyName || job._company[0]?.name || "N/A",
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <p><strong>${job.displayCompanyName || job._company[0]?.name || "N/A"}</strong></p>
            <p>${job.city && job.city[0]?.name || ""}, ${job.state && job.state[0]?.name || ""}</p>
            <p>Industry: ${job._industry && job._industry[0]?.name || "N/A"}</p>
            <p>Qualification: ${job._qualification && job._qualification[0]?.name || "N/A"}</p>
            <p>Salary: ${job.isFixed ? job.amount : (job.min && job.max ? `${job.min} - ${job.max}` : (job.min || "N/A"))}</p>
            <p>Location: ${Math.round(job.distance / 1000)} km</p>
            <a href="/candidate/job/${job._id}">View Details</a>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  };

  // UseEffect to load Google Maps API only once
  useEffect(() => {
    const existingScript = document.getElementById('googleMaps');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`;
      script.id = 'googleMaps';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // After script is loaded and if coordinates are already available, fetch jobs
        if (latitude && longitude) {
          fetchJobs();
        }
      };
      document.body.appendChild(script);
    }
  }, [googleMapsApiKey]);

  return (
    <div className="container mt-3">
      {/* Header with breadcrumbs */}
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12 my-auto">
              <h3 className="content-header-title float-left mb-0">Jobs Near Me</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Jobs Near Me</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter section */}
      <section className="mt-3">
        <div className="card">
          <div className="card-header fliter-block pt-1">
            <div className="row">
              <div className="col-6 my-auto">
                <h5>Filter Data / डेटा फ़िल्टर करें</h5>
              </div>
              <div className="col-6 text-right d-flex justify-content-end">
                <button 
                  className="btn btn-outline-secondary py-0 mx-0"
                  onClick={toggleFilters}
                >
                  <img src="/Assets/images/filtern.png" id="filter-img" alt="Filter" />
                </button>
              </div>
            </div>
          </div>

          <div 
            style={{
              ...styles.filterContainer,
              ...(showFilters ? styles.filterContainerOpen : {})
            }}
          >
            <div className="card-body px-1 py-0">
              <div className="card border border-top-1">
                <div className="card-content">
                  <div className="card-body p-0">
                    <div className="row my-0 mx-0 py-2">
                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>Minimum Qualification</label>
                        <select
                          className="form-control"
                          name="qualification"
                          value={filters.qualification}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select Option</option>
                          {allQualifications.map((qual) => (
                            <option
                              key={qual._id}
                              value={qual._id}
                              className="text-capitalize"
                            >
                              {qual.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>Experience(Yrs)</label>
                        <select
                          className="form-control"
                          name="experience"
                          value={filters.experience}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select</option>
                          {[...Array(16).keys()].map(i => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>Industry</label>
                        <select
                          className="form-control"
                          name="industry"
                          value={filters.industry}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select Option</option>
                          {allIndustry.map((industry) => (
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

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>Job Type</label>
                        <select
                          className="form-control"
                          name="jobType"
                          value={filters.jobType}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select Option</option>
                          <option value="Part Time">Part Time</option>
                          <option value="Full Time">Full Time</option>
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>Minimum Offered Salary</label>
                        <select
                          className="form-control"
                          name="minSalary"
                          value={filters.minSalary}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select Option</option>
                          {[5000, 10000, 15000, 20000, 30000, 40000, 50000, 70000, 80000].map(salary => (
                            <option key={salary} value={salary}>{salary}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>Technical Skills</label>
                        <select
                          className="form-control text-capitalize"
                          name="techSkills"
                          value={filters.techSkills}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select</option>
                          {techSkills.map((skill) => (
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

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                        <label>State</label>
                        <select
                          className="form-control"
                          name="state"
                          value={filters.state}
                          onChange={handleFilterChange}
                        >
                          <option value="">Select Option</option>
                          {allStates.map((state) => (
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

                      <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12 mt-2">
                        <button
                          className="btn btn-success waves-effect waves-light text-white d-inline me-3"
                          onClick={fetchJobs}
                        >
                          Go
                        </button>
                        <button
                          className="btn btn-danger d-inline waves-effect waves-light mb-md-0 mb-2 text-white mx-md-0 mx-0 ml-2"
                          onClick={resetFilters}
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
      </section>

      {/* Google Map */}
      <div className="mt-3">
        <div id="error" className="text-danger">{mapError}</div>
        <div id="map" className="rounded" style={{ width: "100%", height: "400px" }}></div>
      </div>

      {/* Profile completion modal */}
      {showProfileModal && (
        <div className="modal fade show" id="popup" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-0">
              <div className="modal-header bg-primary">
                <h5 className="modal-title text-white text-uppercase">Complete Profile</h5>
                <button type="button" className="close" onClick={() => setShowProfileModal(false)}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body">
                <h5 className="pb-1 mb-0">
                  Please set your location before looking for jobs nearby<br />
                  आस-पास की नौकरियों की तलाश करने से पहले कृपया मेरी प्रोफ़ाइल पर अपना स्थान निर्धारित करें।
                </h5>
              </div>
              <div className="modal-footer">
                <a href="/candidate/myProfile">
                  <button type="submit" className="btn btn-primary text-black">Complete Profile</button>
                </a>
                <button type="button" className="btn btn-outline-light" onClick={() => setShowProfileModal(false)}>
                <i class="fas fa-times d-block d-lg-none"></i>
                  <span className="d-none d-lg-block">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden div for marker info window content */}
      <div className="d-none">
        <div id="markerContent">
          <p id="companyNameMarker"></p>
          <p id="stateCityMarker"></p>
          <p id="industryMarker"></p>
          <p id="qualificationMarker"></p>
          <p id="salaryMarker"></p>
          <p id="locationMarker"></p>
          <a id="jobDetailsMarker"></a>
        </div>
      </div>
      <style>
        {`
        .btn {
    display: inline-block;
    font-weight: 400;
    color: #626262;
    text-align: center;
    vertical-align: middle;
    user-select: none;
    background-color: transparent;
    border: 0 solid transparent;
    padding: 0.9rem 2rem;
    font-size: 1rem;
    line-height: 1;
    border-radius: 0.4285rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
    .btn-danger {
    border-color: #e42728 !important;
    background-color: #ea5455 !important;
    color: #fff !important;
}
    .extra-ss {
    padding-top: 11px;
    padding-bottom: 11px;
}
       @media(max-width:768px){
       .job-single-sec a{
          width:100%
          }
       
       } 
          .extra-ss {
    padding-top: 11px;
    padding-bottom: 11px;
}
        `}
      </style>


      <style>
        {

          `
          .btn {
    border: 1px solid #FC2B5A !important;
}
    .btn-primary {
    color: #fff!important;
    background-color: #FC2B5A !important;
    border-color: #FC2B5A;
}
.breadcrumb-item a {
    color: #FC2B5A;
        }   
`
        }
      </style>
    </div>
  );
};

export default NearByJobs;

