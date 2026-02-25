import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [allQualifications, setAllQualifications] = useState([]);
  const [allIndustry, setAllIndustry] = useState([]);
  const [techSkills, setTechSkills] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const mapContainerRef = useRef(null);
  const isMountedRef = useRef(true);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    isMountedRef.current = true;
    fetchFilterOptions();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Toggle filters with animation effect
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Ensure arrays for dropdowns to prevent map errors
  useEffect(() => {
    if (!Array.isArray(allQualifications)) setAllQualifications([]);
    if (!Array.isArray(allIndustry)) setAllIndustry([]);
    if (!Array.isArray(techSkills)) setTechSkills([]);
    if (!Array.isArray(allStates)) setAllStates([]);
  }, [allQualifications, allIndustry, techSkills, allStates]);

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${backendUrl}/candidate/nearby-jobs-form-options`, {
        headers: { "x-auth": token },
      });
      if (response.data && response.data.status) {
        setAllQualifications(Array.isArray(response.data.allQualification) ? response.data.allQualification : []);
        setAllIndustry(Array.isArray(response.data.allIndustry) ? response.data.allIndustry : []);
        setAllStates(Array.isArray(response.data.allStates) ? response.data.allStates : []);
        setTechSkills(Array.isArray(response.data.skills) ? response.data.skills : []);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setAllQualifications([]);
      setAllIndustry([]);
      setTechSkills([]);
      setAllStates([]);
    }
  };

  const fetchJobs = async () => {
    try {
      setMapError("");
      const token = localStorage.getItem("token");
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "" && filters[key] != null) params[key] = filters[key];
      });
      // console.log("📞 Calling getNearbyJobsForMap API with params:", params);
      const response = await axios.get(`${backendUrl}/candidate/getNearbyJobsForMap`, {
        headers: { "x-auth": token },
        params,
      });

      // console.log("📊 API Response:", response.data);
      if (!isMountedRef.current) return;

      if (response.data.status === false) {
        console.error("❌ API Error:", response.data.message);
        setMapError(response.data.message || "Add your Current Location");
        setShowProfileModal(true);
        setJobs([]);
        initMap([], null);
      } else {
        const jobsData = response.data.jobs || response.data.data || [];
        // console.log("✅ Jobs received:", jobsData.length, "jobs");
        // jobsData.forEach((job, idx) => {
        //   console.log(`Job ${idx}:`, {
        //     name: job.displayCompanyName,
        //     location: job.location,
        //     coordinates: job.location?.coordinates
        //   });
        // });
        setJobs(jobsData);
        setShowProfileModal(false);
        const nearest = response.data.nearest;
        const center =
          nearest?.location?.coordinates
            ? { lat: nearest.location.coordinates[1], lng: nearest.location.coordinates[0] }
            : null;
        initMap(jobsData, center);
      }
    } catch (error) {
      console.error("❌ Error fetching jobs:", error);
      if (isMountedRef.current) {
        setMapError("Failed to fetch jobs.");
        setJobs([]);
        initMap([], null);
      }
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
    fetchJobsWithParams({});
  };

  const fetchJobsWithParams = (params) => {
    const token = localStorage.getItem("token");
    setMapError("");
    axios
      .get(`${backendUrl}/candidate/getNearbyJobsForMap`, {
        headers: { "x-auth": token },
        params: params || {},
      })
      .then((response) => {
        if (!isMountedRef.current) return;
        if (response.data.status === false) {
          setMapError("Add your Current Location");
          setShowProfileModal(true);
          setJobs([]);
          initMap([], null);
        } else {
          setJobs(response.data.jobs || []);
          setShowProfileModal(false);
          const nearest = response.data.nearest;
          const center =
            nearest?.location?.coordinates
              ? { lat: nearest.location.coordinates[1], lng: nearest.location.coordinates[0] }
              : null;
          initMap(response.data.jobs || [], center);
        }
      })
      .catch((error) => {
        console.error("Error fetching jobs:", error);
        if (isMountedRef.current) {
          setMapError("Failed to fetch jobs.");
          setJobs([]);
          initMap([], null);
        }
      });
  };

  const initMap = (jobsData, center) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded.");
      return;
    }
    const mapEl = mapContainerRef.current;
    if (!mapEl) return;

    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    const mapCenter = center && center.lat && center.lng ? center : defaultCenter;

    // console.log("🗺️  Initializing map with center:", mapCenter);
    // console.log("📍 Jobs to plot:", jobsData.length);

    const runMapInit = () => {
      if (!isMountedRef.current || !mapContainerRef.current) return;
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          zoom: 12,
          center: mapCenter,
        });

        let markersPlotted = 0;
        const bounds = new window.google.maps.LatLngBounds();
        
        (jobsData || []).forEach((job, idx) => {
          if (!job.location?.coordinates || job.location.coordinates.length < 2) {
            // console.warn(`Job ${idx} has no valid coordinates:`, job.location);
            return;
          }
          
          const lat = job.location.coordinates[1];
          const lng = job.location.coordinates[0];
          
          // Log full location object for debugging
          // console.log(`Job ${idx} Full Location Object:`, JSON.stringify(job.location, null, 2));
          
          markersPlotted++;
          const companyName = job.displayCompanyName || (job._company && job._company[0]?.name) || "N/A";
          const cityState = `${(job.city && job.city[0]?.name) || ""}, ${(job.state && job.state[0]?.name) || ""}`.trim();
          const industryName = (job._industry && job._industry[0]?.name) || "N/A";
          const qualName = (job._qualification && job._qualification[0]?.name) || "N/A";
          const salaryStr =
            job.isFixed === true && job.amount != null
              ? `₹ ${job.amount}`
              : job.isFixed === false && job.min != null
              ? `₹ ${job.min}+`
              : "NA";
          const distanceKm = job.distance != null ? Math.round(job.distance / 1000) : "—";

          const markerPosition = { lat: lat, lng: lng };
          // console.log(`📌 Plotting marker ${markersPlotted} [${idx}] for ${companyName} at:`, markerPosition);

          const marker = new window.google.maps.Marker({
            position: markerPosition,
            map,
            title: companyName,
          });

          bounds.extend(markerPosition);

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-size: 12px;">
                <p style="margin: 5px 0;"><strong>${companyName}</strong></p>
                <p style="margin: 5px 0;">${cityState}</p>
                <p style="margin: 5px 0;">Industry: ${industryName}</p>
                <p style="margin: 5px 0;">Qualification: ${qualName}</p>
                <p style="margin: 5px 0;">Salary: ${salaryStr}</p>
                <p style="margin: 5px 0;">Distance: ${distanceKm} km</p>
                <a href="/candidate/job/${job._id}" style="color: #FF1744; text-decoration: none;">View Details</a>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
        });
        
        // Fit bounds if we have markers
        if (markersPlotted > 0) {
          map.fitBounds(bounds);
          // console.log(`🎯 Map bounds adjusted for ${markersPlotted} markers`);
        }
        
        // console.log(`✅ Map initialized with ${markersPlotted} markers`);
      } catch (err) {
        console.error("Google Maps init error:", err);
      }
    };

    setTimeout(runMapInit, 0);
  };

  useEffect(() => {
    const tryFetchJobs = () => {
      if (window.google?.maps && isMountedRef.current) {
        setTimeout(() => fetchJobs(), 50);
        return true;
      }
      return false;
    };

    const anyMapsScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
    if (anyMapsScript) {
      if (tryFetchJobs()) return;
      let attempts = 0;
      const maxAttempts = 40;
      const t = setInterval(() => {
        attempts++;
        if (tryFetchJobs() || attempts >= maxAttempts) clearInterval(t);
      }, 150);
      return () => clearInterval(t);
    }

    if (googleMapsApiKey) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.id = "googleMapsNearbyJobs";
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(() => fetchJobs(), 50);
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
                          {[5000, 10000, 15000, 20000, 30000, 40000, 50000, 70000].map((salary) => (
                            <option key={salary} value={salary}>{salary}</option>
                          ))}
                          <option value="80000">80000+</option>
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
                          className="btn btn-success waves-effect waves-light text-black d-inline me-3"
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
        {mapError === "Add your Current Location" ? (
          <div className="alert alert-warning d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2" role="alert">
            <span>
              <strong>Location required.</strong> Set your current location in your profile to see jobs near you.
              <br className="d-none d-md-block" />
              <span className="text-muted small">आस-पास की नौकरियाँ देखने के लिए प्रोफ़ाइल में अपना स्थान जोड़ें।</span>
            </span>
            <Link to="/candidate/myProfile" className="btn btn-primary btn-sm text-white text-nowrap">
              Go to My Profile
            </Link>
          </div>
        ) : mapError ? (
          <div id="error" className="text-danger">{mapError}</div>
        ) : null}
        <div ref={mapContainerRef} id="map" className="rounded" style={{ width: "100%", height: "400px" }}></div>
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
                <Link to="/candidate/myProfile">
                  <button type="button" className="btn btn-primary text-white">Complete Profile / Set Location</button>
                </Link>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowProfileModal(false)}>
                  <i className="fas fa-times d-block d-lg-none"></i>
                  <span className="d-none d-lg-block">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden div for marker info window content */}
      <div className="none">
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

