import React, { useEffect, useState } from 'react';
import { PageHeader } from '../Components/cms/PageHeader';
import { DataTable } from '../Components/cms/DataTable';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { isPositionsFeatureEnabled } from '../../../../services/club/clubService';

export const PositionsStudentPage = () => {
  const { state, requestPosition } = useClub();
  const [note, setNote] = useState('');
  const featureEnabled = isPositionsFeatureEnabled(state);
  const openPositions = state.positions.filter((p) => p.status === 'Open');
  const [positionId, setPositionId] = useState(openPositions[0]?.id || '');

  useEffect(() => {
    if (!openPositions.some((p) => p.id === positionId)) {
      setPositionId(openPositions[0]?.id || '');
    }
  }, [openPositions, positionId]);

  const clubName = (id) => state.clubs.find((c) => c.id === id)?.name || 'Club';
  const posTitle = (id) => state.positions.find((p) => p.id === id)?.title || 'Position';

  const mine = state.positionRequests.filter((r) => r.studentId === state.currentStudent.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!featureEnabled) return;
    const position = state.positions.find((p) => p.id === positionId);
    if (!position) return;
    requestPosition({ positionId: position.id, clubId: position.clubId, note });
    setNote('');
  };

  return (
    <div className="section-white" style={{ paddingTop: 28 }}>
      <div className="club-container">
        <PageHeader
          eyebrow="Positions"
          title="Request a club role"
          subtitle="Ask to host sessions or lead a sprint. Club Admin will Approve or Reject — this is only a request."
        />
        {!featureEnabled ? (
          <div className="empty-state-box" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.08rem' }}>Club positions are not open right now</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 440 }}>
              The Club Administrator has turned off role requests. You can still see the status of any request you already sent.
            </p>
          </div>
        ) : (
          <form className="form-card" onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="pos-select">Open position</label>
                <select
                  id="pos-select"
                  className="form-select"
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                >
                  {openPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {clubName(p.clubId)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="pos-note">Why you</label>
                <input
                  id="pos-note"
                  className="form-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short note to the coordinator"
                />
              </div>
            </div>
            <button
              type="submit"
              className="fc-btn fc-btn-primary"
              style={{ marginTop: 16 }}
              disabled={openPositions.length === 0}
            >
              Request position
            </button>
          </form>
        )}
        <DataTable
          emptyTitle="No position requests yet"
          emptyBody="Request an open role when the feature is available."
          columns={[
            { key: 'position', label: 'Position', render: (r) => posTitle(r.positionId) },
            { key: 'club', label: 'Club', render: (r) => clubName(r.clubId) },
            { key: 'requestedAt', label: 'Requested' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={mine}
        />
      </div>
    </div>
  );
};

export default PositionsStudentPage;
