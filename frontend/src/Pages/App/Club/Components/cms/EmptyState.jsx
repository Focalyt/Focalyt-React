import React from 'react';

export const EmptyState = ({ title, body, actions }) => (
  <div className="empty-state-box">
    <strong>{title}</strong>
    {body && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{body}</p>}
    {actions}
  </div>
);
