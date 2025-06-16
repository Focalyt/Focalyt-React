import React, { useState, useEffect } from 'react';

const ViewJd = ({ jobId }) => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
  // Get jobId from props, URL params, or window location
  const currentJobId = jobId || window.location.pathname.split('/').pop();

  // State management
  const [jobDetails, setJobDetails] = useState({});
  const [appliedCandidates, setAppliedCandidates] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load job details and candidates
  useEffect(() => {
    loadJobData();
  }, [currentJobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'x-auth': token };

      // Load job details
      const jobResponse = await fetch(`${backendUrl}/company/jobs/${currentJobId}`, {
        headers
      });
      const jobData = await jobResponse.json();

      if (jobData.success) {
        setJobDetails(jobData.jd || {});
        setAppliedCandidates(jobData.appliedCandidates || []);
        setQualifications(jobData.qualifications || []);
      } else {
        setError('Failed to load job details');
      }
    } catch (error) {
      console.error('Error loading job data:', error);
      setError('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
  };

  // Get qualification name by ID
  const getQualificationName = (qualificationId) => {
    const qual = qualifications.find(q => q._id === qualificationId);
    return qual?.name || 'N/A';
  };

  // Format array to comma-separated string
  const formatArrayToString = (array, field = 'name') => {
    if (!array || !Array.isArray(array)) return 'N/A';
    return array.map(item => item[field] || item).join(', ') || 'N/A';
  };

  // Get experience display
  const getExperienceDisplay = (candidate) => {
    if (!candidate?.isExperienced) return 'Fresher';
    if (candidate?.totalExperience) return `${candidate.totalExperience} Years`;
    return 'N/A';
  };

  if (loading) {
    return (
      <>
        
          <div className="content-wrapper">
            <div className="text-center p-4">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-2">Loading job details...</p>
            </div>
          </div>
       
      </>
    );
  }

  if (error) {
    return (
      <>
       
          <div className="content-wrapper">
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          </div>
        
      </>
    );
  }

  return (
    <>
      
        <div className="content-wrapper">
          
          {/* Breadcrumb */}
          <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
            <div className="content-header-left col-md-9 col-12 mb-2">
              <div className="row breadcrumbs-top">
                <div className="col-12">
                  <h3 className="content-header-title float-left mb-0">JD</h3>
                  <div className="breadcrumb-wrapper col-12">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item">
                        <a href="/company/dashboard">Home</a>
                      </li>
                      <li className="breadcrumb-item active">JD</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Brief Section */}
          <section id="job-brief">
            <div className="row">
              <div className="col-xl-12 col-lg-12 px-3">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0 pb-1">
                    <div className="col-xl-6">
                      <h4 className="card-title">JOB Brief</h4>
                    </div>
                    <div className="col-xl-6 text-right">
                      <a href="/company/list/jobs" className="btn btn-primary">All JDs</a>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="card-body">
                      <div className="row">
                        
                        {/* Display Organization Name */}
                        <div className="col-xl-2 mb-1">
                          <label>Display Organization Name</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.displayCompanyName || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Title */}
                        <div className="col-xl-2 mb-1">
                          <label>Title</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.title || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Industry */}
                        <div className="col-xl-2 mb-1">
                          <label>Industry</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails._industry?.name || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Job Category */}
                        <div className="col-xl-2 mb-1">
                          <label>Job Category</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails._jobCategory?.name || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Experience */}
                        <div className="col-xl-2 mb-1">
                          <label>Experience (In Years)</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.experience === '0' ? 'Fresher' : jobDetails.experience || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Qualification */}
                        <div className="col-xl-2 mb-1">
                          <label>Qualification</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails._qualification?.name || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Stream */}
                        <div className="col-xl-2 mb-1">
                          <label>Stream</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={formatArrayToString(jobDetails._subQualification)} 
                            readOnly
                          />
                        </div>

                        {/* State */}
                        <div className="col-xl-2 mb-1">
                          <label>State (Job Location)</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.state?.name || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* City */}
                        <div className="col-xl-2 mb-1">
                          <label>City (Job Location)</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.city?.name || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Work Location */}
                        <div className="col-xl-2 mb-1">
                          <label>Work Location</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.place || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Number of Vacancies */}
                        <div className="col-xl-2 mb-1">
                          <label>Number of Vacancies</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.noOfPosition || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Gender Preferences */}
                        <div className="col-xl-2 mb-1">
                          <label>Gender Preferences</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.genderPreference || 'No Preference'} 
                            readOnly
                          />
                        </div>

                        {/* Job Type */}
                        <div className="col-xl-2 mb-1">
                          <label>Job Type</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.jobType || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Compensation */}
                        <div className="col-xl-2 mb-1">
                          <label>Compensation</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.compensation || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Pay */}
                        <div className="col-xl-2 mb-1">
                          <label>Pay</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.pay || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Shift */}
                        <div className="col-xl-2 mb-1">
                          <label>Shift</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.shift || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Work Type */}
                        <div className="col-xl-2 mb-1">
                          <label>Work Type</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.work || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Additional Benefits */}
                        <div className="col-xl-2 mb-1">
                          <label>Additional Benefits</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={formatArrayToString(jobDetails.benifits)} 
                            readOnly
                          />
                        </div>

                        {/* Remarks */}
                        <div className="col-xl-2 mb-1">
                          <label>Remarks</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.remarks || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Payout */}
                        <div className="col-xl-2 mb-1">
                          <label>Payout</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.payOut || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Tech Skills */}
                        <div className="col-xl-2 mb-1">
                          <label>Tech Skills Required</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={formatArrayToString(jobDetails._techSkills)} 
                            readOnly
                          />
                        </div>

                        {/* Non Tech Skills */}
                        <div className="col-xl-2 mb-1">
                          <label>Non Tech Skills Required</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={formatArrayToString(jobDetails._nonTechSkills)} 
                            readOnly
                          />
                        </div>

                        {/* Requirement */}
                        <div className="col-xl-2 mb-1">
                          <label>Requirement (If any)</label>
                          <input 
                            className="form-control text-capitalize" 
                            value={jobDetails.requirement || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Amount */}
                        <div className="col-xl-2 mb-1">
                          <label>Amount (Monthly in Rs.)</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.amount || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Min Salary */}
                        <div className="col-xl-2 mb-1">
                          <label>Min Salary (Monthly in Rs.)</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.min || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Max Salary */}
                        <div className="col-xl-2 mb-1">
                          <label>Max Salary (Monthly in Rs.)</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.max || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Job Description */}
                        <div className="col-xl-2 mb-1">
                          <label>Job Description</label>
                          <input 
                            className="form-control" 
                            value={jobDetails.jobDescription || 'N/A'} 
                            readOnly
                          />
                        </div>

                        {/* Contact Information - Conditional Rendering */}
                        {jobDetails.isContact === true && (
                          <>
                            <div className="col-xl-2 mb-1">
                              <label>Name</label>
                              <input 
                                className="form-control" 
                                value={jobDetails.nameof || 'N/A'} 
                                readOnly
                              />
                            </div>
                            <div className="col-xl-2 mb-1">
                              <label>Phone Number</label>
                              <input 
                                className="form-control" 
                                value={jobDetails.phoneNumberof || 'N/A'} 
                                readOnly
                              />
                            </div>
                            <div className="col-xl-2 mb-1">
                              <label>WhatsApp Number</label>
                              <input 
                                className="form-control" 
                                value={jobDetails.whatsappNumberof || 'N/A'} 
                                readOnly
                              />
                            </div>
                            <div className="col-xl-2 mb-1">
                              <label>Email</label>
                              <input 
                                className="form-control" 
                                value={jobDetails.emailof || 'N/A'} 
                                readOnly
                              />
                            </div>
                          </>
                        )}

                        {/* Job Video */}
                        <div className="col-xl-2 mb-1">
                          <label>Job Video</label>
                          {jobDetails.jobVideo ? (
                            <div className="image-upload">
                              <div className="input-group">
                                <div className="input-group-prepend">
                                  <span className="input-group-text">
                                    <a 
                                      href={`${bucketUrl}/${jobDetails.jobVideo}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      View JD
                                    </a>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <input 
                              className="form-control" 
                              value="No Video" 
                              readOnly
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Applied Candidates Section */}
          <section className="list-view">
            <div className="row">
              <div className="col-xl-12 col-lg-12 px-3">
                <div className="card">
                  <div className="card-header border border-top-0 border-left-0 border-right-0 pb-1">
                    <div className="col-xl-6">
                      <h4 className="card-title">Applied Candidates</h4>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="table-responsive">
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Candidates</th>
                            <th>Gender</th>
                            <th>Qualification</th>
                            <th>Branch</th>
                            <th>Experience</th>
                            <th>Applied on</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-capitalize">
                          {appliedCandidates.length > 0 ? (
                            appliedCandidates.map((candidate, index) => (
                              <tr key={index}>
                                <td>{candidate?._candidate?.name || 'N/A'}</td>
                                <td>{candidate?._candidate?.sex || 'N/A'}</td>
                                <td>
                                  {getQualificationName(candidate?._candidate?.highestQualification)}
                                </td>
                                <td>
                                  {candidate?._candidate?.qualifications?.[0]?.Qualification?.name || 'N/A'}
                                </td>
                                <td>{getExperienceDisplay(candidate?._candidate)}</td>
                                <td>{formatDate(candidate?._candidate?.createdAt)}</td>
                                <td className="actions">
                                  <a href={`/company/candidate/${candidate?._candidate?._id}`}>
                                    <i className="fa-regular fa-user fa-lg"></i>
                                  </a>
                                  {candidate?._candidate?.whatsapp && (
                                    <a 
                                      href={`https://wa.me/91${candidate._candidate.whatsapp}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="mx-1"
                                    >
                                      <img 
                                        src="/public_assets/images/whatsappicon.png" 
                                        width="18%" 
                                        alt="WhatsApp"
                                      />
                                    </a>
                                  )}
                                  {candidate?._candidate?.mobile && (
                                    <a href={`tel:${candidate._candidate.mobile}`}>
                                      <img 
                                        src="/public_assets/images/telephone.png" 
                                        width="18.5%" 
                                        alt="Call"
                                      />
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="text-center" colSpan="7">
                                No Record Found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
   

      <style jsx>{`
        .text-capitalize {
          text-transform: capitalize;
        }
        .actions {
          white-space: nowrap;
        }
        .actions a {
          margin-right: 8px;
          text-decoration: none;
        }
        .actions img {
          vertical-align: middle;
        }
        .spinner-border {
          width: 3rem;
          height: 3rem;
        }
        input[readonly] {
          background-color: #f8f9fa;
          opacity: 1;
        }
        .table-responsive {
          overflow-x: auto;
        }
      `}</style>
    </>
  );
};

export default ViewJd;