import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  Check,
  Clock,
  Heart,
  Lightbulb,
  MapPin,
  Sparkles,
  Trash2,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import {
  findStudentMembership,
  isApprovedMemberStatus,
  studentCanActInClub,
} from '../../../../config/club/membership';
import { ClubCard } from '../Components/ClubCard';
import { ClubDetailModal } from '../Components/ClubDetailModal';
import { ActivityDetailModal } from '../Components/ActivityDetailModal';

export const MySpacePage = () => {
  const {
    state,
    getClubPath,
    leaveOrCancelClub,
    toggleSaveActivity,
    registerForActivity,
    cancelActivityRegistration,
    isActivityRegistered,
    removeClubSuggestion,
  } = useClub();

  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const studentId = state.currentStudent.id;
  const membershipOf = (club) => findStudentMembership(club, state.currentStudent);

  const joinedClubs = state.clubs.filter((club) => isApprovedMemberStatus(membershipOf(club)?.status));

  const pendingClubs = state.clubs.filter((club) => membershipOf(club)?.status === 'pending');

  const rejectedClubs = state.clubs.filter((club) => membershipOf(club)?.status === 'rejected');

  const positionsEnabled = Boolean(state.settings?.positionsFeatureEnabled);

  const savedActivities = state.activities.filter((act) =>
    state.currentStudent.savedActivityIds.includes(act.id)
  );

  const registeredActivities = state.activities.filter((act) =>
    act.registrations.some((r) => r.studentId === studentId)
  );

  const mySuggestions = state.suggestions.filter(
    (idea) => !idea.studentId || idea.studentId === studentId
  );

  return (
    <div className="section-white" style={{ paddingTop: 44 }}>
      <div className="club-container" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <div className="myspace-hero-banner">
          <div>
            <div className="section-eyebrow">
              <Heart size={14} /> My clubs
            </div>
            <h1 className="section-title" style={{ fontSize: 'clamp(1.45rem, 3vw, 2rem)' }}>
              Hi, {state.currentStudent.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              {state.currentStudent.department} • {state.currentStudent.year} • Manage your clubs, saved events, registrations, and club ideas in one place.
            </p>
          </div>

          <div className="myspace-stats-grid">
            <div className="myspace-stat-box">
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-rose)' }}>
                {joinedClubs.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Joined Clubs
              </div>
            </div>
            <div className="myspace-stat-box">
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-plum)' }}>
                {pendingClubs.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Pending Requests
              </div>
            </div>
            <div className="myspace-stat-box">
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-rose)' }}>
                {savedActivities.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Saved Events
              </div>
            </div>
            <div className="myspace-stat-box">
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-plum)' }}>
                {registeredActivities.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Joined events
              </div>
            </div>
          </div>
        </div>

        <div className="club-quick-links">
          {positionsEnabled && (
            <Link className="club-quick-link" to={getClubPath('positions')}>Ask for a role</Link>
          )}
          <Link className="club-quick-link" to={getClubPath('certificates')}>Certificates</Link>
          <Link className="club-quick-link" to={getClubPath('community')}>Community</Link>
          <Link className="club-quick-link" to={getClubPath('profile')}>Profile</Link>
        </div>

        {/* 1. JOINED CLUBS */}
        <section>
          <div className="section-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>
                Approved Clubs ({joinedClubs.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Communities where you are an active member.
              </p>
            </div>
            <Link to={getClubPath('clubs')} className="fc-btn fc-btn-outline fc-btn-sm">
              Explore More Clubs
            </Link>
          </div>

          {joinedClubs.length === 0 ? (
            <div className="empty-state-box">
              <Users size={26} color="var(--primary-rose)" />
              <h3 style={{ fontSize: '1.08rem' }}>You haven’t joined any clubs yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420 }}>
                Explore creative, sports, social impact, and maker communities to join your first club.
              </p>
              <Link to={getClubPath('clubs')} className="fc-btn fc-btn-primary fc-btn-sm">
                Browse Clubs
              </Link>
            </div>
          ) : (
            <div className="cards-grid-3">
              {joinedClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onSelectClub={(c) => setSelectedClub(c)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 2. PENDING JOINING REQUESTS */}
        <section>
          <div className="section-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>
                Pending Joining Requests ({pendingClubs.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Clubs you asked to join. Waiting for a yes.
              </p>
            </div>
          </div>

          {pendingClubs.length === 0 ? (
            <div className="empty-state-box">
              <Clock size={26} color="var(--primary-rose)" />
              <h3 style={{ fontSize: '1.08rem' }}>No pending club requests</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420 }}>
                When you request to join an approval-based club like The Creative Corner or The Makers Club, it will appear here.
              </p>
              <Link to={getClubPath('clubs')} className="fc-btn fc-btn-outline fc-btn-sm">
                Explore Clubs
              </Link>
            </div>
          ) : (
            <div className="cards-grid-3">
              {pendingClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onSelectClub={(c) => setSelectedClub(c)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 2b. REJECTED REQUESTS */}
        {rejectedClubs.length > 0 && (
          <section>
            <div className="section-header" style={{ marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>
                  Declined requests ({rejectedClubs.length})
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  These requests were rejected. You can ask to join again from Clubs.
                </p>
              </div>
            </div>
            <div className="cards-grid-3">
              {rejectedClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onSelectClub={(c) => setSelectedClub(c)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 3. REGISTERED ACTIVITIES */}
        <section>
          <div className="section-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>
                Joined events ({registeredActivities.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Events you already joined.
              </p>
            </div>
            <Link to={getClubPath('whats-on')} className="fc-btn fc-btn-outline fc-btn-sm">
              See events
            </Link>
          </div>

          {registeredActivities.length === 0 ? (
            <div className="empty-state-box">
              <Calendar size={26} color="var(--primary-rose)" />
              <h3 style={{ fontSize: '1.08rem' }}>No events joined yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420 }}>
                Pick a jam, workshop, or turf night from Events.
              </p>
              <Link to={getClubPath('whats-on')} className="fc-btn fc-btn-primary fc-btn-sm">
                See events
              </Link>
            </div>
          ) : (
            <div className="cards-grid-2">
              {registeredActivities.map((act) => {
                const club = state.clubs.find((c) => c.id === act.clubId);
                const myReg = act.registrations.find((r) => r.studentId === studentId);
                return (
                  <div
                    key={act.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span className="pill pill-pink">{club?.name || 'Campus Event'}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="pill pill-Joined">
                          <Check size={12} /> Joined
                        </span>
                        {myReg && (
                          <span
                            className={`pill ${
                              myReg.attendance === 'Present'
                                ? 'pill-Joined'
                                : myReg.attendance === 'Absent'
                                ? 'pill-warning'
                                : 'pill-neutral'
                            }`}
                          >
                            Attendance: {myReg.attendance}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.15rem' }}>{act.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>
                        <Calendar size={14} style={{ verticalAlign: 'middle' }} /> {act.date} • {act.time}
                      </span>
                      <span>
                        <MapPin size={14} style={{ verticalAlign: 'middle' }} /> {act.location} ({act.mode})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-soft)', marginTop: 'auto' }}>
                      <button
                        type="button"
                        className="fc-btn fc-btn-ghost fc-btn-sm"
                        onClick={() => setSelectedActivity(act)}
                      >
                        Details <ArrowUpRight size={14} />
                      </button>
                      <button
                        type="button"
                        className="fc-btn fc-btn-secondary fc-btn-sm"
                        onClick={() => cancelActivityRegistration(act.id)}
                      >
                        Cancel Registration
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. SAVED ACTIVITIES */}
        <section>
          <div className="section-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>
                Saved Activities ({savedActivities.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Bookmarked activities kept separate from your confirmed registrations.
              </p>
            </div>
          </div>

          {savedActivities.length === 0 ? (
            <div className="empty-state-box">
              <Bookmark size={26} color="var(--primary-rose)" />
              <h3 style={{ fontSize: '1.08rem' }}>No saved activities</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420 }}>
                Tap the bookmark on any event to keep it here before you join.
              </p>
              <Link to={getClubPath('whats-on')} className="fc-btn fc-btn-outline fc-btn-sm">
                Browse Activities
              </Link>
            </div>
          ) : (
            <div className="cards-grid-2">
              {savedActivities.map((act) => {
                const club = state.clubs.find((c) => c.id === act.clubId);
                const registered = isActivityRegistered(act.id);
                return (
                  <div
                    key={act.id}
                    style={{
                      background: 'var(--bg-pink-light)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span className="pill pill-blush">{club?.name || 'Club Session'}</span>
                      <span className="pill pill-pink">
                        <Bookmark size={12} fill="currentColor" /> Saved
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem' }}>{act.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {act.date} • {act.time} • {act.location}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        className="fc-btn fc-btn-ghost fc-btn-sm"
                        onClick={() => setSelectedActivity(act)}
                      >
                        Details <ArrowUpRight size={14} />
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="fc-btn fc-btn-outline fc-btn-sm"
                          onClick={() => toggleSaveActivity(act.id)}
                        >
                          Remove Saved
                        </button>
                        {!registered &&
                          (studentCanActInClub(state.clubs, state.currentStudent, act.clubId) ? (
                            <button
                              type="button"
                              className="fc-btn fc-btn-primary fc-btn-sm"
                              onClick={() => registerForActivity(act.id)}
                            >
                              Join event
                            </button>
                          ) : (
                            <span className="club-list-page__meta">Join club to register</span>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. SUBMITTED CLUB IDEAS */}
        <section>
          <div className="section-header" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>
                Submitted Club Ideas ({mySuggestions.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Ideas you’ve pitched through the “Suggest a Club” form on Discover.
              </p>
            </div>
            <Link to={`${getClubPath('discover')}#suggest-club`} className="fc-btn fc-btn-secondary fc-btn-sm">
              <Sparkles size={14} /> Suggest Another Club
            </Link>
          </div>

          {mySuggestions.length === 0 ? (
            <div className="empty-state-box">
              <Lightbulb size={26} color="var(--primary-rose)" />
              <h3 style={{ fontSize: '1.08rem' }}>No club ideas submitted yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420 }}>
                Have an idea for a new campus community? Head to the Discover page and fill out the Suggest a Club form.
              </p>
              <Link to={`${getClubPath('discover')}#suggest-club`} className="fc-btn fc-btn-primary fc-btn-sm">
                Suggest a Club
              </Link>
            </div>
          ) : (
            <div className="cards-grid-2">
              {mySuggestions.map((idea) => (
                <div
                  key={idea.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="pill pill-pink">{idea.category}</span>
                    <span
                      className={`pill ${
                        idea.status === 'Approved' ? 'pill-Joined' : 'pill-blush'
                      }`}
                    >
                      {idea.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem' }}>{idea.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {idea.description}
                  </p>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    <div>
                      <strong>Why needed:</strong> {idea.whyNeeded}
                    </div>
                    <div>
                      <strong>Format:</strong> {idea.expectedFormat} • Submitted {idea.submittedAt}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button
                      type="button"
                      className="fc-btn fc-btn-ghost fc-btn-sm"
                      onClick={() => removeClubSuggestion(idea.id)}
                    >
                      <Trash2 size={14} /> Withdraw Idea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ClubDetailModal
        club={selectedClub}
        onClose={() => setSelectedClub(null)}
        onSelectActivity={(act) => setSelectedActivity(act)}
      />
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
};

export default MySpacePage;
