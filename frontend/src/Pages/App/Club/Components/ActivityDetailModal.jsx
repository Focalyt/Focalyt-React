import React from 'react';
import { Bookmark, Calendar, MapPin, Users, X } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { modeLabel } from '../../../../config/club/labels';

export const ActivityDetailModal = ({ activity, onClose }) => {
  const {
    state,
    isActivitySaved,
    isActivityRegistered,
    toggleSaveActivity,
    registerForActivity,
    cancelActivityRegistration,
  } = useClub();

  if (!activity) return null;

  const liveActivity = state.activities.find((a) => a.id === activity.id) || activity;
  const saved = isActivitySaved(liveActivity.id);
  const registered = isActivityRegistered(liveActivity.id);
  const club = state.clubs.find((c) => c.id === liveActivity.clubId);
  const inCharge = state.people.find((p) => p.id === liveActivity.inChargeId);
  const seatsLeft = Math.max(0, liveActivity.capacity - liveActivity.registrations.length);
  const isFull = seatsLeft === 0;

  return (
    <div
      className="fc-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-detail-modal-title"
      onClick={onClose}
    >
      <div className="fc-modal-panel club-event-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fc-modal-header">
          <div className="club-event-sheet-heading">
            <span className="pill pill-pink">{modeLabel(liveActivity.mode)}</span>
            <h2 id="activity-detail-modal-title">{liveActivity.title}</h2>
          </div>
          <button
            type="button"
            className="fc-btn fc-btn-ghost fc-btn-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="fc-modal-body club-event-sheet-body">
          {club && <p className="club-activity-club">{club.name}</p>}
          <p className="club-event-sheet-summary">{liveActivity.summary}</p>

          <p className="club-event-sheet-line">
            <Calendar size={15} />
            {liveActivity.date} · {liveActivity.time}
          </p>
          <p className="club-event-sheet-line">
            <MapPin size={15} />
            {liveActivity.location}
          </p>
          {inCharge && (
            <p className="club-event-sheet-line">
              Run by {inCharge.name}
            </p>
          )}
          <p className="club-event-sheet-line">
            <Users size={15} />
            {registered
              ? 'You joined'
              : isFull
                ? 'Full'
                : `${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`}
          </p>
        </div>

        <div className="fc-modal-footer club-event-sheet-footer">
          <button
            type="button"
            className={`club-card-save-btn ${saved ? 'is-saved' : ''}`}
            onClick={() => toggleSaveActivity(liveActivity.id)}
            aria-label={saved ? 'Remove from saved' : 'Save this event'}
            aria-pressed={saved}
            title={saved ? 'Saved' : 'Save'}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>

          {registered ? (
            <button
              type="button"
              className="fc-btn fc-btn-secondary"
              onClick={() => cancelActivityRegistration(liveActivity.id)}
            >
              Leave event
            </button>
          ) : (
            <button
              type="button"
              className="fc-btn fc-btn-primary"
              disabled={isFull}
              onClick={() => registerForActivity(liveActivity.id)}
            >
              Join event
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
