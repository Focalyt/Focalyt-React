import React from 'react';
import { Bookmark, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { modeLabel } from '../../../../config/club/labels';
import { studentCanActInClub } from '../../../../config/club/membership';

export const ActivityCard = ({ activity, onSelectActivity }) => {
  const {
    state,
    mode,
    isActivitySaved,
    isActivityRegistered,
    toggleSaveActivity,
    registerForActivity,
    cancelActivityRegistration,
  } = useClub();

  const saved = isActivitySaved(activity.id);
  const registered = isActivityRegistered(activity.id);
  const club = state.clubs.find((c) => c.id === activity.clubId);
  const seatsLeft = Math.max(0, activity.capacity - activity.registrations.length);
  const isFull = seatsLeft === 0;
  const canJoinEvent =
    mode !== 'student' || studentCanActInClub(state.clubs, state.currentStudent, activity.clubId);
  const joinBlockedReason = !canJoinEvent
    ? 'Join this club and get approved before registering for its events.'
    : '';

  const openDetails = () => onSelectActivity(activity);

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetails();
    }
  };

  return (
    <article
      className="club-card club-activity-card"
      onClick={openDetails}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`${activity.title}. ${modeLabel(activity.mode)}. Tap for details.`}
    >
      <div className="club-card-body">
        <div className="club-activity-top">
          <span className="pill pill-pink">{modeLabel(activity.mode)}</span>
          <button
            type="button"
            className={`club-card-save-btn ${saved ? 'is-saved' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveActivity(activity.id);
            }}
            aria-label={saved ? 'Remove from saved' : 'Save this event'}
            aria-pressed={saved}
            title={saved ? 'Saved' : 'Save'}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h3 className="club-card-title">{activity.title}</h3>
        {club && <p className="club-activity-club">{club.name}</p>}
        <div className="club-activity-meta">
          <span>
            <Calendar size={14} /> {activity.date}
          </span>
          <span>
            <Clock size={14} /> {activity.time}
          </span>
          <span>
            <MapPin size={14} /> {activity.location}
          </span>
        </div>

        <div className="club-card-footer">
          <span className="club-activity-seats">
            <Users size={14} />
            {registered
              ? 'You joined'
              : isFull
                ? 'Full'
                : `${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`}
          </span>

          {registered ? (
            <button
              type="button"
              className="fc-btn fc-btn-secondary fc-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                cancelActivityRegistration(activity.id);
              }}
            >
              Leave event
            </button>
          ) : (
            <button
              type="button"
              className="fc-btn fc-btn-primary fc-btn-sm"
              disabled={isFull || !canJoinEvent}
              title={joinBlockedReason || (isFull ? 'Full' : 'Join event')}
              onClick={(e) => {
                e.stopPropagation();
                registerForActivity(activity.id);
              }}
            >
              {!canJoinEvent ? 'Join club first' : isFull ? 'Full' : 'Join event'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
