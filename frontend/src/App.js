
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../src/Pages/Front/HomePage/HomePage';
// import About from './Pages/Front/About/About';
import About from './Pages/Front/About/About';
import Labs from "./Pages/Front/Labs/Labs";
import Course from './Pages/Front/Courses/Course';
import Jobs from './Pages/Front/Jobs/Jobs';
import Contact from './Pages/Front/Contact/Contact';
import CourseDetails from './Pages/Front/CourseDetails/CourseDetails';
import "./App.css";
import CompanyLogin from './Component/Layouts/App/Company/CompanyLogin';
import Community from './Pages/Front/Community/Community';
import CandidateLayout from './Component/Layouts/App/Candidates';
import CandidateDashboard from './Pages/App/Candidate/CandidateDashboard/CandidateDashboard';
import CandidateProfile from './Pages/App/Candidate/CandidateProfile/CandidateProfile';
import CandidatesDocuments from "./Pages/App/Candidate/CandidateDocuments/CandidateDocumets"
import SearchCourses from "./Pages/App/Candidate/CandidateCourses/SearchCourses"
import AppliedCourses from './Pages/App/Candidate/CandidateCourses/AppliedCourses';
import CandidatesJobs from './Pages/App/Candidate/CandidatesJobs/CandidatesJobs';
import NearbyJobs from './Pages/App/Candidate/CandidatesJobs/NearByJobs';
import CandidateAppliedJobs from './Pages/App/Candidate/CandidatesJobs/CandidateAppliesJobs';
import SearchCourseDetail from "./Pages/App/Candidate/CandidateCourses/SearchCourseDetail"
import CandidateWallet from './Pages/App/Candidate/CandidateWallet/CandidateWallet';
import CandidateEarning from './Pages/App/Candidate/CandidateEarning/CandidateEarning';
import ReferAndEarn from './Pages/App/Candidate/CandidateEarning/ReferAndEarn';
import CoinsPage from './Pages/App/Candidate/CandidateEarning/CoinsPage';
import LoanApplicationPage from "./Pages/App/Candidate/CandidateEarning/LoanApplicationPage";
import WatchVideosPage from './Pages/App/Candidate/CandidateVideo/WatchVideosPage';
import CandidateShare from './Pages/App/Candidate/CandidateShare/CandidateShare';
import CandidateNotification from './Pages/App/Candidate/CandidateNotification/CandidateNotification';
import RegisterForInterview from './Pages/App/Candidate/CandidatesJobs/RegisterForInterview';
import Shortlisting from './Pages/App/Candidate/CandidatesJobs/Shortlisting';
import SocialImpact from './Pages/Front/SocialImpact/SocialImpact';
import StuLabs from './Pages/Front/Labs/StuLabs';
import Event from './Pages/Front/Event/Event';
import AdminLayout from './Component/Layouts/Admin';
import CandidateLogin from './Pages/App/Candidate/CandidateLogin/CandidateLogin';
import CandidateViewJobs from './Pages/App/Candidate/CandidatesJobs/CandidateViewJobs';
import RequiredDocuments from './Pages/App/Candidate/RequiredDocuments/RequiredDocuments';
import PaymentDetails from './Pages/App/Candidate/PaymentsDetails/PaymentDetails';
import CandidateNewProfile from './Pages/App/Candidate/CandidateProfile/CandidateNewProfile';
const Layout = () => {
  const location = useLocation();

  return (
    <>
      {/* <FrontHeader /> */}
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/about" element={<About />} />
        {/* <Route exact path="/about_us" element={<About />} /> */}
        <Route exact path="/labs" element={<Labs />} />
        <Route exact path="/courses" element={<Course />} />
        <Route exact path="/joblisting" element={<Jobs />} />
        <Route exact path="/contact" element={<Contact />} />
        <Route exact path="/coursedetails/:courseId" element={<CourseDetails />} />
        <Route exact path="/company/login" element={<CompanyLogin />} />
        <Route exact path="/community" element={<Community />} />
        <Route path="/socialimpact" element={<SocialImpact />} />
        <Route path="/stulabs" element={<StuLabs />} />
        <Route path="/events" element={<Event />} />

        {/* Candidate Parent Route */}
        <Route path ="/candidate/login" element={<CandidateLogin/>}/>
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="myprofile" element={<CandidateProfile />} />
          <Route path="document" element={<CandidatesDocuments />} />
          <Route path="searchcourses" element={<SearchCourses />} />
          <Route path="appliedCourses" element={<AppliedCourses />} />
          <Route path="searchjob" element={<CandidatesJobs />} />
          <Route path="nearbyJobs" element={<NearbyJobs />} />
          <Route path="appliedJobs" element={<CandidateAppliedJobs />} />
          <Route path="cashback" element={<CandidateWallet />} />
          <Route path="myEarnings" element={<CandidateEarning />} />
          <Route path="referral" element={<ReferAndEarn />} />
          <Route path="Coins" element={<CoinsPage />} />
          <Route path="requestLoan" element={<LoanApplicationPage />} />
          <Route path="watchVideos" element={<WatchVideosPage />} />
          <Route path="shareCV" element={<CandidateShare />} />
          <Route path="notifications" element={<CandidateNotification />} />
          <Route path="registerInterviewsList" element={<RegisterForInterview />} />
          <Route path='InterestedCompanies' element={<Shortlisting />} />
          {/* <Route path="course" element={<CourseDetail/>}/> */}
          <Route path="course/:courseId" element={<SearchCourseDetail />} />
          <Route path="job/:JobId" element={<CandidateViewJobs/>}/>
          <Route path="reqDocs/:courseId" element={<RequiredDocuments/>}/>
          <Route path="pendingFee" element={<PaymentDetails/>}/>
          <Route path ='userProfile' element={<CandidateNewProfile/>}/>
        </Route>
        <Route path='/admin' element ={<AdminLayout/>}>
        
        </Route>
      </Routes>


    </>
  );
};

const App = () => {
  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
