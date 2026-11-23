import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../Components/cms/PageHeader';
import { DataTable } from '../Components/cms/DataTable';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { useClub } from '../../../../contexts/ClubContext';
import { isApprovedMemberStatus } from '../../../../config/club/membership';
import { isPositionsFeatureEnabled } from '../../../../services/club/clubService';

export const PositionsStudentPage = () => {
  const { state, requestPosition, getClubPath, getMembershipStatus } = useClub();
  const [note, setNote] = useState('');
  const featureEnabled = isPositionsFeatureEnabled(state);

  const approvedClubIds = useMemo(() => {
    const ids = new Set();
    (state.clubs || []).forEach((club) => {
      const status = getMembershipStatus ? getMembershipStatus(club.id) : null;
      if (status && isApprovedMemberStatus(status)) {
        ids.add(String(club.id));
        return;
      }
      const mine = (club.members || []).find(
        (member) => String(member.studentId) === String(state.currentStudent?.id)
      );
      if (mine && isApprovedMemberStatus(mine.status)) ids.add(String(club.id));
    });
    return ids;
  }, [state.clubs, state.currentStudent?.id, getMembershipStatus]);

  const openPositions = useMemo(
    () =>
      (state.positions || []).filter(
        (position) =>
          position.status !== 'Filled' &&
          approvedClubIds.has(String(position.clubId)) &&
          (Number(position.filledSeats) || (position.holders || []).length) <
            Math.max(1, Number(position.seats) || 1)
      ),
    [state.positions, approvedClubIds]
  );

  const [positionId, setPositionId] = useState(openPositions[0]?.id || '');

  useEffect(() => {
    if (!openPositions.some((p) => p.id === positionId)) {
      setPositionId(openPositions[0]?.id || '');
    }
  }, [openPositions, positionId]);

  const clubName = (id) => state.clubs.find((c) => c.id === id)?.name || 'Club';
  const posTitle = (id) => state.positions.find((p) => p.id === id)?.title || 'Position';
  const selected = state.positions.find((p) => p.id === positionId);

  const mine = (state.positionRequests || []).filter(
    (r) => String(r.studentId) === String(state.currentStudent?.id)
  );

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
          subtitle="Only after you are an approved member. Status goes Pending → Recommended → Assigned or Rejected."
        />

        {approvedClubIds.size === 0 ? (
          <div className="empty-state-box" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.08rem' }}>Join a club first</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 440 }}>
              Position requests are only for approved members. Browse clubs, request to join, then come back once
              Club Admin approves you.
            </p>
            <Link className="fc-btn fc-btn-primary fc-btn-sm" to={getClubPath('clubs')} style={{ marginTop: 12 }}>
              Browse clubs
            </Link>
          </div>
        ) : !featureEnabled ? (
          <div className="empty-state-box" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.08rem' }}>Club positions are not open right now</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 440 }}>
              The Club Administrator has turned off role requests. You can still see the status of any request you
              already sent.
            </p>
          </div>
        ) : (
          <form className="form-card" onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="pos-select">
                  Open position
                </label>
                <select
                  id="pos-select"
                  className="form-select"
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                >
                  {openPositions.length === 0 ? (
                    <option value="">No open roles in your clubs</option>
                  ) : (
                    openPositions.map((p) => {
                      const filled = Number(p.filledSeats) || (p.holders || []).length;
                      const seats = Math.max(1, Number(p.seats) || 1);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.title} — {clubName(p.clubId)} ({filled}/{seats}
                          {p.termLabel ? ` · ${p.termLabel}` : ''})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="pos-note">
                  Why you
                </label>
                <input
                  id="pos-note"
                  className="form-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short note for Club Admin"
                />
              </div>
            </div>
            {selected?.description ? (
              <p className="club-list-page__meta" style={{ marginTop: 10 }}>
                {selected.description}
              </p>
            ) : null}
            {(selected?.holders || []).length > 0 ? (
              <p className="club-list-page__meta" style={{ marginTop: 6 }}>
                Current holders: {(selected.holders || []).map((h) => h.studentName).join(', ')}
              </p>
            ) : null}
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
          emptyBody="Request an open role in a club you have joined."
          columns={[
            { key: 'position', label: 'Position', render: (r) => posTitle(r.positionId) },
            { key: 'club', label: 'Club', render: (r) => clubName(r.clubId) },
            { key: 'requestedAt', label: 'Requested' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
          rows={mine}
        />
      </div>
    </div>
  );
};

export default PositionsStudentPage;
