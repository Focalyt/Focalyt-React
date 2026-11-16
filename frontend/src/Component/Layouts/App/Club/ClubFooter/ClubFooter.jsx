import React from 'react';

function ClubFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      COPYRIGHT © {currentYear} Focalyt, All rights Reserved
    </>
  );
}

export default ClubFooter;
