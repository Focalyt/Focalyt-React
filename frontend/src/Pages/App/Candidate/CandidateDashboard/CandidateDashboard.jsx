import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import "./CandidateDashboard.css";
import "./Profile.css";

import CandidateLayout from '../../../../Component/Layouts/App/Candidates'
import CandidateHeader from '../../../../Component/Layouts/App/Candidates/CandidateHeader/CandidateHeader'
import CandidateSidebar from '../../../../Component/Layouts/App/Candidates/CandidateSidebar/CandidateSidebar'

const CandidateDashboard = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };
  const [expanded, setExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [openSubmenu, setOpenSubmenu] = useState({
    profile: false,
    courses: false,
    jobs: false,
    wallet: false
  });

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenu({
      ...openSubmenu,
      [menu]: !openSubmenu[menu]
    });
  };

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  // profile 



  return (<>

   
      {/* <div className="candidate-dashboard-sidebar">
          <CandidateSidebar />
        </div> */}

      <div className="">
        <div className="content-overlay"></div>
        <div className="header-navbar-shadow"></div>
        <div className="content-wrapper">
          <div className="content-header row">
          </div>
          <div className="content-body  mb-4">
            <a href="/candidate/cashback">
              <div className="height-structure bannerCan">
                <img src="/Assets/images/candidate-dashboard.jpg" alt="" />
                {/* <!-- <h5 className="mb-2">Welcome <span className="font-italic text-primary" id="user-name"></span></h5> --> */}
              </div>
            </a>

            <section id="profile_status" className="mt-3 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0 mb-0">
              <div className="row">
                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                  <a href="/candidate/cashback">
                    <div className="card">
                      <div className="card-body profile_step_col-new done shadow card-yellow yellow-ribbon px-0 py-3">
                        <div className="row">
                          <div className="col-6 text-center">
                            <img src="/Assets/images/icons/wallet-t.png" className="img-fluid px-1" />
                          </div>
                          <div className="col-6 px-0 ">
                            <h5 className="pt-1 mb-0 candid-box">My Earnings /</h5>
                            <p className=" profile-status ">मेरी कमाई
                            </p>

                          </div>
                        </div>
                        <div className="bg-stripfour">
                          <p className="mt-4 mb-0 candid-box candid-boxtext text-center text-white citric">
                            ₹ 15
                          </p>
                        </div>
                        <div className="fixed-at-corner__corner fixed-at-corner__corner--br">
                          <img src="/Assets/images/icons/go-arrow.png" className="img-fluid" />
                        </div>
                      </div>

                    </div>
                  </a>
                </div>

                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                  <a href="/candidate/InterestedCompanies">
                    <div className="card">
                      <div className="card-body profile_step_col-new done shadow card-green green-ribbon px-0 py-3 ">
                        <div className="row">
                          <div className="col-6 text-center">

                            <img src="/Assets/images/icons/job-alloc.png" className="img-fluid px-1" />


                          </div>
                          <div className="col-6 px-0">
                            <h5 className="pt-1 mb-0 candid-box">Shortlisting /</h5>
                            <p className=" profile-status ">शॉर्टलिस्टिंग</p>

                          </div>
                        </div>
                        <div className="bg-stripone">
                          <p className="mt-4 mb-0 candid-box candid-boxtext text-center pt-0 text-white citric">
                            0
                          </p>
                        </div>
                        <div className="fixed-at-corner__corner fixed-at-corner__corner--br">
                          <img src="/Assets/images/icons/go-arrow.png" className="img-fluid" />
                        </div>

                      </div>
                    </div>
                  </a>
                </div>



                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                  <a href="/candidate/searchjob">
                    <div className="card">
                      <div className="card-body profile_step_col-new done org-ribbon shadow job-pink px-0 py-3">
                        <div className="row">
                          <div className=" col-6 text-center">

                            <img src="/Assets/images/icons/jobinhandt.png" className="img-fluid px-1" />


                          </div>
                          <div className=" col-6 px-0">
                            <h5 className="pt-1 mb-0 candid-box">Available Jobs
                              /</h5>
                            <p className=" profile-status ">उपलब्ध नौकरियां
                            </p>

                          </div>
                        </div>
                        <div className="bg-striptwo">
                          <p className="mt-4 mb-0 candid-box candid-boxtext text-center text-white citric">
                            200
                          </p>
                        </div>
                        <div className="fixed-at-corner__corner fixed-at-corner__corner--br purple-ribbon">
                          <img src="/Assets/images/icons/go-arrow.png" className="img-fluid " />
                        </div>

                      </div>
                    </div>
                  </a>
                </div>

                <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                  <a href="/candidate/Coins">
                    <div className="card">
                      <div className="card-body profile_step_col-new done org-ribbon shadow mipie-blue text-white px-0 py-3">
                        <div className="row">
                          <div className=" col-6 text-center">

                            <img src="/Assets/images/icons/coins-stack.png" className="img-fluid px-1" />


                          </div>
                          <div className=" col-6 px-0">
                            <h5 className="pt-1 mb-0 candid-box">Coins /</h5>
                            <p className=" profile-status "> सिक्के
                            </p>

                          </div>
                        </div>
                        <div className="bg-stripthree">
                          <p className="mt-4 mb-0 candid-box candid-boxtext text-center text-white citric">
                            200
                          </p>
                        </div>
                        <div className="fixed-at-corner__corner fixed-at-corner__corner--br org-ribbon">
                          <img src="/Assets/images/icons/go-arrow.png" className="img-fluid" />
                        </div>

                      </div>
                    </div>
                  </a>
                </div>
              </div>

            </section>
            <section id="jobs_update  ">
              <div className="row">


                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-0 mb-0 candidate-card">
                  <div className="card mt-1 mb-2">
                    <div className="col-xl-12 p-3">
                      <div className="row">
                        <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto ">
                          <h4 className="card-title mb-0" id="wrapping-bottom">Latest Applied Jobs / नवीनतम लागू नौकरियां</h4>
                        </div>
                        <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 text-right my-auto">
                          <a href="/candidate/appliedJobs" className="btn btn-outline-primary btn-sm waves-effect waves-light">View All</a>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="table-responsive">
                        <table className="table table-hover-animation mb-0 table-hover">
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>Industry</th>
                              <th>City</th>
                              <th>State</th>
                            </tr>
                          </thead>
                          <tbody id="table-body">

                            <tr>
                              <td>Focal Skill Development Pvt Ltd</td>
                              <td>Consumer Retail &amp; Hospitality</td>
                              <td>Chandigarh</td>
                              <td>Chandigarh</td>
                            </tr>

                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>

        {/* Send SMS Modal */}
       

      </div>




   </>

  )
}

export default CandidateDashboard
