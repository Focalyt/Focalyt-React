import React from 'react';

export const StatCard = ({ label, value, hint }) => (
  <div className="myspace-stat-box cms-stat-card">
    <div className="cms-stat-value">{value}</div>
    <div className="cms-stat-label">{label}</div>
    {hint && <div className="cms-stat-hint">{hint}</div>}
  </div>
);
