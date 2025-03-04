
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../src/Pages/Front/HomePage/HomePage';
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
import SearchCourses from "./Pages/App/Candidate/CandidateCourses/CandidateCourses"
import AppliedCourses from './Pages/App/Candidate/CandidateCourses/AppliedCourses';
import CandidatesJobs from './Pages/App/Candidate/CandidatesJobs/CandidatesJobs';
import NearbyJobs from './Pages/App/Candidate/CandidatesJobs/NearByJobs';
import CandidateAppliedJobs from './Pages/App/Candidate/CandidatesJobs/CandidateAppliesJobs';
import CourseDetail from "./Pages/App/Candidate/CandidateCourses/CourseDetails"
import CandidateWallet from './Component/Layouts/App/Candidates/CandidateWallet/CandidateWallet';
import CandidateEarning from './Pages/App/Candidate/CandidateEarning/CandidateEarning';
import ReferAndEarn from './Pages/App/Candidate/CandidateEarning/ReferAndEarn';
import CoinsPage from './Pages/App/Candidate/CandidateEarning/CoinsPage';
import LoanApplicationPage from "./Pages/App/Candidate/CandidateEarning/LoanApplicationPage";
import WatchVideosPage from './Component/Layouts/App/Candidates/CandidateVideo/WatchVideosPage';
import CandidateShare from './Pages/App/Candidate/CandidateShare/CandidateShare';
import CandidateNotification from './Pages/App/Candidate/CandidateNotification/CandidateNotification';
import RegisterForInterview from './Pages/App/Candidate/CandidatesJobs/RegisterForInterview';
import Shortlisting from './Pages/App/Candidate/CandidatesJobs/Shortlisting';
const Layout = () => {
  const location = useLocation(); 

  return (
    <>
      {/* <FrontHeader /> */}
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/about" element={<About />} />
        <Route exact path="/labs" element={<Labs />} />
        <Route exact path="/courses" element={<Course />} />
        <Route exact path="/joblisting" element={<Jobs />} />
        <Route exact path="/contact" element={<Contact />} />
        <Route exact path="/coursedetails/:courseId" element={<CourseDetails />} />
        <Route exact path="/company/login" element={<CompanyLogin />} />
        <Route exact path="/community" element={<Community />} />

        {/* Candidate Parent Route */}
        <Route path="/candidate" element={<CandidateLayout />}>
                <Route path="dashboard" element={<CandidateDashboard />} />
                <Route path ="myprofile" element={<CandidateProfile/>}/>
                <Route path ="document" element={<CandidatesDocuments/>}/>
                <Route path ="searchcourses" element={<SearchCourses/>}/>
                <Route path="appliedCourses" element={<AppliedCourses/>}/>
                <Route path ="searchjob" element={<CandidatesJobs/>}/>
                <Route path ="nearbyJobs" element={<NearbyJobs/>}/>
                <Route path ="appliedJobs" element={<CandidateAppliedJobs/>}/>
                <Route path ="cashback" element={<CandidateWallet/>}/>
                <Route path ="myEarnings" element={<CandidateEarning/>}/>
                <Route path ="referral" element={<ReferAndEarn/>}/>
                <Route path = "Coins" element={<CoinsPage/>}/>
                <Route path = "requestLoan" element={<LoanApplicationPage/>}/>
                <Route path ="watchVideos" element={<WatchVideosPage/>}/>
                <Route path = "shareCV" element={<CandidateShare/>}/>
                <Route path ="notifications" element={<CandidateNotification/>}/>
                <Route path ="registerInterviewsList" element={<RegisterForInterview/>}/>
                <Route path='InterestedCompanies' element={<Shortlisting/>}/>
                {/* <Route path="course" element={<CourseDetail/>}/> */}
                <Route path="/candidate/course/:courseId" element={<CourseDetails />} />
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
