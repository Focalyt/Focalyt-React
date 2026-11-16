import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Check,
  Clock,
  Compass,
  Heart,
  Lightbulb,
  MapPin,
  Radio,
  Sparkles,
} from 'lucide-react';
import { AVAILABLE_INTERESTS } from '../data/mockData';
import { useClub } from '../../../../contexts/ClubContext';
import { ClubCard } from '../Components/ClubCard';
import { ActivityCard } from '../Components/ActivityCard';
import { ClubDetailModal } from '../Components/ClubDetailModal';
import { ActivityDetailModal } from '../Components/ActivityDetailModal';
import { CATEGORY_OPTIONS } from '../../../../config/club/labels';

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const {
    state,
    getClubPath,
    toggleStudentInterest,
    submitClubSuggestion,
    isActivitySaved,
    isActivityRegistered,
    toggleSaveActivity,
    registerForActivity,
    cancelActivityRegistration,
  } = useClub();

  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [clubName, setClubName] = useState('');
  const [clubCategory, setClubCategory] = useState('Creative');
  const [clubDescription, setClubDescription] = useState('');
  const [whyNeeded, setWhyNeeded] = useState('');
  const [expectedFormat, setExpectedFormat] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedSuccess, setSubmittedSuccess] = useState(null);

  const featuredClubs = state.clubs.filter((c) => c.featured);
  const displayFeaturedClubs =
    featuredClubs.length > 0 ? featuredClubs : state.clubs;

  const featuredActivity =
    state.activities.find((a) => a.featured) || state.activities[0] || null;
  const otherActivities = state.activities
    .filter((a) => a.id !== featuredActivity?.id)
    .slice(0, 3);

  const selectedInterests = state.currentStudent.selectedInterests;

  const matchingClubsForInterests =
    selectedInterests.length === 0
      ? []
      : state.clubs.filter((club) =>
          (club.interests || []).some((tag) =>
            selectedInterests.some((sel) => tag.toLowerCase() === sel.toLowerCase())
          )
        );

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!clubName.trim()) {
      nextErrors.clubName = 'Please enter a proposed club name.';
    }
    if (!clubDescription.trim()) {
      nextErrors.clubDescription = 'Please describe what the club is about.';
    }
    if (!whyNeeded.trim()) {
      nextErrors.whyNeeded = 'Please share why students would love this club.';
    }
    if (!expectedFormat.trim()) {
      nextErrors.expectedFormat = 'Please mention how often or how the club will meet.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const ideaName = clubName.trim();
    Promise.resolve(
      submitClubSuggestion({
        name: ideaName,
        category: clubCategory,
        description: clubDescription,
        whyNeeded,
        expectedFormat,
      })
    )
      .then(() => {
        setSubmittedSuccess(ideaName);
        setClubName('');
        setClubDescription('');
        setWhyNeeded('');
        setExpectedFormat('');
        setErrors({});
      })
      .catch(() => {});
  };

  const featuredClubHost = featuredActivity
    ? state.clubs.find((c) => c.id === featuredActivity.clubId)
    : undefined;

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="discover-hero">
        <div className="club-container discover-hero-grid">
          <div>
            <span className="pill pill-pink" style={{ marginBottom: 18 }}>
              <Sparkles size={14} /> Focalyt Student Communities
            </span>
            <h1 className="hero-title">
              More than a classroom.{' '}
              <span className="hero-title-highlight">A place to belong.</span>
            </h1>
            <p className="hero-lead">
              Follow an interest. Try something new. Find the people who make your everyday a little more extraordinary.
            </p>
            <div className="hero-actions">
              <Link to={getClubPath('clubs')} className="fc-btn fc-btn-primary fc-btn-lg">
                <Compass size={18} /> Find a club
              </Link>
              <Link to={getClubPath('whats-on')} className="fc-btn fc-btn-secondary fc-btn-lg">
                <Calendar size={18} /> See events
              </Link>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <strong className="hero-stat-value">{state.clubs.length} Clubs</strong>
                <span>across creative, sports, impact & tech</span>
              </div>
              <div className="hero-stat-item">
                <strong className="hero-stat-value">{state.activities.length} Sessions</strong>
                <span>happening this month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CLUBS */}
      <section className="section-white">
        <div className="club-container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">
                <Sparkles size={14} /> Student Communities
              </div>
              <h2 className="section-title">Featured Clubs to Explore</h2>
              <p className="section-subtitle">
                Step into a welcoming circle — whether you’re a seasoned enthusiast or trying something for the very first time.
              </p>
            </div>
            <Link to={getClubPath('clubs')} className="fc-btn fc-btn-outline">
              View All {state.clubs.length} Clubs <ArrowRight size={16} />
            </Link>
          </div>

          {displayFeaturedClubs.length === 0 ? (
            <div className="empty-state-box">
              <h3 style={{ fontSize: '1.15rem' }}>No clubs yet</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 480, fontSize: '0.92rem' }}>
                Clubs appear here after a Club Admin creates them. Any student can browse and join.
              </p>
            </div>
          ) : (
          <div className="cards-grid-3">
            {displayFeaturedClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onSelectClub={(c) => setSelectedClub(c)}
              />
            ))}
          </div>
          )}
        </div>
      </section>

      {/* 3. UPCOMING ACTIVITIES WITH ONE FEATURED EVENT */}
      <section className="section-pink">
        <div className="club-container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">
                <Calendar size={14} /> Events
              </div>
              <h2 className="section-title">Coming up</h2>
              <p className="section-subtitle">
                Save an event for later, or join it to take a seat.
              </p>
            </div>
            <Link to={getClubPath('whats-on')} className="fc-btn fc-btn-outline">
              See Full Calendar <ArrowRight size={16} />
            </Link>
          </div>

          {featuredActivity && (
            <div className="featured-activity-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span
                    className="pill"
                    style={{
                      background: 'var(--primary-rose)',
                      color: '#FFFFFF',
                    }}
                  >
                    <Sparkles size={13} /> Featured Event
                  </span>
                  <span className="pill pill-pink">
                    <Radio size={13} /> {featuredActivity.mode}
                  </span>
                  {featuredClubHost && (
                    <span className="pill pill-blush">{featuredClubHost.name}</span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                    fontWeight: 800,
                    marginBottom: 10,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedActivity(featuredActivity)}
                >
                  {featuredActivity.title}
                </h3>

                <p style={{ color: 'var(--text-plum)', fontSize: '0.98rem', marginBottom: 18 }}>
                  {featuredActivity.summary}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '18px',
                    flexWrap: 'wrap',
                    fontSize: '0.88rem',
                    color: 'var(--text-plum)',
                    marginBottom: 22,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Calendar size={15} color="var(--primary-rose)" /> {featuredActivity.date}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Clock size={15} color="var(--primary-rose)" /> {featuredActivity.time}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <MapPin size={15} color="var(--primary-rose)" /> {featuredActivity.location}
                  </span>
                </div>

                <div className="featured-activity-actions">
                  {isActivityRegistered(featuredActivity.id) ? (
                    <button
                      type="button"
                      className="fc-btn fc-btn-secondary"
                      onClick={() => cancelActivityRegistration(featuredActivity.id)}
                    >
                      <Check size={16} /> Joined (Leave event)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fc-btn fc-btn-primary"
                      onClick={() => registerForActivity(featuredActivity.id)}
                    >
                      Join this event
                    </button>
                  )}

                  <button
                    type="button"
                    className="fc-btn fc-btn-outline"
                    onClick={() => toggleSaveActivity(featuredActivity.id)}
                  >
                    <Bookmark
                      size={16}
                      fill={isActivitySaved(featuredActivity.id) ? 'currentColor' : 'none'}
                    />
                    {isActivitySaved(featuredActivity.id) ? 'Saved' : 'Save Event'}
                  </button>

                  <button
                    type="button"
                    className="fc-btn fc-btn-ghost"
                    onClick={() => setSelectedActivity(featuredActivity)}
                  >
                    Full Event Details →
                  </button>
                </div>
              </div>

            </div>
          )}

          <div className="cards-grid-3">
            {otherActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onSelectActivity={(act) => setSelectedActivity(act)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. INTEREST PICKER */}
      <section className="section-white">
        <div className="club-container">
          <div className="interest-picker-box">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div>
                <div className="section-eyebrow">
                  <Heart size={14} /> Personalise Your Space
                </div>
                <h2 className="section-title" style={{ fontSize: '1.75rem' }}>
                  What sparks your curiosity?
                </h2>
                <p className="section-subtitle">
                  Pick a few interests below. We’ll highlight matching clubs right here and save your preferences in your space.
                </p>
              </div>
              {selectedInterests.length > 0 && (
                <button
                  type="button"
                  className="fc-btn fc-btn-primary fc-btn-sm"
                  onClick={() =>
                    navigate(`${getClubPath('clubs')}?interest=${encodeURIComponent(selectedInterests[0])}`)
                  }
                >
                  Explore Matching Clubs ({matchingClubsForInterests.length}) <ArrowRight size={15} />
                </button>
              )}
            </div>

            <div className="chip-group" role="group" aria-label="Interest picker">
              {AVAILABLE_INTERESTS.map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`filter-chip ${active ? 'active' : ''}`}
                    onClick={() => toggleStudentInterest(interest)}
                    aria-pressed={active}
                  >
                    {active && <Check size={14} />}
                    {interest}
                  </button>
                );
              })}
            </div>

            {matchingClubsForInterests.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid var(--border-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Recommended for your picks:
                  </span>
                  {matchingClubsForInterests.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="fc-btn fc-btn-blush fc-btn-sm"
                      onClick={() => setSelectedClub(c)}
                    >
                      {c.name} →
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. SUGGEST A CLUB FORM */}
      <section className="section-pink" id="suggest-club">
        <div className="club-container">
          <div className="suggest-club-grid">
            <div>
              <div className="section-eyebrow">
                <Lightbulb size={15} /> Start Something New
              </div>
              <h2 className="section-title">Don’t see your club yet? Suggest one.</h2>
              <p className="section-subtitle" style={{ marginTop: 12 }}>
                Some of our best campus circles started with two students and a shared curiosity. Pitch an idea below — it will appear in <strong>My clubs</strong> for your college to check.
              </p>

              <div
                style={{
                  marginTop: 24,
                  background: 'var(--bg-blush-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid rgba(27, 167, 255, 0.35)',
                }}
              >
                <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>
                  What happens after you submit?
                </h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    color: 'var(--text-plum)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <li>Saved immediately in <strong>My clubs → Club ideas</strong>.</li>
                  <li>Campus coordinators review interest and assign a faculty or student mentor.</li>
                  <li>Once approved by your institution admin, it becomes an active campus club.</li>
                </ul>
              </div>
            </div>

            <form className="form-card" onSubmit={handleSuggestSubmit} noValidate>
              <h3 style={{ fontSize: '1.25rem', marginBottom: 18 }}>Suggest a Club</h3>

              {submittedSuccess && (
                <div
                  style={{
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    color: 'var(--success-text)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 18,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    <strong>“{submittedSuccess}”</strong> was added to your Submitted Club Ideas!
                  </span>
                  <Link
                    to={getClubPath('my-space')}
                    style={{ fontWeight: 700, textDecoration: 'underline' }}
                  >
                    View in My clubs →
                  </Link>
                </div>
              )}

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="suggest-club-name">
                    Proposed Club Name *
                  </label>
                  <input
                    id="suggest-club-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Campus Film & Documentary Society"
                    value={clubName}
                    onChange={(e) => {
                      setClubName(e.target.value);
                      if (errors.clubName) setErrors({ ...errors, clubName: '' });
                    }}
                  />
                  {errors.clubName && <span className="form-error">{errors.clubName}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="suggest-club-category">
                    Category *
                  </label>
                  <select
                    id="suggest-club-category"
                    className="form-select"
                    value={clubCategory}
                    onChange={(e) => setClubCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field full-width">
                  <label className="form-label" htmlFor="suggest-club-desc">
                    What will members do together? *
                  </label>
                  <textarea
                    id="suggest-club-desc"
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe typical sessions, projects, or activities..."
                    value={clubDescription}
                    onChange={(e) => {
                      setClubDescription(e.target.value);
                      if (errors.clubDescription) setErrors({ ...errors, clubDescription: '' });
                    }}
                  />
                  {errors.clubDescription && (
                    <span className="form-error">{errors.clubDescription}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="suggest-club-why">
                    Why will students love this? *
                  </label>
                  <input
                    id="suggest-club-why"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Great creative outlet after labs"
                    value={whyNeeded}
                    onChange={(e) => {
                      setWhyNeeded(e.target.value);
                      if (errors.whyNeeded) setErrors({ ...errors, whyNeeded: '' });
                    }}
                  />
                  {errors.whyNeeded && <span className="form-error">{errors.whyNeeded}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="suggest-club-format">
                    Expected Schedule / Format *
                  </label>
                  <input
                    id="suggest-club-format"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Weekly Friday 5 PM screenings"
                    value={expectedFormat}
                    onChange={(e) => {
                      setExpectedFormat(e.target.value);
                      if (errors.expectedFormat) setErrors({ ...errors, expectedFormat: '' });
                    }}
                  />
                  {errors.expectedFormat && (
                    <span className="form-error">{errors.expectedFormat}</span>
                  )}
                </div>

                <div className="form-field full-width" style={{ marginTop: 6 }}>
                  <button type="submit" className="fc-btn fc-btn-primary" style={{ width: '100%' }}>
                    <Sparkles size={16} /> Submit Club Suggestion
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

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

export default DiscoverPage;
