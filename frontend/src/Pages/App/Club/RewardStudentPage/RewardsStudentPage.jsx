import React from 'react';
import { StatusBadge } from '../Components/cms/StatusBadge';
import { DataTable } from '../Components/cms/DataTable';
import { BadgeMark } from '../Components/BadgeMark';
import { useClub } from '../../../../contexts/ClubContext';
import { badgeEarned } from '../../../../config/club/badgeMarks';

const EARN_RULES = [
  { label: 'Join a club', points: '+50', detail: 'Awarded when Club Admin approves your request.' },
  { label: 'Attend an event', points: '+40', detail: 'Awarded when staff mark you present. Registering does not add points.' },
];

export const RewardsStudentPage = () => {
  const { state, requestRedemption } = useClub();
  const student = state.currentStudent || {};
  const studentId = String(student.id || '');
  const balance = Number(student.points) || 0;
  const mine = (state.redemptions || []).filter((row) => String(row.studentId) === studentId);
  const pendingCost = mine
    .filter((row) => String(row.status).toLowerCase() === 'pending')
    .reduce((sum, row) => sum + (Number(row.points) || 0), 0);
  const available = Math.max(0, balance - pendingCost);
  const ledger = (state.pointsLedger || []).filter(
    (row) => !row.studentId || String(row.studentId) === studentId
  );
  const gifts = [];
  const seenGifts = new Set();
  (state.goodies || [])
    .filter((gift) => !gift.audience || gift.audience === 'both' || gift.audience === 'student')
    .forEach((gift) => {
      const key = `${String(gift.name || '').trim().toLowerCase()}|${Number(gift.points) || 0}`;
      if (seenGifts.has(key)) return;
      seenGifts.add(key);
      gifts.push(gift);
    });
  const earnedCodes = new Set((student.badgesEarned || []).map(String));
  const badges = [];
  const seenBadges = new Set();
  (state.badges || []).forEach((badge) => {
    const key = String(badge.code || badge.id || badge.name).toLowerCase();
    if (seenBadges.has(key)) return;
    seenBadges.add(key);
    badges.push(badge);
  });
  const earnedCount = badges.filter((badge) => earnedCodes.has(String(badge.id)) || earnedCodes.has(String(badge.code))).length;

  const requestGift = (gift) => {
    if (gift.stock < 1 || available < gift.points) return;
    const pending = mine.some(
      (row) => String(row.goodieId) === String(gift.id) && String(row.status).toLowerCase() === 'pending'
    );
    if (pending) return;
    if (!window.confirm(`Request ${gift.name} for ${gift.points} points? Club Admin still confirms pickup.`)) return;
    requestRedemption(gift);
  };

  return (
    <div className="club-list-page">
      <div className="club-list-page__header">
        <div>
          <h1>Rewards</h1>
          <p>Earn points from clubs and events, then request a gift. Your college confirms pickup.</p>
        </div>
      </div>

      <div className="club-list-page__stats">
        <div className="club-list-page__stat">
          <strong>{available}</strong>
          <span>Available points</span>
        </div>
        <div className="club-list-page__stat">
          <strong>{pendingCost}</strong>
          <span>Held for pending gifts</span>
        </div>
        <div className="club-list-page__stat">
          <strong>{earnedCount}</strong>
          <span>Badges earned</span>
        </div>
        <div className="club-list-page__stat">
          <strong>{mine.length}</strong>
          <span>Gift requests</span>
        </div>
      </div>

      <div className="club-list-page__panel">
        <h3>How to earn</h3>
        <p className="club-list-page__meta" style={{ marginBottom: 12 }}>
          Points start at 0. Join a club, then attend an event, before requesting a gift.
        </p>
        <div className="club-earn-list">
          {EARN_RULES.map((rule) => (
            <div key={rule.label} className="club-earn-item">
              <strong>{rule.points}</strong>
              <div>
                <div className="club-list-page__name">{rule.label}</div>
                <div className="club-list-page__meta">{rule.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="club-list-page__section">
        <h2>Badges</h2>
        {badges.length === 0 ? (
          <p className="club-list-page__empty">Badges appear after your campus Club is set up.</p>
        ) : (
          <div className="club-badge-grid">
            {badges.map((badge) => {
              const unlocked = badgeEarned(earnedCodes, badge);
              return (
                <div key={badge.id} className={`club-badge-tile ${unlocked ? 'is-earned' : 'is-locked'}`}>
                  <BadgeMark icon={badge.icon} logoUrl={badge.logoUrl} name={badge.name} size={64} />
                  <strong>{badge.name}</strong>
                  <span>{unlocked ? 'Awarded' : badge.description || 'Not awarded yet'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="club-list-page__section">
        <h2>Gifts</h2>
        {gifts.length === 0 ? (
          <p className="club-list-page__empty">No gifts yet. Club Admin adds them in Rewards.</p>
        ) : (
          <div className="club-gift-grid">
            {gifts.map((gift) => {
              const pending = mine.some(
                (row) => String(row.goodieId) === String(gift.id) && String(row.status).toLowerCase() === 'pending'
              );
              const canAfford = available >= gift.points;
              const inStock = gift.stock > 0;
              const canRequest = inStock && canAfford && !pending;
              return (
                <div key={gift.id} className="club-gift-card">
                  <div className="club-list-page__name">{gift.name}</div>
                  <div className="club-list-page__meta">
                    {gift.points} points · {gift.stock} left · {gift.category || 'Gift'}
                    {gift.collegeName ? ` · ${gift.collegeName}` : ''}
                  </div>
                  <button
                    type="button"
                    className="fc-btn fc-btn-primary fc-btn-sm"
                    disabled={!canRequest}
                    onClick={() => requestGift(gift)}
                  >
                    {pending ? 'Requested' : !inStock ? 'Out of stock' : !canAfford ? `Need ${gift.points} points` : 'Request gift'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="club-list-page__section">
        <h2>Points history</h2>
        <DataTable
          rows={ledger}
          emptyTitle="No points yet"
          emptyBody="Join a club or attend an event to start earning."
          columns={[
            { key: 'label', label: 'Activity' },
            {
              key: 'points',
              label: 'Points',
              render: (row) => (Number(row.points) > 0 ? `+${row.points}` : row.points),
            },
            { key: 'at', label: 'Date' },
          ]}
        />
      </div>

      <div className="club-list-page__section">
        <h2>My gifts</h2>
        <DataTable
          rows={mine}
          emptyTitle="No gift requests yet"
          columns={[
            { key: 'goodieName', label: 'Gift' },
            { key: 'points', label: 'Points' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'requestedAt', label: 'Requested' },
          ]}
        />
      </div>
    </div>
  );
};

export default RewardsStudentPage;
