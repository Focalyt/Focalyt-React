import React from 'react';
import { Navigate } from 'react-router-dom';

export const ClubLogin = () => (
  <Navigate to="/institute/login?returnUrl=/institute/club/dashboard" replace />
);

export default ClubLogin;
