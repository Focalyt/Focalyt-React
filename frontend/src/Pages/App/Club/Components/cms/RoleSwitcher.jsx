import React from 'react';
import { DEMO_STAFF_ROLE_OPTIONS } from '../../../../../config/club/roles';
import { useClub } from '../../../../../contexts/ClubContext';

export const RoleSwitcher = () => {
  const { activeRole, setDemoRole } = useClub();

  return (
    <div className="demo-view-control" aria-label="Demo role selector">
      <span className="demo-view-label">Demo role:</span>
      <div className="demo-switch-group" role="group">
        {DEMO_STAFF_ROLE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`demo-switch-btn ${activeRole === option.id ? 'active' : ''}`}
            onClick={() => setDemoRole(option.id)}
            aria-pressed={activeRole === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
