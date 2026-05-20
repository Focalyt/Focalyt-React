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

      <style>
        {
          `
          @media (max-width: 991px) {
            main {
              overflow-x: hidden;
              padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
            }
            .foc-cyber-home {
              padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
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
