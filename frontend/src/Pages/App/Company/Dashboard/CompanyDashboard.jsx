import React, { useState, useEffect } from 'react';

const CompanyDashboard = () => {
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL || '';
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || '';
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    company: { name: '', creditLeft: 0 },
    vacancyCount: 0,
    shortlistedCandidates: 0,
    ongoingCandidates: [],
    appliedCandidates: [],
    qualifications: []
  });
  
  const [loading, setLoading] = useState(true);

  // Simple navigation function without useNavigate
  const handleNavigation = (path) => {
    window.location.href = path;
  };

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Replace with actual API calls to your backend
        // const response = await fetch(`${backendUrl}/company/dashboard`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockData = {
          company: { name: 'Tech Solutions Inc.', creditLeft: 25 },
          vacancyCount: 8,
          shortlistedCandidates: 15,
          ongoingCandidates: [
            {
              candidate: { _id: '1', name: 'John Doe', highestQualification: '1', isExperienced: true, totalExperience: 3 },
              status: 'Technical Interview'
            },
            {
              candidate: { _id: '2', name: 'Jane Smith', highestQualification: '2', isExperienced: false },
              status: 'HR Round'
            }
          ],
          appliedCandidates: [
            {
              _candidate: { _id: '3', name: 'Mike Johnson', highestQualification: { name: 'B.Tech' }, totalExperience: 2 },
              _job: { title: 'Frontend Developer' }
            },
            {
              _candidate: { _id: '4', name: 'Sarah Wilson', highestQualification: { name: 'M.Tech' }, totalExperience: null },
              _job: { title: 'Backend Developer' }
            }
          ],
          qualifications: [
            { _id: '1', name: 'B.Tech' },
            { _id: '2', name: 'M.Tech' },
            { _id: '3', name: 'MBA' }
          ]
        };
        
        setDashboardData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendUrl]);

  const getQualificationName = (qualificationId) => {
    const qualification = dashboardData.qualifications.find(q => q._id === qualificationId);
    return qualification ? qualification.name : 'NA';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="app-content content">
        <div className="content-wrapper">
          <div className="content-header"></div>
          <div className="content-body">
            
            {/* Company Dashboard Cards */}
            <section id="company_dashboard">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-center text-white">
                  <img 
                    src={`${bucketUrl}/images/icons/user_avatar.png`} 
                    className="w-16 h-16 mx-auto mb-4 rounded-full" 
                    alt="Company Avatar"
                    onError={(e) => {e.target.src = '/images/icons/user_avatar.png'}}
                  />
                  <h5 className="text-lg font-semibold">Welcome {dashboardData.company?.name}</h5>
                </div>

                {/* Total Job Posts */}
                <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <img 
                        src={`${bucketUrl}/images/icons/white_suitcase.png`} 
                        className="w-12 h-12 mb-2" 
                        alt="Jobs Icon"
                        onError={(e) => {e.target.src = '/images/icons/white_suitcase.png'}}
                      />
                    </div>
                    <div className="flex-2">
                      <h2 className="text-3xl font-bold">{dashboardData.vacancyCount}</h2>
                      <p className="text-sm opacity-90">Total Job Post</p>
                      <button 
                        className="mt-2 px-4 py-1 border border-white rounded text-sm hover:bg-white hover:text-green-600 transition-colors"
                        onClick={() => handleNavigation('/company/list/jobs')}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shortlisted Candidates */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <img 
                        src={`${bucketUrl}/images/icons/shortlist.png`} 
                        className="w-12 h-12 mb-2" 
                        alt="Shortlist Icon"
                        onError={(e) => {e.target.src = '/images/icons/shortlist.png'}}
                      />
                    </div>
                    <div className="flex-2">
                      <h2 className="text-3xl font-bold">{dashboardData.shortlistedCandidates}</h2>
                      <p className="text-sm opacity-90">Shortlisted</p>
                      <button 
                        className="mt-2 px-4 py-1 border border-white rounded text-sm hover:bg-white hover:text-orange-600 transition-colors"
                        onClick={() => handleNavigation('/candidate/shortlisted')}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Credits */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <img 
                        src={`${bucketUrl}/images/icons/credits.png`} 
                        className="w-12 h-12 mb-2" 
                        alt="Credits Icon"
                        onError={(e) => {e.target.src = '/images/icons/credits.png'}}
                      />
                    </div>
                    <div className="flex-2">
                      <h2 className="text-3xl font-bold">{dashboardData.company?.creditLeft}</h2>
                      <p className="text-sm opacity-90">Available Credits</p>
                      <button 
                        className="mt-2 px-4 py-1 border border-white rounded text-sm hover:bg-white hover:text-purple-600 transition-colors"
                        onClick={() => handleNavigation('#')}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tables Section */}
            <section id="jobs_update">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Ongoing Interviews */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold capitalize">Ongoing Interviews</h4>
                      <button 
                        className="px-4 py-2 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50 transition-colors"
                        onClick={() => handleNavigation('/company/onGoingHiring')}
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Candidates</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Qualification</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hiring Stage</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Experience</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.ongoingCandidates?.length > 0 ? (
                          dashboardData.ongoingCandidates.map((candidate, index) => (
                            <tr key={index} className="hover:bg-gray-50 capitalize">
                              <td className="px-4 py-3 text-sm">{candidate.candidate?.name}</td>
                              <td className="px-4 py-3 text-sm">
                                {getQualificationName(candidate.candidate?.highestQualification)}
                              </td>
                              <td className="px-4 py-3 text-sm">{candidate.status || 'NA'}</td>
                              <td className="px-4 py-3 text-sm">
                                {!candidate.candidate?.isExperienced 
                                  ? 'Fresher' 
                                  : candidate.candidate?.totalExperience 
                                    ? `${candidate.candidate.totalExperience} Years`
                                    : 'NA'
                                }
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button 
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => handleNavigation(`/company/candidate/${candidate.candidate._id}`)}
                                >
                                  👤
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center">
                              <img 
                                src={`${bucketUrl}/images/pages/shortlist.jpg`} 
                                className="mx-auto max-w-xs" 
                                alt="No shortlisted candidates"
                                onError={(e) => {e.target.src = '/images/pages/shortlist.jpg'}}
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Interested Candidates */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold capitalize">Interested Candidates</h4>
                      <button 
                        className="px-4 py-2 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50 transition-colors"
                        onClick={() => handleNavigation('#')}
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Candidates</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Qualification</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">JD title</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Experience</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.appliedCandidates?.length > 0 ? (
                          dashboardData.appliedCandidates.map((candidate, index) => (
                            <tr key={index} className="hover:bg-gray-50 capitalize">
                              <td className="px-4 py-3 text-sm">{candidate._candidate?.name || 'NA'}</td>
                              <td className="px-4 py-3 text-sm">{candidate._candidate?.highestQualification?.name || 'NA'}</td>
                              <td className="px-4 py-3 text-sm">{candidate._job?.title || 'NA'}</td>
                              <td className="px-4 py-3 text-sm">
                                {candidate._candidate?.totalExperience 
                                  ? `${candidate._candidate.totalExperience} Years`
                                  : 'Fresher'
                                }
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button 
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() => handleNavigation(`/company/candidate/${candidate._candidate._id}`)}
                                >
                                  👤
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center">
                              <img 
                                src={`${bucketUrl}/images/pages/add_job.jpg`} 
                                className="mx-auto max-w-xs" 
                                alt="No applied candidates"
                                onError={(e) => {e.target.src = '/images/pages/add_job.jpg'}}
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;