import React from 'react';

const Logo = () => {
    const logoUrl = "/Assets/images/logo/logo.png";
    
    return (
        <div className="logo-container">
            <img src={logoUrl} alt="Focalyt Logo" className="logo" />
        </div>
    );
};

export default Logo; 