import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NearByJobs.css";

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

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (latitude && longitude) {
      fetchJobs();
    } else {
      getUserLocation();
    }
  }, [filters, latitude, longitude]);

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        setMapError("Please allow location access to see nearby jobs.");
      }
    );
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${backendUrl}/getNearbyJobsForMap`, {
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
        title: job.displayCompanyName || job._company[0]?.name || "N/A",
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <p><strong>${job.displayCompanyName || job._company[0]?.name}</strong></p>
          <p>Industry: ${job._industry[0]?.name || "N/A"}</p>
          <p>Minimum Qualification: ${job._qualification[0]?.name || "N/A"}</p>
          <p>Salary: ${job.isFixed ? job.amount : `${job.min} - ${job.max}`}</p>
          <p>Location: ${Math.round(job.distance / 1000)} km</p>
          <a href="/candidate/job/${job._id}">View Details</a>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  };

  return (
    <div className="container mt-3">
      <h3 className="text-center">Jobs Near Me</h3>

      <section className="job-filters mt-3">
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <h5>Filter Data / डेटा फ़िल्टर करें</h5>
            <button className="btn btn-outline-secondary" data-toggle="collapse" data-target="#filtersCollapse">
              Toggle Filters
            </button>
          </div>

          <div id="filtersCollapse" className="collapse show">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <label>Minimum Qualification</label>
                  <select className="form-control" name="qualification" value={filters.qualification} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    {/* Populate dynamically */}
                  </select>
                </div>

                <div className="col-md-3">
                  <label>Experience(Yrs)</label>
                  <select className="form-control" name="experience" value={filters.experience} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    {[...Array(16).keys()].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label>Industry</label>
                  <select className="form-control" name="industry" value={filters.industry} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    {/* Populate dynamically */}
                  </select>
                </div>

                <div className="col-md-3">
                  <label>Job Type</label>
                  <select className="form-control" name="jobType" value={filters.jobType} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Full Time">Full Time</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label>Minimum Offered Salary</label>
                  <select className="form-control" name="minSalary" value={filters.minSalary} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    {[5000, 10000, 15000, 20000, 30000, 40000, 50000, 70000, 80000].map(salary => (
                      <option key={salary} value={salary}>{salary}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label>Technical Skills</label>
                  <select className="form-control" name="minSalary" value={filters.minSalary} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    {["Plumber", "Carpanter"].map(salary => (
                      <option key={salary} value={salary}>{salary}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label>State</label>
                  <select className="form-control" name="state" value={filters.state} onChange={handleFilterChange}>
                    <option value="">Select</option>
                    {/* Populate dynamically */}
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                <button type="button" className="btn btn-success" onClick={fetchJobs}>Go</button>
                <button type="reset" className="btn btn-danger ml-2" onClick={() => setFilters({})}>Reset</button>
              </div>
              </div>

              
            </div>
          </div>
        </div>
      </section>

      {/* Google Map */}
      <div className="mt-3">
        {mapError ? <p className="text-danger">{mapError}</p> : <div id="map" style={{ width: "100%", height: "400px" }}></div>}
      </div>

      {/* Load Google Maps API */}
      <script async src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap`}></script>
    </div>
  );
};

export default NearByJobs;
