

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../src/Pages/Front/HomePage/HomePage';
import FrontHeader from './Component/Layouts/Front/FrontHeader/FrontHeader';
import FrontFooter from './Component/Layouts/Front/FrontFooter/FrontFooter';
import About from './Pages/Front/About/About';
import Labs from "./Pages/Front/Labs/Labs";
import Course from './Pages/Front/Courses/Course';
import Jobs from './Pages/Front/Jobs/Jobs';
import Contact from './Pages/Front/Contact/Contact';
import CourseDetails from './Pages/Front/CourseDetails/CourseDetails';
import "./App.css";
import CompanyLogin from './Component/Layouts/App/Company/CompanyLogin';
import Community from './Pages/Front/Community/Community';
import MetaPixel from './Component/MetaPixel';

const Layout = () => {
  const location = useLocation(); 

  return (
    <>
    <MetaPixel /> {/* ✅ Ye Pixel Tracking Start Karega */}
      <FrontHeader />
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
      </Routes>


      {location.pathname !== "/community" && <FrontFooter />}
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
