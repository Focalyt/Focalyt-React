import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Clock,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  LogOut,
  Building2,
} from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { categoryLabel, joinMethodLabel, modeLabel } from '../../../../config/club/labels';
import { isApprovedMemberStatus, membershipLabel, normalizeMembershipStatus } from '../../../../config/club/membership';

export const ClubDetailModal = ({ club, onClose, onSelectActivity }) => {
  const navigate = useNavigate();
  const {
    state,
    getClubPath,
    getMembershipStatus,
    joinOrRequestClub,
    leaveOrCancelClub,
    isActivityRegistered,
    registerForActivity,
  } = useClub();

  const [requestNote, setRequestNote] = useState('');

  if (!club) return null;

  const liveClub = state.clubs.find((c) => c.id === club.id) || club;
  const status = normalizeMembershipStatus(getMembershipStatus(liveClub.id));
  const coordinator = state.people.find((p) => p.id === liveClub.coordinatorId);
  const institution = state.institutions.find((i) => i.id === liveClub.institutionId);
  const clubActivities = state.activities.filter((a) => a.clubId === liveClub.id);
  const joinedMembers = (liveClub.members || []).filter((m) => isApprovedMemberStatus(m.status));

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    joinOrRequestClub(liveClub.id, requestNote);
    setRequestNote('');
  };

  return (
    <div
      className="fc-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-detail-modal-title"
      onClick={onClose}
    >
      <div className="fc-modal-panel fc-modal-panel-lg" onClick={(e) => e.stopPropagation()}>
        <div className="fc-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="pill pill-pink">{categoryLabel(liveClub.category)}</span>
            <h2 id="club-detail-modal-title" style={{ fontSize: '1.35rem' }}>
              {liveClub.name}
            </h2>
          </div>
          <button
            type="button"
            className="fc-btn fc-btn-ghost fc-btn-sm"
            onClick={onClose}
            aria-label="Close club details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="fc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border-soft)',
              maxHeight: 220,
            }}
          >
            <img
              src={liveClub.bannerSvgDataUrl}
              alt={liveClub.name}
              style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
            />
          </div>

          {liveClub.description ? (
            <div>
              <p style={{ color: 'var(--text-plum)', fontSize: '0.97rem', lineHeight: 1.65 }}>
                {liveClub.description}
              </p>
            </div>
          ) : null}

          <div
            className="cards-grid-2"
            style={{
              background: 'var(--bg-pink-light)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-soft)',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Club Coordinator
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={16} color="var(--primary-rose)" />
                {coordinator ? coordinator.name : 'Campus Coordinator'}
              </div>
              {coordinator && (
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {coordinator.department} • {coordinator.email}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Institution / Community
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={16} color="var(--primary-rose)" />
                {institution ? institution.name : 'Focalyt Campus'}
              </div>
              {liveClub.location ? (
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={13} style={{ verticalAlign: 'middle' }} /> {liveClub.location}
                </div>
              ) : null}
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                How to join
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className="pill pill-blush">
                  <ShieldCheck size={13} /> {joinMethodLabel(liveClub.joiningMethod)}
                </span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <Users size={13} style={{ verticalAlign: 'middle' }} /> {joinedMembers.length} active
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
            }}
          >
            {status === 'rejected' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span className="pill pill-neutral">{membershipLabel('rejected')}</span>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    You can send another request. This is not the same as staff adding a member.
                  </p>
                </div>
                <button type="button" className="fc-btn fc-btn-primary" onClick={() => joinOrRequestClub(liveClub.id)}>
                  Ask again
                </button>
              </div>
            )}

            {status === 'blocked' && (
              <div>
                <span className="pill pill-neutral">{membershipLabel('blocked')}</span>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  You cannot request to join this club while blocked.
                </p>
              </div>
            )}

            {status === 'none' && (
              <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h4 style={{ fontSize: '1.02rem' }}>Join Club</h4>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      Join Club sends a membership request. Status stays {membershipLabel('pending')} until an authorized reviewer marks it {membershipLabel('approved')}.
                    </p>
                  </div>
                  <button type="submit" className="fc-btn fc-btn-primary">
                    Join Club
                  </button>
                </div>

                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional note to Club Admin (e.g., why you want to join)"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                />
              </form>
            )}

            {status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="pill pill-pending">
                    <Clock size={14} />                     {membershipLabel('pending')}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Waiting for {coordinator ? coordinator.name : 'the club lead'} to say yes.
                  </span>
                </div>
                <button
                  type="button"
                  className="fc-btn fc-btn-outline fc-btn-sm"
                  onClick={() => leaveOrCancelClub(liveClub.id)}
                >
                  Cancel Request
                </button>
              </div>
            )}

            {status === 'approved' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="pill pill-Joined">
                    <Check size={14} /> {membershipLabel('approved')}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    You are an active member of {liveClub.name}.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="fc-btn fc-btn-primary fc-btn-sm"
                    onClick={() => {
                      onClose();
                      navigate(getClubPath(`clubs/${liveClub.id}`));
                    }}
                  >
                    Open club page
                  </button>
                  <button
                    type="button"
                    className="fc-btn fc-btn-outline fc-btn-sm"
                    onClick={() => leaveOrCancelClub(liveClub.id)}
                  >
                    <LogOut size={14} /> Leave Club
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.12rem', marginBottom: 12 }}>
              Upcoming Activities from {liveClub.name} ({clubActivities.length})
            </h3>
            {clubActivities.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '22px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No upcoming sessions scheduled yet. Check back soon!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {clubActivities.map((act) => {
                  const registered = isActivityRegistered(act.id);
                  return (
                    <div
                      key={act.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-soft)',
                        background: 'var(--surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.98rem' }}>{act.title}</strong>
                          <span className="pill pill-pink" style={{ fontSize: '0.72rem', padding: '2px 9px' }}>
                            {modeLabel(act.mode)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          {act.date} • {act.time} • {act.location}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {onSelectActivity && (
                          <button
                            type="button"
                            className="fc-btn fc-btn-ghost fc-btn-sm"
                            onClick={() => {
                              onClose();
                              onSelectActivity(act);
                            }}
                          >
                            See more
                          </button>
                        )}
                        {registered ? (
                          <span className="pill pill-Joined">
                            <Check size={13} /> Joined
                          </span>
                        ) : status === 'approved' ? (
                          <button
                            type="button"
                            className="fc-btn fc-btn-primary fc-btn-sm"
                            onClick={() => registerForActivity(act.id)}
                          >
                            Join event
                          </button>
                        ) : (
                          <span className="club-list-page__meta">Join club to register</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
