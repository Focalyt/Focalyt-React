import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";


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

      <div className="">
      
            <a href="/candidate/cashback" className='d-md-block d-sm-none d-none'>
              <div className="height-structure bannerCan">
                <img src="/Assets/images/candidate-dashboardnew.jpg" alt="" />
                {/* <!-- <h5 className="mb-2">Welcome <span className="font-italic text-primary" id="user-name"></span></h5> --> */}
              </div>
            </a>
            <a href="/candidate/cashback" className='d-md-none d-sm-block d-bock'>
              <div className="height-structure bannerCan">
                <img src="/Assets/images/mobile-banner-candidate.jpg" alt="" />
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

<style>
  {
    `
 html body .content .content-wrapper {
    padding: calc(2.2rem - 0.4rem) 2.2rem 0;
    margin-top: 6rem;
}

    #profile_status a{
    width: 100%;
}
#profile_status img{
    width: 90%;
}
.candid-box {
    color: #FC2B5A;
    font-weight: 600;
    font-size: 13px;
  }
  
  .candid-boxtext {
    font-weight: 500;
  
  }
  .special-name{
    padding-left: 0!important;
  }
  
  .candid-head {
    font-weight: 600;
  
  }
  
  .profile-status {
    color: #000;
    padding-top: 5px;
    font-weight: 500;
  
  }
  
  .profile-status:hover {
    color: #FC2B5A;
  }
  
  .profile_all:after {
    content: "";
    position: absolute;
    margin: -36px;
    width: 110px;
    height: 170px;
    transform: rotate(228deg);
    background-color: #FC2B5A;
    right: 0px;
    z-index: -9;
    -webkit-box-shadow: -5px -5px 13px 0px rgb(0 0 0 / 75%);
    -moz-box-shadow: -5px -5px 13px 0px rgba(0, 0, 0, 0.75);
    box-shadow: -5px -5px 13px 0px rgb(0 0 0 / 75%);
  }
  
  .profile_step_col-new {
    border-radius: 10px;
    filter: drop-shadow(2.5px 4.33px 4.5px rgba(0, 0, 0, 0.07));
    background-color: #fff;
  
  }
  
  .profile_step_col-new:after {
    content: "";
    position: absolute;
    margin: -36px;
    width: 110px;
    height: 170px;
    transform: rotate(228deg);
    background-color: #FC2B5A;
    right: 0px;
    z-index: -9;
    -webkit-box-shadow: -5px -5px 13px 0px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: -5px -5px 13px 0px rgba(0, 0, 0, 0.75);
    box-shadow: -5px -5px 13px 0px rgba(0, 0, 0, 0.75);
  }
  
  .profile_step_col-new {
    position: relative;
    overflow: hidden;
  }
  
  .profile_step_col-new .due:after {
    background-color: #FC2B5A;
  }
  
  .profile_step_col-new.due:after {
    background-color: #c8c8c8 !important;
  }
  
  .blue-card {
    background-color: #a0e3ff;
  }
  
  .tag-blue::after {
    background-color: #6bc6ea !important;
  }
  
  .card-green {
    background-color: #b0f7b7;
  }
  
  .card-yellow {
    background-color: #ffeaab;
  }
  
  .card-purple {
    background-color: #c2c6ff;
  
  }
  
  .org-ribbon::after {
    background-color: #ff8d53;
  }
  
  .blue-ribbon::after {
    z-index: 1;
    background-color: #68c8ed;
  }
  
  .green-ribbon::after {
    z-index: 1;
    background-color: #61e26d;
  }
  
  .org-ribbon::after {
    z-index: 1;
    background-color: #ff8d53;
  }
  
  .bg-file {
    background-color: #ee7d43;
  }
  
  .bg-stripone {
    background-color: #3dc34a;
  
  }
  
  .bg-striptwo {
    background-color: #e77070;
  }
  
  .bg-stripthree {
    background-color: #38b2e5;
  }
  
  .bg-stripfour {
    background-color: #d4b34f;
  }
  
  .hifun {
    position: relative;
    top: 11px;
  }
  
  /********   z index for overlap ******/
  .fixed-at-corner__corner.fixed-at-corner__corner--br {
    position: absolute;
    bottom: 13px;
    z-index: 2;
    right: 3px;
  }
  
  /************* end *****************/
  .yellow-ribbon::after {
    z-index: 1;
    background-color: #eece6b;
  }
  .job-pink{
    background-color: #ffcbcb;
  }

  .job-pink::after{
    background-color: #ff7878;
  }

  .mipie-blue{
background-color: #a0e3ff;
  }
  .mipie-blue::after{
background-color: #64ccf3;
  }
  .full-btn{
    width: 100%;
  }
  .card .card-title {
    font-size: 1rem !important;
}
.pt-1, .py-1 {
    padding-top: 1rem !important;
}
.btn[class*="btn-outline-"].btn-sm {
    padding-top: calc(0.5rem - 1px);
    padding-bottom: calc(0.5rem - 1px);
}
.btn-outline-primary {
    border: 1px solid #FC2B5A;
    background-color: transparent;
    color: #FC2B5A;
}
.candidate-card {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
}
.text-right{
    text-align: right;
}
.table-responsive::-webkit-scrollbar {
    width: 1px; 
    height: 2px;
}

.table-responsive::-webkit-scrollbar-track {
    background: #f1f1f1; /* Scroll bar background */
}

.table-responsive::-webkit-scrollbar-thumb {
    background: #c96c43; /* Scroll bar color */
    border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
    background: #a15234; /* Hover effect */
}


/* // sidebar  */
/* Main sidebar container */
.main-menu {
  background-color: #fff;
  color: #6e6b7b;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 230px;
  height: 100vh;
  z-index: 1000;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.main-menu.collapsed {
  width: 80px;
}

/* Navbar header */
.navbar-header {
  height: 60px;
  padding: 0.35rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}

/* Logo */
.logocs {
  max-height: 35px;
  transition: all 0.3s ease;
}

/* Main menu content */
.main-menu-content {
  padding: 10px 0;
  overflow-y: auto;
}

/* Navigation */
.navigation {
  padding: 0;
  margin: 0;
  list-style: none;
}

.navigation li {
  position: relative;
  white-space: nowrap;
  margin-bottom: 2px;
}

.navigation > li {
  padding: 0 10px;
}

/* Navigation links */
.navigation li a {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: #6e6b7b;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 5px;
  font-size: 14px;
}

.navigation li a:hover {
  background-color: rgba(115, 103, 240, 0.1);
  color: #7367f0;
}

/* Active Dashboard */
.navigation li.active > a {
  background-color: #ff3366;
  color: #fff;
  font-weight: 500;
}

/* Icons */
.navigation li a i {
  margin-right: 15px;
  font-size: 1rem;
  width: 20px;
  text-align: center;
  color: inherit;
}

/* Arrow indicator for dropdown */
.nav-item.has-sub > a:after {
  content: '\f054';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  transition: transform 0.3s ease;
  color: #494949;
}

.nav-item.has-sub.open > a:after {
  transform: translateY(-50%) rotate(90deg);
}

/* Submenu styles */
.menu-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0, 1, 0, 1);
  padding-left: 10px;
  list-style: none;
  margin-left: 25px;
}

.menu-content.show {
  max-height: 1000px;
  transition: max-height 0.5s ease-in;
}

/* Submenu items */
.menu-content li a {
  padding: 8px 15px 8px 10px;
  font-size: 13px;
}

/* Special styles for dashboard */
.navigation .active{
  background-color: #ff3366;

}
/* .navigation li:first-child a {
  background-color: #ff3366;
  color: #fff;
} */

/* Collapsed sidebar adjustments */
.collapsed .navigation li a span {
  display: none;
}

.collapsed .nav-item.has-sub > a:after {
  display: none;
}

.collapsed .menu-content {
  display: none;
}

/* Style for dropdown sections */
.nav-item.has-sub > a {
  position: relative;
}
#profile_status {
  list-style-type: none;
  counter-reset: number;
  position: relative;
  display: block;
  z-index: 2;
}
#profile_status::before {
  content: "";
  width: 100%;
  border-top: 2px dashed #c9c9c9;
  display: inline-block;
  position: absolute;
  top: 42%;
  z-index: -1;
}
.card {
  margin-bottom: 2.2rem;
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.1);
  transition: all .3sease-in-out;
}
.card {
  position: relative;
  display: flex
;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border: 1px solid rgba(34, 41, 47, 0.125);
  border-radius: 0.5rem;
}
.main-menu.menu-light .navigation li.hover>a {
  padding-left: 25px;
  transition: padding 0.35sease 0s !important;
}
.main-menu.menu-light .navigation li a {
  color: #565656;
  padding: 10px 10px 10px 10px;
  line-height: 1.45;
  transition: padding 0.35sease 0s !important;
}
.table-hover-animation tbody tr:hover {
  transform: translateY(-4px);
}
.table-hover tbody tr:hover {
  color: #626262;
  background-color: rgba(34, 41, 47, 0.075);
}
.table-hover-animation tbody tr {
    transition: all 0.25s ease;
    background-color: #fff;
}
.btn-outline-primary {
  border: 1px solid #FC2B5A!important;
  background-color: transparent!important;
  color: #FC2B5A!important;
}
.btn-outline-primary:hover {
  background-color: rgba(115, 103, 240, 0.08)!important;
  color: #FC2B5A!important;
}
.btn[class*="btn-outline-"].btn-sm {
  padding-top: calc(0.5rem - 1px);
  padding-bottom: calc(0.5rem - 1px);
}
.bannerCan{
  width: 100%;
}
.bannerCan img {
  width: 100%;
  object-fit: contain;
  border-radius: 15px;
}
/* Media Queries for Mobile Responsiveness */
@media (max-width:1199.99px){
  #profile_status img {
    width: 60%;
}

}
@media (max-width: 991.98px) {
  .main-menu {
    transform: translateX(-100%);
  }
  
  .main-menu.expanded {
    transform: translateX(0);
  }}


  /* user profile section  */


    `
  }
</style>

<style>{
`
.form-control {
    padding: 0.6rem 0.7rem;
    height: 40px;
}
.card .card-header {
    display: flex
;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    border-bottom: none;
    padding: 1.5rem 1.5rem 0;
    background-color: transparent;
}
.card .card-header .card-title {
    margin-bottom: 0;
}
.card .card-title {
    font-size: 1rem !important;
    
}
.card .card-title {
    font-weight: 500;
    letter-spacing: 0.05rem;
    font-size: 1.32rem;
    margin-bottom: 0.5rem;
}
    .breadcrumb-item a {
    color: #FC2B5A;
        }
`
}</style>

          </div>
      
   </>

  )
}

export default CandidateDashboard
