import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

const AvailableJobs = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [allQualification, setAllQualification] = useState([]);
  const [allIndustry, setAllIndustry] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    qualification: '',
    experience: '',
    industry: '',
    jobType: '',
    minSalary: '',
    techSkills: '',
    state: ''
  });

  useEffect(() => {
    fetchInitialData();
    fetchJobs();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth': token };
      
      const [qualificationRes, industryRes, statesRes, skillsRes] = await Promise.all([
        axios.get(`${backendUrl}/qualifications`, { headers }),
        axios.get(`${backendUrl}/industries`, { headers }),
        axios.get(`${backendUrl}/states`, { headers }),
        axios.get(`${backendUrl}/skills`, { headers })
      ]);

      // setAllQualification(qualificationRes.data || []);
      // setAllIndustry(industryRes.data || []);
      // setAllStates(statesRes.data || []);
      // setSkills(skillsRes.data || []);
      setAllQualification(Array.isArray(qualificationRes.data) ? qualificationRes.data : []);
    setAllIndustry(Array.isArray(industryRes.data) ? industryRes.data : []);
    setAllStates(Array.isArray(statesRes.data) ? statesRes.data : []);
    setSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);  
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchJobs = async (searchFilters = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backendUrl}/college/availablejobs`, {
        headers: { 'x-auth': token },
        params: searchFilters
      });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(filters);
  };

  const handleReset = () => {
    setFilters({
      qualification: '',
      experience: '',
      industry: '',
      jobType: '',
      minSalary: '',
      techSkills: '',
      state: ''
    });
    fetchJobs();
  };

  const salaryOptions = [
    { value: '5000', label: '5000' },
    { value: '10000', label: '10000' },
    { value: '15000', label: '15000' },
    { value: '20000', label: '20000' },
    { value: '30000', label: '30000' },
    { value: '40000', label: '40000' },
    { value: '50000', label: '50000' },
    { value: '70000', label: '70000' },
    { value: '80000', label: '80000+' }
  ];

  return (
    <>

        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Available Jobs</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="#">Available Jobs</a></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="personal-info">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Search Job</h4>
                </div>
                <form onSubmit={handleSearch}>
                  <div className="card-content">
                    <div className="card-body">
                      <div className="row mb-2 mx-0" id="allFields">
                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>Minimum Qualification</label>
                          <select 
                            className="form-control" 
                            id="qualification" 
                            name="qualification"
                            value={filters.qualification}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select Option</option>
                            {allQualification.map((item) => (
                              <option key={item._id} value={item._id} className="text-capitalize">
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>Minimum Experience(Yrs)</label>
                          <select 
                            className="form-control" 
                            name="experience" 
                            id="exp-field"
                            value={filters.experience}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select</option>
                            <option value="0">0</option>
                            {[...Array(15)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>Industry</label>
                          <select 
                            className="form-control" 
                            id="industry" 
                            name="industry"
                            value={filters.industry}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select Option</option>
                            {allIndustry.map((item) => (
                              <option key={item._id} value={item._id} className="text-capitalize">
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>Job Type</label>
                          <select 
                            className="form-control" 
                            id="jobType" 
                            name="jobType"
                            value={filters.jobType}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select Option</option>
                            <option value="Part Time">Part Time</option>
                            <option value="Full Time">Full Time</option>
                          </select>
                        </div>

                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>Minimum Offered Salary</label>
                          <select 
                            className="form-control" 
                            id="minSalary" 
                            name="minSalary"
                            value={filters.minSalary}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select Option</option>
                            {salaryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>Technical Skills</label>
                          <select 
                            className="form-control text-capitalize" 
                            name="techSkills" 
                            id="techSkills"
                            value={filters.techSkills}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select</option>
                            {skills
                              .filter(skill => skill.type === 'technical')
                              .map((skill) => (
                                <option key={skill._id} value={skill._id} className="text-capitalize">
                                  {skill.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="filterSearchJob col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12">
                          <label>State</label>
                          <select 
                            className="form-control" 
                            id="state" 
                            name="state"
                            value={filters.state}
                            onChange={handleFilterChange}
                          >
                            <option value="">Select Option</option>
                            {allStates.map((item) => (
                              <option key={item._id} value={item._id} className="text-capitalize">
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-12 mt-2 text-right">
                          <button
                            className="btn btn-success waves-effect waves-light text-white d-inline px-lg-2 px-md-1 px-sm-2"
                            id="search-button"
                            type="submit"
                          >
                            Go
                          </button>
                          <button
                            type="button"
                            className="extra-ss btn btn-danger d-inline waves-effect waves-light ms-2 mb-0 text-white ml-xl-1 ml-lg-1 ml-md-0 ml-sm-1 ml-1"
                            onClick={handleReset}
                          >
                            RESET
                          </button>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table id="tblexportData" className="table table-hover-animation mb-0 table-hover">
                          <thead>
                            <tr>
                              <th>Qualification</th>
                              <th>Company</th>
                              <th>Job Type</th>
                              <th>Industry</th>
                              <th>City</th>
                              <th>State</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              <tr>
                                <td colSpan="7" className="text-center">Loading...</td>
                              </tr>
                            ) : jobs && jobs.length > 0 ? (
                              jobs.map((job) => (
                                <tr key={job._id}>
                                  <td className="text-capitalize">
                                    {job._qualification ? job._qualification.name : "NA"}
                                  </td>
                                  <td className="text-capitalize">
                                    {job._company ? job._company.name : "NA"}
                                  </td>
                                  <td className="text-capitalize">
                                    {job.jobType || "NA"}
                                  </td>
                                  <td className="text-capitalize">
                                    {job._industry ? job._industry.name : "NA"}
                                  </td>
                                  <td className="text-capitalize">
                                    {job.city ? job.city.name : "NA"}
                                  </td>
                                  <td className="text-capitalize">
                                    {job.state ? job.state.name : "NA"}
                                  </td>
                                  <td className="text-capitalize">
                                    <Link to={`/college/job/${job._id}`}>
                                      <FontAwesomeIcon icon={faEye} className="success mr-2" />
                                    </Link>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="text-center mt-3">No result found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
     
    </>
  );
};

export default AvailableJobs;   