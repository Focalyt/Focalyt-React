import React from 'react'
import FrontHeader from './FrontHeader/FrontHeader';
import FrontFooter from './FrontFooter/FrontFooter';
import { useLocation } from 'react-router-dom';

const FrontLayout = ({ children }) => {
  const location = useLocation();
  const hideFooter = location.pathname === "/community";
  return (
    <div className="min-h-screen flex flex-col">
      <FrontHeader/>
      
      <main className="">
        {children}
      </main>
      {/* <FrontFooter /> */}
      {!hideFooter && <FrontFooter />}
    </div>
    
  );
};

export default FrontLayout
