import React from 'react';
import { Navigate } from 'react-router-dom';

export const ClubRegister = () => (
  <Navigate to="/institute/login?returnUrl=/institute/club/dashboard" replace />
);

export default ClubRegister;
