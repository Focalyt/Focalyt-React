import React from 'react';
import { Link } from 'react-router-dom';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';

export const AssignExecutivesCard = () => {
  const { getClubPath } = useClub();
  return (
    <Can permission="staff.assign">
      <div className="club-list-page__panel">
        <h3>SSE / SE permissions</h3>
        <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
          SSE and SE are permission ticks on company people, not new logins.
        </p>
        <Link to={getClubPath('staff')} className="fc-btn fc-btn-primary fc-btn-sm">
          Open permissions
        </Link>
      </div>
    </Can>
  );
};

export default AssignExecutivesCard;
