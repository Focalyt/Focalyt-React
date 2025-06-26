
import React from 'react';  // This must be first
import { useState,useEffect } from 'react';

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from '../src/Pages/Front/HomePage/HomePage';

// import About from './Pages/Front/About/About';
import About from './Pages/Front/About/About';
import Labs from "./Pages/Front/Labs/Labs";
import Course from './Pages/Front/Courses/Course';
import Jobs from './Pages/Front/Jobs/Jobs';
import Contact from './Pages/Front/Contact/Contact';
import CourseDetails from './Pages/Front/CourseDetails/CourseDetails';
import EmployersTermsofService from './Pages/Front/EmpTerms/EmpTerms';
import UserAgreement from './Pages/Front/UserAgreement/UserAgreement';
import "./App.css";
// import CompanyLogin from './Component/Layouts/App/Company/CompanyLogin';
import Community from './Pages/Front/Community/Community';
import CandidateLayout from './Component/Layouts/App/Candidates';
import CandidateDashboard from './Pages/App/Candidate/Dashboard/CandidateDashboard';
import CandidateProfile from './Pages/App/Candidate/Profile/CandidateProfile';
import Resume from './Pages/App/Candidate/Profile/Resume';
import CandidatesDocuments from "./Pages/App/Candidate/Documents/CandidateDocumets"
import SearchCourses from "./Pages/App/Candidate/Courses/SearchCourses"
import AppliedCourses from './Pages/App/Candidate/Courses/AppliedCourses';
import CandidatesJobs from './Pages/App/Candidate/Jobs/CandidatesJobs';
import NearbyJobs from './Pages/App/Candidate/Jobs/NearByJobs';
import CandidateAppliedJobs from './Pages/App/Candidate/Jobs/CandidateAppliesJobs';
import SearchCourseDetail from "./Pages/App/Candidate/Courses/SearchCourseDetail"
import CandidateWallet from './Pages/App/Candidate/Wallet/CandidateWallet';
import CandidateEarning from './Pages/App/Candidate/Earning/CandidateEarning';
import ReferAndEarn from './Pages/App/Candidate/Earning/ReferAndEarn';
import CoinsPage from './Pages/App/Candidate/Earning/CoinsPage';
import LoanApplicationPage from "./Pages/App/Candidate/Earning/LoanApplicationPage";
import WatchVideosPage from './Pages/App/Candidate/Video/WatchVideosPage';
import CandidateShare from './Pages/App/Candidate/Share/CandidateShare';
import CandidateNotification from './Pages/App/Candidate/Notification/CandidateNotification';
import RegisterForInterview from './Pages/App/Candidate/Jobs/RegisterForInterview';
import Shortlisting from './Pages/App/Candidate/Jobs/Shortlisting';
import SocialImpact from './Pages/Front/SocialImpact/SocialImpact';
import StuLabs from './Pages/Front/Labs/StuLabs';
import Event from './Pages/Front/Event/Event';
import AdminLayout from './Component/Layouts/Admin';
import CandidateLogin from './Pages/App/Candidate/Login/CandidateLogin';
import CandidateViewJobs from './Pages/App/Candidate/Jobs/CandidateViewJobs';
import RequiredDocuments from './Pages/App/Candidate/RequiredDocuments/RequiredDocuments';
import PaymentDetails from './Pages/App/Candidate/PaymentsDetails/PaymentDetails';
import CandidatesEvents from './Pages/App/Candidate/Events/CandidatesEvents';
import Registration from './Pages/Front/StudentRegistration/Registration';
import CollegeLayout from './Component/Layouts/App/College';
import CollegeLogin from './Pages/App/College/Login/CollegeLogin';
import CollegeRegister from './Pages/App/College/Register/CollegeRegister';
import Dashboard from './Pages/App/College/Dashboard/Dashboard';
import Profile from './Pages/App/College/Profile/Profile';
import UploadCandidates from './Pages/App/College/UploadCandidates/UploadCandidates';
import UploadTemplates from './Pages/App/College/UploadTemplates/UploadTemplates';
import MyStudents from './Pages/App/College/MyStudents/MyStudents';
import AvailableJobs from './Pages/App/College/AvailableJobs/AvailableJobs';
import AppliedEvents from './Pages/App/Candidate/Events/AppliedEvents';
import CandidateManagementPortal from './Pages/App/College/CandidateManagementPortal/CandidateManagementPortal';
import ProjectManagement from './Component/Layouts/App/College/ProjectManagement/Project';
import CenterManagement from './Component/Layouts/App/College/ProjectManagement/Center';
import CourseManagement from './Component/Layouts/App/College/ProjectManagement/Course';
import BatchManagement from './Component/Layouts/App/College/ProjectManagement/Batch';
import StudentManagement from './Component/Layouts/App/College/ProjectManagement copy/Student';
import CandidateManagementPortal_old from './Pages/App/College/CandidateManagementPortal/CandidateManagementPortal_copy';
import AddCourse from './Pages/App/College/Course/AddCourse';
import ViewCourses from './Pages/App/College/Course/ViewCourse';
import EditCourse from './Pages/App/College/Course/EditCourse';
import Registrations from './Pages/App/College/Course/Registrations';
import AdmissionPost from './Pages/App/College/Course/AdmissionPost';
import AccessManagement from './Pages/App/College/Settings/AccessManagement';
import ClgCourse from './Pages/App/College/Settings/Course';
import ApprovalManagement from './Pages/App/College/ApprovalManagement/ApprovalManagement';
import Status from './Pages/App/College/Status/status';
import MyFollowup from './Pages/App/College/MyFollowup/MyFollowup';
import AddLeads from './Pages/App/College/Course/AddLeads';


import CompanyLayout from './Component/Layouts/App/Company';
import CompanyLogin from './Pages/App/Company/CompanyLogin/CompanyLogin';
import CompanyRegister from './Pages/App/Company/CompanyRegister/CompanyRegister';
import CompanyDashboard from './Pages/App/Company/CompanyDashboard/CompanyDashboard';
import CompanyProfile from './Pages/App/Company/CompanyProfile/CompanyProfile';
import Notification from './Pages/App/Company/Notification/Notification';
import AllJd from './Pages/App/Company/Jobs/AllJd';
import OngoingHiring from './Pages/App/Company/Hirings/OnGoingHiring';
import ShortListedCandidate from './Pages/App/Company/Candidate/ShortListedCandidate';
import AddJd from './Pages/App/Company/Jobs/AddJd';
import Coins from './Pages/App/Company/Coins/MyPieCoins';
// import EditJob from './Pages/App/Company/Jobs/editJob';
import ViewJd from './Pages/App/Company/Jobs/ViewJd';
import IntCandiate from './Pages/App/Company/Candidate/IntrestedCandidates';
import ListCandidate from './Pages/App/Company/Candidate/ListCandidate';
import NearByCandidate from './Pages/App/Company/Candidate/NearByCandidate';
import Batch from './Component/Layouts/App/College/ProjectManagement/Student';
import RegistrationCards from './Component/Layouts/App/College/RegistrationCards/RegistrationCards';
import ResumeTest from './Pages/Front/Resume/Resume';
import AttendanceManagement from './Component/Layouts/App/College/ProjectManagement/AttendanceManagement'
import Student from './Component/Layouts/App/College/ProjectManagement copy/Student';
const Layout = () => {
  const location = useLocation();
  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
  
    const getFbclid = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('fbclid');
    };
  
    const fbp = getCookie('_fbp');
    const fbcCookie = getCookie('_fbc');
    const fbclid = getFbclid();
  
    const fbcGenerated = fbclid ? `fb.1.${Date.now()}.${fbclid}` : null;
  
    if (fbp && !sessionStorage.getItem('_fbp')) {
      sessionStorage.setItem('_fbp', fbp);
    }
  
    if ((fbcCookie || fbcGenerated) && !sessionStorage.getItem('_fbc')) {
      sessionStorage.setItem('_fbc', fbcCookie || fbcGenerated);
    }
  }, []);

  

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
        <Route path="/studentRegistration" element={<Registration />} />
        <Route path="/Resumetest" element={<ResumeTest/>}/>
        <Route path="/employersTermsofService" element={<EmployersTermsofService/>}/>
        <Route path="/userAgreement" element={<UserAgreement/>}/>
        {/* Candidate Parent Route */}
        <Route path="/candidate/login" element={<CandidateLogin />} />
        <Route path="/candidate" element={<CandidateLayout />}>

          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="myprofile" element={<CandidateProfile />} />
          <Route path="document" element={<CandidatesDocuments />} />
          <Route path="resume" element={<Resume />} />
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
          <Route path="job/:JobId" element={<CandidateViewJobs />} />
          <Route path="reqDocs/:courseId" element={<RequiredDocuments />} />
          <Route path="pendingFee" element={<PaymentDetails />} />
          <Route path='candidateevent' element={<CandidatesEvents />} />
          <Route path='appliedevents' element={<AppliedEvents/>}/>
        </Route>
        <Route path='/admin' element={<AdminLayout />}>

        </Route>

        {/*  college views  */}

        <Route path="/institute/login" element={<CollegeLogin />} />
        <Route path="/institute/register" element={<CollegeRegister />} />
        {/* CollegeLayout will wrap only protected pages */}
        <Route path="/institute" element={<CollegeLayout  />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="myprofile" element={<Profile/>}/>
          <Route path="uploadCandidates" element={<UploadCandidates/>}/>
          <Route path="uploadTemplates" element={<UploadTemplates/>}/>
          <Route path="myStudents" element={<MyStudents/>}/>
          <Route path="availablejobs" element={<AvailableJobs/>}/>
          <Route path="candidatemanagment" element={<CandidateManagementPortal/>}/>
          <Route path="candidatemanagment/:verticalName/:verticalId" element={<ProjectManagement/>}/>
          <Route path="candidatemanagment/:verticalName/:verticalId/project/:projectName/:projectId" element={<CenterManagement/>}/>
          <Route path="candidatemanagment/:verticalName/:verticalId/:projectName/:projectId/center/:centerName/:centerId" element={<CourseManagement/>}/>
          <Route path="candidatemanagment/:verticalName/:verticalId/:projectName/:projectId/:centerName/:centerId/course/:courseName/:courseId" element={<BatchManagement/>}/>
          <Route path="candidatemanagment/:verticalName/:verticalId/:projectName/:projectId/:centerName/:centerId/:courseName/:courseId/batch/:batchName/:batchId" element={<StudentManagement/>}/>
          <Route path='addcourse' element={<AddCourse/>}/>
          <Route path='viewcourse' element={<ViewCourses/>}/>
          <Route path='registration' element={<Registrations/>}/>
          <Route path='admissionpost' element={<AdmissionPost/>}/>
          {/* <Route path='editcourse' element={<EditCourse/>}/> */}
          <Route path="institute/courses/edit/:id" element={<EditCourse />} />
          <Route path="courses/edit/:id" element={<EditCourse />} />
          <Route path='accessManagement' element={<AccessManagement/>}/>
          <Route path='candidatemanagment_old' element={<CandidateManagementPortal_old/>}/>
          <Route path='approvalManagement' element={<ApprovalManagement/>}/>
          <Route path='statusdesign' element={<Status/>}/>
          <Route path = 'myfollowup' element={<MyFollowup/>}/>
          <Route path='registrationcards' element={<RegistrationCards/>}/>
          {/* <Route path = 'addleads' element={<AddLeads/>}/> */}
          <Route path="/institute/viewcourse/:courseId/candidate/addleads" element={<AddLeads />} />
          <Route path='batch' element={<Batch/>}/>
          <Route path='attendance' element={<AttendanceManagement/>}/>
        </Route>

        {/* company  */}

        <Route path="/company/login" element={<CompanyLogin />} />
        <Route path="/company/register" element={<CompanyRegister />} />
       
        <Route path="/company" element={<CompanyLayout />}>
        <Route path="dashboard" element={<CompanyDashboard />} />
        <Route path="myProfile" element={<CompanyProfile />} /> 
        <Route path="list/jobs" element={<AllJd />} />
        <Route path="shortlisted" element={<ShortListedCandidate />} />
        <Route path="onGoingHiring" element={<OngoingHiring />} />
        <Route path="candidate/:candidateId" element={<CandidateProfile />} />
        
        <Route path="addjobs" element={<AddJd />} />
        {/* <Route path="editJob/:jobId" element={<editJob />} /> */}
        <Route path="viewJob/:jobId" element={<ViewJd />} />
        <Route path="interested-candidates" element ={<IntCandiate/>}/>
        <Route path='notifications' element={<Notification/>}/>
        <Route path="list-candidates" element={<ListCandidate/>}/>
        <Route path="nearbyCandidates" element={<NearByCandidate/>}/>
        <Route path="Coins" element={<Coins/>}/>
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
