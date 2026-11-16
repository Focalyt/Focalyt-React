import React from 'react';

export const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div className="section-header">
    <div>
      {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
      <h1 className="section-title">{title}</h1>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="cms-header-actions">{actions}</div>}
  </div>
);
