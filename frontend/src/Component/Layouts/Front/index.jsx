import React, { useEffect } from 'react'
import FrontHeader from './FrontHeader/FrontHeader';
import FrontFooter from './FrontFooter/FrontFooter';
import PartnerWithUsModal from './PartnerWithUsModal/PartnerWithUsModal';
import { useLocation } from 'react-router-dom';

const FrontLayout = ({ children }) => {
  const location = useLocation();
  const hideFooter = location.pathname === "/community";

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  return (
    <div className="min-h-screen flex flex-col">
      <FrontHeader/>
      
      <main className="">
        {children}
      </main>
      {/* <FrontFooter /> */}
      {!hideFooter && <FrontFooter />}
      <PartnerWithUsModal />

      <style>
        {
          `
          @media (max-width: 991px) {
            main {
              overflow-x: hidden;
            }
          }
          @media (max-width: 768px) {
            .images {
              gap: 10px;
            }
          }
          `
        }
      </style>
    </div>
    
  );
};

export default FrontLayout
