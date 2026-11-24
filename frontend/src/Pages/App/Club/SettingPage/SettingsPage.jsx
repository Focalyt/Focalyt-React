import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Can } from '../Components/cms/Can';
import { useClub } from '../../../../contexts/ClubContext';
import { usePermission } from '../hooks/usePermission';
import { isPositionsFeatureEnabled } from '../../../../services/club/clubService';
import { normalizeClubTypes } from '../../../../config/club/labels';

export const SettingsPage = () => {
  const { state, setPositionsFeatureEnabled, setClubTypes } = useClub();
  const { can } = usePermission();
  const canManageClubTypes = can('settings.manage') || can('clubs.create') || can('clubs.edit');
  const featureEnabled = isPositionsFeatureEnabled(state);
  const savedTypes = useMemo(
    () => normalizeClubTypes(state.settings?.clubTypes || []),
    [state.settings?.clubTypes]
  );
  const [draftTypes, setDraftTypes] = useState(savedTypes);
  const [newType, setNewType] = useState('');
  const [typeError, setTypeError] = useState('');

  useEffect(() => {
    setDraftTypes(savedTypes);
  }, [savedTypes]);

  const persistTypes = (nextList) => {
    const next = normalizeClubTypes(nextList);
    setDraftTypes(next);
    setClubTypes(next);
    setTypeError('');
    return true;
  };

  const addType = () => {
    const value = String(newType || '').trim();
    if (!value) {
      setTypeError('Enter a club type name.');
      return;
    }
    if (draftTypes.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setTypeError('That type is already in the list.');
      return;
    }
    const next = [...draftTypes, value.slice(0, 60)];
    if (persistTypes(next)) {
      setNewType('');
    }
  };

  const removeType = (value) => {
    persistTypes(draftTypes.filter((item) => item !== value));
  };

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

      {canManageClubTypes ? (
        <div className="club-list-page__panel" style={{ marginTop: 16 }}>
          <h3>Club types</h3>
          <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
            Starts empty. Add the types your campus needs (for example Music or Debate). They appear in Create Club
            and student suggestions.
          </p>

          <div className="club-type-editor">
            <div className="club-type-editor__add">
              <input
                className="form-input"
                value={newType}
                placeholder="Type a new club type, then click Add"
                maxLength={60}
                onChange={(event) => {
                  setNewType(event.target.value);
                  if (typeError) setTypeError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addType();
                  }
                }}
              />
              <button type="button" className="fc-btn fc-btn-primary fc-btn-sm" onClick={addType}>
                <Plus size={14} /> Add type
              </button>
            </div>
            {typeError ? <span className="form-error">{typeError}</span> : null}

            {draftTypes.length === 0 ? (
              <p className="club-list-page__meta" style={{ marginTop: 12 }}>
                No club types yet. Add at least one before creating a club.
              </p>
            ) : (
              <ul className="club-type-editor__list" style={{ marginTop: 12 }}>
                {draftTypes.map((type) => (
                  <li key={type} className="club-type-editor__row">
                    <span>{type}</span>
                    <button
                      type="button"
                      className="fc-btn fc-btn-ghost fc-btn-sm"
                      onClick={() => removeType(type)}
                      title={`Remove ${type}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SettingsPage;
