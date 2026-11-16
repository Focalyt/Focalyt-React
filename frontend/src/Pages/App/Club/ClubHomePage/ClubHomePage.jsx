import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  LogOut,
  MapPin,
  Megaphone,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { useClub } from '../../../../contexts/ClubContext';
import { getClubTheme } from '../../../../config/club/clubThemes';
import { categoryLabel, modeLabel } from '../../../../config/club/labels';
import {
  findStudentMembership,
  isApprovedMemberStatus,
  normalizeMembershipStatus,
} from '../../../../config/club/membership';
import { CommunityPage } from '../CommunityPage/CommunityPage';
import { ActivityDetailModal } from '../Components/ActivityDetailModal';
import { ConfirmDialog } from '../Components/cms/ConfirmDialog';
import './ClubHomePage.css';

const todayKey = () => new Date().toISOString().slice(0, 10);

const parseDay = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const formatDay = (value) => {
  const date = parseDay(value);
  if (!date) return value || '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const initialsOf = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'events', label: 'Events' },
  { id: 'members', label: 'Members' },
];

const DateTile = ({ value }) => {
  const date = parseDay(value);
  return (
    <span className="ch-date" aria-hidden="true">
      <strong>{date ? date.getDate() : '–'}</strong>
      <em>{date ? date.toLocaleDateString('en-IN', { month: 'short' }) : ''}</em>
    </span>
  );
};

export const ClubHomePage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const {
    state,
    cmsStatus,
    getClubPath,
    getMembershipStatus,
    joinOrRequestClub,
    leaveOrCancelClub,
    isActivityRegistered,
    registerForActivity,
    cancelActivityRegistration,
  } = useClub();

  const [tab, setTab] = useState('feed');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const club = state.clubs.find((item) => item.id === clubId);
  const status = club ? normalizeMembershipStatus(getMembershipStatus(club.id)) : 'none';

  const { upcoming, past } = useMemo(() => {
    const list = (state.activities || []).filter((activity) => activity.clubId === clubId);
    const today = todayKey();
    const dayOf = (a) => String(a.startDate || a.date || '');
    const byDate = (a, b) => dayOf(a).localeCompare(dayOf(b));
    return {
      upcoming: list.filter((a) => dayOf(a) >= today).sort(byDate),
      past: list.filter((a) => dayOf(a) < today).sort(byDate).reverse(),
    };
  }, [clubId, state.activities]);

  const notices = useMemo(
    () =>
      (state.announcements || [])
        .filter((item) => item.clubId === clubId && (item.status || 'published') === 'published')
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    [clubId, state.announcements]
  );

  const theme = getClubTheme(club?.theme);
  const themeVars = {
    '--ch-primary': theme.primary,
    '--ch-deep': theme.deep,
    '--ch-soft': theme.secondary,
    '--ch-bg': theme.bg,
  };

  if (!club) {
    return (
      <div className="club-container ch-page" style={themeVars}>
        <section className="ch-card ch-gate">
          <p>{cmsStatus === 'loading' ? 'Loading club…' : 'This club is not available.'}</p>
          {cmsStatus !== 'loading' ? (
            <Link className="fc-btn fc-btn-outline fc-btn-sm" to={getClubPath('clubs')}>
              Browse clubs
            </Link>
          ) : null}
        </section>
      </div>
    );
  }

  if (status !== 'approved') {
    return (
      <div className="club-container ch-page" style={themeVars}>
        <section className="ch-card ch-gate">
          <span className="ch-avatar" aria-hidden="true">
            {initialsOf(club.name)}
          </span>
          <h1>{club.name}</h1>
          <p>
            {status === 'pending'
              ? 'Your request is with the club admin. This page opens once you are approved.'
              : status === 'blocked'
                ? 'You cannot open this club.'
                : 'Posts, events and notices are for members. Request to join to get in.'}
          </p>
          <div className="ch-gate__actions">
            {status === 'none' || status === 'rejected' ? (
              <button type="button" className="ch-btn" onClick={() => joinOrRequestClub(club.id)}>
                <UserPlus size={15} /> {status === 'rejected' ? 'Request again' : 'Request to join'}
              </button>
            ) : null}
            {status === 'pending' ? (
              <span className="ch-tag is-pending">
                <Clock size={13} /> Request pending
              </span>
            ) : null}
            <Link className="fc-btn fc-btn-outline fc-btn-sm" to={getClubPath('clubs')}>
              Browse clubs
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const institution = state.institutions.find((item) => item.id === club.institutionId);
  const members = (club.members || []).filter((member) => isApprovedMemberStatus(member.status));
  const coordinator = state.people.find((person) => person.id === club.coordinatorId);
  const meId = state.currentStudent.id;
  const myMembership = findStudentMembership(club, state.currentStudent);
  const nextEvent = upcoming[0] || null;
  const about = club.description || club.tagline || '';

  const counts = {
    feed: (state.posts || []).filter((post) => post.clubId === club.id).length,
    events: upcoming.length,
    members: members.length,
  };

  const eventAction = (activity) => {
    if (isActivityRegistered(activity.id)) {
      return (
        <button
          type="button"
          className="ch-btn ch-btn--ghost"
          onClick={() => cancelActivityRegistration(activity.id)}
          title="Cancel your registration"
        >
          <Check size={14} /> Going
        </button>
      );
    }
    const full = activity.capacity > 0 && (activity.registrations || []).length >= activity.capacity;
    return (
      <button type="button" className="ch-btn" disabled={full} onClick={() => registerForActivity(activity.id)}>
        {full ? 'Full' : 'Join'}
      </button>
    );
  };

  const eventRow = (activity, isPast = false) => (
    <div key={activity.id} className={`ch-event ${isPast ? 'is-past' : ''}`}>
      <DateTile value={activity.startDate || activity.date} />
      <button type="button" className="ch-event__body" onClick={() => setSelectedActivity(activity)}>
        <strong>{activity.title}</strong>
        <span>{[activity.time, modeLabel(activity.mode)].filter(Boolean).join(' · ')}</span>
        {activity.location ? (
          <span className="ch-event__place">
            <MapPin size={12} /> {activity.location}
          </span>
        ) : null}
      </button>
      {!isPast ? eventAction(activity) : null}
    </div>
  );

  return (
    <div className="club-container ch-page" style={themeVars}>
      <Link className="ch-back" to={getClubPath('my-space')}>
        <ArrowLeft size={15} /> My clubs
      </Link>

      <section className="ch-card ch-head">
        <div className="ch-cover" aria-hidden="true" />
        <div className="ch-head__row">
          <span className="ch-avatar ch-avatar--lg" aria-hidden="true">
            {initialsOf(club.name)}
          </span>
          <div className="ch-head__info">
            <h1>{club.name}</h1>
            <p>
              {[
                categoryLabel(club.category),
                institution?.name,
                `${members.length} ${members.length === 1 ? 'member' : 'members'}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="ch-joined" ref={menuRef}>
            <button
              type="button"
              className="ch-joined__btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Check size={15} /> Joined <ChevronDown size={14} />
            </button>
            {menuOpen ? (
              <div className="ch-joined__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmLeave(true);
                  }}
                >
                  <LogOut size={14} /> Leave club
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <nav className="ch-tabs" role="tablist" aria-label="Club sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`ch-tab ${tab === item.id ? 'is-on' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {counts[item.id] ? <span>{counts[item.id]}</span> : null}
            </button>
          ))}
        </nav>
      </section>

      <div className="ch-layout">
        <main className="ch-main">
          {tab === 'feed' ? <CommunityPage lockedClubId={club.id} embedded /> : null}

          {tab === 'events' ? (
            <>
              <section className="ch-card ch-section">
                <h2>Upcoming</h2>
                {upcoming.length === 0 ? (
                  <p className="ch-empty">No upcoming events. They show up here as soon as the club schedules one.</p>
                ) : (
                  <div className="ch-list">{upcoming.map((activity) => eventRow(activity))}</div>
                )}
              </section>
              {past.length > 0 ? (
                <section className="ch-card ch-section">
                  <h2>Past</h2>
                  <div className="ch-list">{past.slice(0, 8).map((activity) => eventRow(activity, true))}</div>
                </section>
              ) : null}
            </>
          ) : null}

          {tab === 'members' ? (
            <section className="ch-card ch-section">
              {coordinator ? (
                <>
                  <h2>Club lead</h2>
                  <div className="ch-list ch-list--spaced">
                    <div className="ch-person">
                      <span className="ch-avatar" aria-hidden="true">
                        {initialsOf(coordinator.name)}
                      </span>
                      <div>
                        <strong>{coordinator.name}</strong>
                        <span>{coordinator.role || 'Coordinator'}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              <h2>
                Members <span className="ch-count">{members.length}</span>
              </h2>
              <div className="ch-list">
                {members.map((member) => (
                  <div key={member.id} className="ch-person">
                    <span className="ch-avatar ch-avatar--soft" aria-hidden="true">
                      {initialsOf(member.studentName)}
                    </span>
                    <div>
                      <strong>
                        {member.studentName || 'Member'}
                        {member.studentId === meId ? <em> · You</em> : null}
                      </strong>
                      <span>{member.joinedAt ? `Joined ${formatDay(member.joinedAt)}` : 'Member'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="ch-side">
          <section className="ch-card ch-section">
            <h2>About</h2>
            {about ? <p className="ch-about">{about}</p> : null}
            <ul className="ch-facts">
              {club.meetingSchedule ? (
                <li>
                  <CalendarDays size={14} /> {club.meetingSchedule}
                </li>
              ) : null}
              {club.location ? (
                <li>
                  <MapPin size={14} /> {club.location}
                </li>
              ) : null}
              {coordinator ? (
                <li>
                  <UserRound size={14} /> Led by {coordinator.name}
                </li>
              ) : null}
              {myMembership?.joinedAt ? (
                <li>
                  <Check size={14} /> You joined {formatDay(myMembership.joinedAt)}
                </li>
              ) : null}
            </ul>
          </section>

          <section className="ch-card ch-section">
            <h2>Next event</h2>
            {nextEvent ? (
              <div className="ch-list">{eventRow(nextEvent)}</div>
            ) : (
              <p className="ch-empty ch-empty--left">Nothing scheduled yet.</p>
            )}
          </section>

          <section className="ch-card ch-section">
            <h2>Notices</h2>
            {notices.length === 0 ? (
              <p className="ch-empty ch-empty--left">No notices from the club admin yet.</p>
            ) : (
              <div className="ch-list">
                {notices.slice(0, 5).map((item) => (
                  <article key={item.id} className="ch-notice">
                    <span className="ch-notice__icon" aria-hidden="true">
                      <Megaphone size={14} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                      <span>{[item.submittedByName, formatDay(item.createdAt)].filter(Boolean).join(' · ')}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      <ConfirmDialog
        open={confirmLeave}
        title={`Leave ${club.name}?`}
        body="You will stop seeing this club's posts, events and notices. You can request to join again later."
        confirmLabel="Leave club"
        onConfirm={() => {
          setConfirmLeave(false);
          leaveOrCancelClub(club.id);
          navigate(getClubPath('my-space'));
        }}
        onClose={() => setConfirmLeave(false)}
      />
    </div>
  );
};

export default ClubHomePage;
