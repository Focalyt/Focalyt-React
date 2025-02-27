import React from 'react'
import FrontHeader from './FrontHeader/FrontHeader';
import FrontFooter from './FrontFooter/FrontFooter';

const FrontLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <FrontHeader />
      <main className="">
        {children}
      </main>
      <FrontFooter />
    </div>
    
  );
};

export default FrontLayout
