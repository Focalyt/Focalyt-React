import React, { useState, useEffect } from 'react';

const CompanyDashboard = () => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const [dashboardData, setDashboardData] = useState({
    company: null,
    vacancyCount: 0,
    shortlistedCandidates: 0,
    ongoingCandidates: [],
    appliedCandidates: [],
    qualifications: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch(`${backendUrl}/api/company/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getQualificationName = (qualificationId) => {
    const qualification = dashboardData.qualifications.find(q => q._id === qualificationId);
    return qualification?.name || 'NA';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <>
    
        <div className="content-body">
          {/* Company Dashboard Section */}
          <section id="company_dashboard">
            <div className="row">
              {/* Welcome Card */}
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-xl-2 mb-lg-2 mb-md-2 mb-sm-2 mb-2 mx-auto">
                <div className="col-xl-12 Company_card text-center py-1 one">
                  <img src={`${bucketUrl}/images/icons/user_avatar.png`} className="img-fluid" alt="User Avatar" />
                  <h5 className="text-white pt-2 mb-0">
                    Welcome {dashboardData.company?.name || 'Company'}
                  </h5>
                </div>
              </div>

              {/* Total Job Posts */}
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-xl-2 mb-lg-2 mb-md-2 mb-sm-2 mb-2 mx-auto">
                <div className="col-xl-12 Company_card py-2 two">
                  <div className="row">
                    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-6 col-6 text-center px-0">
                      <img src={`${bucketUrl}/images/icons/white_suitcase.png`} className="img-fluid" alt="Jobs" />
                    </div>
                    <div className="col-xl-8 col-lg-8 col-md-8 col-sm-6 col-6">
                      <h2 className="text-white">{dashboardData.vacancyCount}</h2>
                      <p className="text-white">Total Job Post</p>
                      <a className="btn btn-outline-cs" href="/company/list/jobs">
                        View<i className="fa fa-chevron-right text-white fa-view"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shortlisted Candidates */}
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-xl-2 mb-lg-2 mb-md-2 mb-sm-2 mb-2 mx-auto">
                <div className="col-xl-12 Company_card py-2 three">
                  <div className="row">
                    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-6 col-6 text-center px-0">
                      <img src={`${bucketUrl}/images/icons/shortlist.png`} className="img-fluid" alt="Shortlist" />
                    </div>
                    <div className="col-xl-8 col-lg-8 col-md-8 col-sm-6 col-6">
                      <h2 className="text-white">{dashboardData.shortlistedCandidates}</h2>
                      <p className="text-white">Shortlisted</p>
                      <a className="btn btn-outline-cs" href="/candidate/shortlisted">
                        View<i className="fa fa-chevron-right text-white fa-view"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Credits */}
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-xl-2 mb-lg-2 mb-md-2 mb-sm-2 mb-2 mx-auto">
                <div className="col-xl-12 Company_card py-2 four">
                  <div className="row">
                    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-6 col-6 text-center px-0">
                      <img src={`${bucketUrl}/images/icons/credits.png`} className="img-fluid" alt="Credits" />
                    </div>
                    <div className="col-xl-8 col-lg-8 col-md-8 col-sm-6 col-6">
                      <h2 className="text-white">{dashboardData.company?.creditLeft || 0}</h2>
                      <p className="text-white">Available Credits</p>
                      <a className="btn btn-outline-cs" href="#">
                        View<i className="fa fa-chevron-right text-white fa-view"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tables Section */}
          <section id="jobs_update">
            <div className="row">
              {/* Ongoing Interviews */}
              <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-3 candidate-card">
                <div className="card mt-1 mb-5">
                  <div className="col-xl-12 py-1">
                    <div className="row">
                      <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                        <h4 className="card-title text-capitalize">Ongoing Interviews</h4>
                      </div>
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 text-right">
                        <a href="/company/onGoingHiring" className="btn btn-outline-primary btn-sm text-capitalize">
                          View All
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="table-responsive">
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Candidates</th>
                            <th>Qualification</th>
                            <th>Hiring Stage</th>
                            <th>Experience</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-capitalize">
                          {dashboardData.ongoingCandidates && dashboardData.ongoingCandidates.length > 0 ? (
                            dashboardData.ongoingCandidates.map((candidate, index) => (
                              <tr key={index}>
                                <td>{candidate.candidate?.name || 'NA'}</td>
                                <td>{getQualificationName(candidate.candidate?.highestQualification)}</td>
                                <td>{candidate.status || 'NA'}</td>
                                <td>
                                  {!candidate.candidate?.isExperienced 
                                    ? 'Fresher' 
                                    : candidate.candidate?.totalExperience 
                                      ? `${candidate.candidate.totalExperience} Years`
                                      : 'NA'
                                  }
                                </td>
                                <td className="actions">
                                  <a href={`/company/candidate/${candidate.candidate._id}`}>
                                    <i className="fa-regular fa-user"></i>
                                  </a>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5">
                                <a href="/company/list-candidates">
                                  <img src={`${bucketUrl}/images/pages/shortlist.jpg`} className="img-fluid" alt="No candidates" />
                                </a>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interested Candidates */}
              <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-3 candidate-card">
                <div className="card mt-1 mb-5">
                  <div className="col-xl-12 py-1">
                    <div className="row">
                      <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                        <h4 className="card-title text-capitalize">Interested Candidates</h4>
                      </div>
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 text-right">
                        <a href="#" className="btn btn-outline-primary btn-sm">
                          View All
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="table-responsive">
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Candidates</th>
                            <th>Qualification</th>
                            <th>JD title</th>
                            <th>Experience</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-capitalize">
                          {dashboardData.appliedCandidates && dashboardData.appliedCandidates.length > 0 ? (
                            dashboardData.appliedCandidates.map((candidate, index) => (
                              <tr key={index}>
                                <td>{candidate._candidate?.name || 'NA'}</td>
                                <td>{candidate._candidate?.highestQualification?.name || 'NA'}</td>
                                <td>{candidate._job?.title || 'NA'}</td>
                                <td>
                                  {candidate._candidate?.totalExperience 
                                    ? `${candidate._candidate.totalExperience} Years`
                                    : 'Fresher'
                                  }
                                </td>
                                <td className="actions">
                                  <a href={`/company/candidate/${candidate._candidate._id}`}>
                                    <i className="fa-regular fa-user"></i>
                                  </a>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5">
                                <a href="/company/list/jobs">
                                  <img src={`${bucketUrl}/images/pages/add_job.jpg`} className="img-fluid" alt="No candidates" />
                                </a>
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

    </>
  );
};

export default CompanyDashboard;