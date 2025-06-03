import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  
  const [dashboardData, setDashboardData] = useState({
    // Candidates data
    weekCandidates: 0,
    monthCandidates: 0,
    totalCandidates: 0,
    dayCandidates: 0,
    
    // Shortlisted data
    weekShortlisted: 0,
    monthShortlisted: 0,
    totalShortlisted: 0,
    dayShortlisted: 0,
    
    // Hired data
    weekHired: 0,
    monthHired: 0,
    totalHired: 0,
    dayHired: 0,
    
    // Companies data
    weekCompanies: 0,
    monthCompanies: 0,
    totalCompanies: 0,
    dayCompanies: 0,
    
    // Jobs data
    weekJobs: 0,
    monthJobs: 0,
    totalJobs: 0,
    dayJobs: 0,
    
    // Applied Jobs data
    weekAppliedJobs: 0,
    monthAppliedJobs: 0,
    totalAppliedJobs: 0,
    dayAppliedJobs: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    console.log('userData',userData)
      const response = await axios.get(`${backendUrl}/college/dashboard`, {
        headers: { 'x-auth': token }
      });
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, bgClass, arrowImage, todayCount, wtd, mtd, at }) => (
    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-6 col-12">
      <div className="card">
        <h3 className="brder-blw pt-1 px-1">{title}</h3>
        <div className="col-xl-12">
          <div className="row">
            <div className="col-xl-7 col-lg-7 col-md-12 col-sm-12 col-12 my-auto">
              <div className="row">
                <div className="col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5">
                  <p className="font-weight-bold">WTD</p>
                  <p className="font-weight-bold">MTD</p>
                  <p className="font-weight-bold">AT</p>
                </div>
                <div className="col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7">
                  <p><a className="sm_btn">{wtd}</a></p>
                  <p><a className="sm_btn">{mtd}</a></p>
                  <p><a className="sm_btn">{at}</a></p>
                </div>
              </div>
            </div>
            <div className="col-xl-5 col-lg-5 col-md-12 col-sm-12 col-12">
              <div className={`highlight_data ${bgClass} text-center py-1 mt-1`}>
                <h2 className="text-white font-weight-bold">Today</h2>
                <h2 className="text-white font-weight-bold">{todayCount}</h2>
              </div>
              <a href="#">
                <img
                  src={`/Assets/public_assets/images/${arrowImage}`}
                  className="img-fluid click_img"
                  draggable="false"
                  alt="arrow"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
        <section>
          {/* Candidate Data */}
          <div className="row">
            <div className="col-xl-12">
              <h3 className="headd">Candidates</h3>
            </div>
            
            <StatCard
              title="Signups"
              bgClass="bg-one"
              arrowImage="bluearrow.png"
              todayCount={dashboardData.dayCandidates}
              wtd={dashboardData.weekCandidates}
              mtd={dashboardData.monthCandidates}
              at={dashboardData.totalCandidates}
            />

            <StatCard
              title="Shortlisted"
              bgClass="bg-two"
              arrowImage="orangearrow.png"
              todayCount={dashboardData.dayShortlisted}
              wtd={dashboardData.weekShortlisted}
              mtd={dashboardData.monthShortlisted}
              at={dashboardData.totalShortlisted}
            />

            <StatCard
              title="Hired"
              bgClass="bg-three"
              arrowImage="greenarrow.png"
              todayCount={dashboardData.dayHired}
              wtd={dashboardData.weekHired}
              mtd={dashboardData.monthHired}
              at={dashboardData.totalHired}
            />
          </div>

          {/* Companies Data */}
          <div className="row">
            <div className="col-xl-12">
              <h3 className="headd">Companies</h3>
            </div>
            
            <StatCard
              title="Signups"
              bgClass="bg-one"
              arrowImage="bluearrow.png"
              todayCount={dashboardData.dayCompanies}
              wtd={dashboardData.weekCompanies}
              mtd={dashboardData.monthCompanies}
              at={dashboardData.totalCompanies}
            />

            <StatCard
              title="JD's"
              bgClass="bg-two"
              arrowImage="orangearrow.png"
              todayCount={dashboardData.dayJobs}
              wtd={dashboardData.weekJobs}
              mtd={dashboardData.monthJobs}
              at={dashboardData.totalJobs}
            />

            <StatCard
              title="Shortlisted"
              bgClass="bg-three"
              arrowImage="greenarrow.png"
              todayCount={dashboardData.dayShortlisted}
              wtd={dashboardData.weekShortlisted}
              mtd={dashboardData.monthShortlisted}
              at={dashboardData.totalShortlisted}
            />

            <StatCard
              title="Hired"
              bgClass="bg-four"
              arrowImage="brownarrow.png"
              todayCount={dashboardData.dayHired}
              wtd={dashboardData.weekHired}
              mtd={dashboardData.monthHired}
              at={dashboardData.totalHired}
            />

            <StatCard
              title="Applied Jobs"
              bgClass="bg-three"
              arrowImage="greenarrow.png"
              todayCount={dashboardData.dayAppliedJobs}
              wtd={dashboardData.weekAppliedJobs}
              mtd={dashboardData.monthAppliedJobs}
              at={dashboardData.totalAppliedJobs}
            />
          </div>
        </section>
      
    </>
  );
};

export default Dashboard;


