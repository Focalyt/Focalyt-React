import React from 'react';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';
import { isPositionsFeatureEnabled } from '../../../../services/club/clubService';

export const SettingsPage = () => {
  const { state, setPositionsFeatureEnabled } = useClub();
  const featureEnabled = isPositionsFeatureEnabled(state);

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Settings</h1>
          <p>Each campus has its own clubs and staff. Control student-facing features for this campus.</p>
        </div>
      </div>

      <Can permission="positions.manageFeature">
        <div className="club-list-page__panel">
          <h3>Club positions</h3>
          <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
            Turning this off hides student requests. Saved roles stay in Positions.
          </p>
          <button
            type="button"
            className={`fc-btn fc-btn-sm ${featureEnabled ? 'fc-btn-outline' : 'fc-btn-primary'}`}
            onClick={() => setPositionsFeatureEnabled(!featureEnabled)}
          >
            {featureEnabled ? 'Disable for students' : 'Enable for students'}
          </button>
        </div>
      </Can>
    </div>
  );
};

export default SettingsPage;
