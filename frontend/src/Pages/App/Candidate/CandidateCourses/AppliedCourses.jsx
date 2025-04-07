import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

// Environment variables
const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

const AppliedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch applied courses data
    const fetchAppliedCourses = async () => {
      try {
        const response = await axios.get(`${backendUrl}/candidate/appliedCourses`, {
          withCredentials: true
        });
        setCourses(response.data.courses || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching applied courses:', error);
        setLoading(false);
      }
    };

    fetchAppliedCourses();
  }, []);

  return ( 
      <>
       
          {/* Breadcrumbs header for desktop */}
          <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
            <div className="content-header-left col-md-9 col-12 mb-2">
              <div className="row breadcrumbs-top">
                <div className="col-12 my-auto">
                  <h3 className="content-header-title float-left mb-0">Applied Courses</h3>
                  <div className="breadcrumb-wrapper col-12">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item">
                        <Link to="/candidate/dashboard">Home</Link>
                      </li>
                      <li className="breadcrumb-item"><Link to="#">Applied Courses</Link></li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <section id="searchCourses" className="mb-2">
            <div className="container">
              <ul className="nav nav-tabs justify-content-center" id="courseTabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <Link className="nav-link" id="search-tab" to="/candidate/searchcourses" role="tab" aria-controls="search" aria-selected="false">
                    Search Courses
                  </Link>
                </li>
                <li className="nav-item" role="presentation">
                  <Link className="nav-link" id="pending-tab" to="/candidate/pendingFee" role="tab" aria-controls="pending" aria-selected="false">
                    Pending for Fee
                  </Link>
                </li>
                <li className="nav-item" role="presentation">
                  <Link className="nav-link active" id="applied-tab" to="/candidate/appliedCourses" role="tab" aria-controls="applied" aria-selected="true">
                    Applied Courses
                  </Link>
                </li>
              </ul>
            </div>
          </section>

          {/* Course listings */}
          <section className="searchjobspage">
            <div className="forlrgscreen">
              <div className="pt-xl-2 pt-lg-0 pt-md-0 pt-sm-5 pt-0">
                {loading ? (
                  <div className="text-center">Loading...</div>
                ) : courses && courses.length > 0 ? (
                  courses.map((appliedcourse, index) => (
                    <div className="card" key={index}>
                      <div className="card-body">
                        <div className="row pointer">
                          <div className="col-lg-8 col-md-7 column">
                            <div className="job-single-sec mt-xl-0">
                              <div className="job-single-head border-0 pb-0">
                                <div>
                                  <h6 className="text-capitalize font-weight-bolder">
                                    {appliedcourse._course.name ? appliedcourse._course.name : 'NA'}
                                  </h6>
                                  <span className="text-capitalize set-lineh">
                                    {appliedcourse._course.sectors && appliedcourse._course.sectors[0] ? appliedcourse._course.sectors[0].name : ""}
                                  </span>
                                </div>
                              </div>
                              <Link to={`/candidate/course/${appliedcourse._course._id}`}>
                                <div className="job-overview mt-1">
                                  <ul className="mb-xl-2 mb-lg-2 mb-md-2 mb-sm-0 mb-0 list-unstyled">
                                    <li>
                                      <i className="la la-money"></i>
                                      <h3 className="jobDetails-wrap">
                                        {appliedcourse._course.cutPrice 
                                          ? appliedcourse._course.cutPrice.toLowerCase() === 'free' 
                                            ? appliedcourse._course.cutPrice 
                                            : '₹ ' + appliedcourse._course.cutPrice 
                                          : 'N/A'}
                                      </h3>
                                      <span className="text-capitalize jobDetails-wrap">
                                        Course Fee
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-shield"></i>
                                      <h3 className="jobDetails-wrap">
                                        {appliedcourse._course.courseLevel ? appliedcourse._course.courseLevel : 'N/A'}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        Course Level
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-graduation-cap"></i>
                                      <h3 className="jobDetails-wrap">
                                        {appliedcourse._course?.certifyingAgency ? appliedcourse._course.certifyingAgency : 'N/A'}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        Course Agency
                                      </span>
                                    </li>
                                    <li>
                                      <i className="la la-money"></i>
                                      <h3 className="jobDetails-wrap">
                                        {appliedcourse?.registrationFee === 'Paid' ? 'Paid' : 'Unpaid'}
                                      </h3>
                                      <span className="jobDetails-wrap">
                                        Registration Status
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </Link>
                            </div>
                          </div>
                          <div className="col-lg-4 col-md-5 column mt-xl-1 mt-lg-1 mt-md-1 mt-sm-3 mt-0">
                            <div className="extra-job-info mt-1">
                              <span className="px-0">
                                <i className="la la-map"></i>
                                <strong>Last Date</strong> {' '}
                                {moment(appliedcourse._course.lastDateForApply || 
                                  appliedcourse._course.createdAt).utcOffset('+05:30').format('DD MMM YYYY')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <h4 className="text-center">No Course found</h4>
                )}
              </div>
            </div>
          </section>

          {/* Hidden map section */}
          <section className="map" style={{ display: 'none' }}>
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
                <div id="map" style={{ width: '100%', height: '400px' }} className="rounded"></div>
              </div>
              </div>
            </section>
         
      

        {/* Modal */}
        <div className="modal fade" id="popup" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">Complete Profile</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
    );
};

export default AppliedCourses;