import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import moment from "moment";
// import "./AppliedJobs.css";

const CandidateAppliedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  useEffect(() => {
    fetchAppliedJobs();
  }, [page]);

  const fetchAppliedJobs = async () => {
    try {
      const response = await axios.get(`${backendUrl}/candidate/appliedJobs`, {
        params: { page },
        headers: {
          'x-auth': localStorage.getItem('token') // या जो भी auth token हो
        }
      });
      
      setJobs(response.data.jobs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    }
  };

  return (
    <div className="container mt-3">
      <h3 className="text-center">Applied Jobs</h3>

      <section className="applied-jobs mt-3">
        <div className="row">
          {jobs.length > 0 ? (
            jobs.map((job, index) => {
              const vacancy = job.vacancy?.[0] || {};
              const company = job._company?.[0] || {};
              const industry = job.industry?.[0] || {};
              const city = job.city?.[0] || {};
              const state = job.state?.[0] || {};
              const qualification = job.qualifications?.[0] || {};

              return (
                <div className="col-md-6" key={index}>
                  <div className="card job-card mb-3">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <img
                          src={
                            company.logo
                              ? `${process.env.REACT_APP_MIPIE_BUCKET_URL}/${company.logo}`
                              : "/images/logo90.png"
                          }
                          alt="Company Logo"
                          className="job-logo"
                        />
                        <div className="ml-3">
                          <h6 className="font-weight-bold">{vacancy.title || "NA"}</h6>
                          <span className="text-muted">{company.name || "NA"}</span>
                        </div>
                      </div>

                      <Link to={`/candidate/job/${vacancy._id}`}>
                        <div className="job-details mt-2">
                          <ul className="list-unstyled">
                            <li>
                              <i className="la la-thumb-tack"></i> {qualification.name || "NA"}
                              <span> Qualification</span>
                            </li>
                            <li>
                              <i className="la la-university"></i> {company.name || "NA"}
                              <span> Company Name</span>
                            </li>
                            <li>
                              <i className="la la-puzzle-piece"></i> {vacancy.jobType || "NA"}
                              <span> Job Type</span>
                            </li>
                            <li>
                              <i className="la la-building-o"></i> {industry.name || "NA"}
                              <span> Industry</span>
                            </li>
                            <li>
                              <i className="la la-map"></i> {city.name || "NA"}, {state.name || "NA"}
                              <span> Location</span>
                            </li>
                            <li>
                              <i className="la la-clock-o"></i>{" "}
                              {moment(vacancy.createdAt).utcOffset("+05:30").format("DD MMM YYYY")}
                              <span> Posted On</span>
                            </li>
                          </ul>
                        </div>
                      </Link>

                      {vacancy.isContact === true && vacancy.phoneNumberof && (
                        <div className="mt-2">
                          <a href={`tel:${vacancy.phoneNumberof}`} className="btn btn-primary">
                            <i className="la la-phone"></i> Call Now
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <h4 className="text-center w-100">No Applied Jobs Found</h4>
          )}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            {Array.from({ length: totalPages }).map((_, index) => (
              <li key={index} className={`page-item ${page === index + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(index + 1)}>
                  {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <style>
        {
          `
          .breadcrumb-item a {
            color: #FC2B5A;
        }`
                }
      </style>
    </div>
  );
};

export default CandidateAppliedJobs;
