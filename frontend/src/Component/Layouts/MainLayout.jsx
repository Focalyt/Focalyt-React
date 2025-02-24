// src/Component/Layouts/MainLayout.jsx
import React from 'react';
import FrontHeader from './Front/FrontHeader/FrontHeader';
import FrontFooter from './Front/FrontFooter/FrontFooter';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const location = useLocation();
  
  // Check if current path should exclude header/footer
  const isAuthPage = location.pathname.includes('/company/login') || 
                     location.pathname.includes('/admin') ||
                     location.pathname.includes('/candidate/login');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <FrontHeader />
      <main className="flex-grow">
        {children}
      </main>
      <FrontFooter />
    </div>
  );
};

export default MainLayout;