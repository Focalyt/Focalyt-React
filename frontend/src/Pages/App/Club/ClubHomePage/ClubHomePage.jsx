import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  Clock,
  Link2,
  LogOut,
  MapPin,
  Megaphone,
  Search,
  Share2,
  UserPlus,
  UserRound,
  Users,
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

const relativeTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatDay(date.toISOString());
};

const initialsOf = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const campusShortName = (name = '') => {
  const raw = String(name).trim();
  if (!raw) return '';
  const beforeColon = raw.split(':')[0].trim();
  const beforeDash = beforeColon.split(' - ')[0].trim();
  if (beforeDash.length <= 28) return beforeDash;
  return `${beforeDash.slice(0, 26).trim()}…`;
};

const buildGoogleCalendarUrl = (activity) => {
  const title = encodeURIComponent(activity.title || 'Club event');
  const details = encodeURIComponent(activity.description || activity.notes || 'Focalyt Club event');
  const location = encodeURIComponent(activity.location || '');
  const day = String(activity.startDate || activity.date || '').replace(/-/g, '');
  if (!/^\d{8}$/.test(day)) return '';
  const timeMatch = String(activity.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let start = `${day}T100000`;
  let end = `${day}T110000`;
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = timeMatch[2];
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    const hh = String(hour).padStart(2, '0');
    start = `${day}T${hh}${minute}00`;
    const endHour = String((hour + 1) % 24).padStart(2, '0');
    end = `${day}T${endHour}${minute}00`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
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
    notify,
  } = useClub();

  const [tab, setTab] = useState('feed');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [copiedKind, setCopiedKind] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
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

  const clubPosts = useMemo(
    () =>
      (state.posts || [])
        .filter((post) => post.clubId === clubId)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    [clubId, state.posts]
  );

  const theme = getClubTheme(club?.theme);
  const themeVars = {
    '--ch-primary': theme.primary,
    '--ch-deep': theme.deep,
    '--ch-soft': theme.secondary,
    '--ch-bg': theme.bg,
  };

  const coverStyle = club?.bannerSvgDataUrl
    ? { backgroundImage: `url(${club.bannerSvgDataUrl})` }
    : undefined;

  if (!club) {
    return (
      <div className="club-container ch-page" style={themeVars}>
        <section className="ch-missing">
          <p>{cmsStatus === 'loading' ? 'Loading club…' : 'This club is not available on your campus.'}</p>
          {cmsStatus !== 'loading' ? (
            <Link className="fc-btn fc-btn-outline fc-btn-sm" to={getClubPath('clubs')}>
              Browse clubs
            </Link>
          ) : null}
        </section>
      </div>
    );
  }

  const institution = state.institutions.find((item) => item.id === club.institutionId);
  const campusName = campusShortName(institution?.name || '');
  const members = (club.members || []).filter((member) => isApprovedMemberStatus(member.status));
  const coordinator = state.people.find((person) => person.id === club.coordinatorId);
  const tagline = String(club.tagline || '').trim();
  const description = String(club.description || '').trim();
  const about = description || tagline;
  const motif = theme.motif || 'art';
  const officeBearers = (state.positions || [])
    .filter((position) => String(position.clubId) === String(club.id))
    .flatMap((position) =>
      (position.holders || []).map((holder) => ({
        positionTitle: position.title,
        termLabel: position.termLabel || '',
        studentName: holder.studentName || 'Member',
        studentId: holder.studentId,
      }))
    );
  const roleByStudentId = Object.fromEntries(
    officeBearers.map((row) => [String(row.studentId), row.positionTitle])
  );

  const coverClass = `ch-cover motif-${motif} ${club.bannerSvgDataUrl ? 'has-art' : ''}`;

  if (status !== 'approved') {
    return (
      <div className="club-container ch-page" style={themeVars}>
        <Link className="ch-back" to={getClubPath('clubs')}>
          <ArrowLeft size={15} /> All clubs
        </Link>

        <section className="ch-preview">
          <div className={`${coverClass} ch-cover--hero`} style={coverStyle}>
            <div className="ch-cover__shade" />
            <div className="ch-cover__copy">
              <p className="ch-kicker">{categoryLabel(club.category)}</p>
              <h1>{club.name}</h1>
              {tagline ? <p className="ch-meta">{tagline}</p> : null}
              <p className="ch-meta">
                {[campusName, members.length ? `${members.length} members` : 'Campus club']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="ch-preview__body">
            <div className="ch-preview__main">
              <h2>About this club</h2>
              <p>
                {about ||
                  'This is a campus club. Request to join to see the feed, events, notices, and members.'}
              </p>
              <ul className="ch-facts">
                {club.meetingSchedule ? (
                  <li>
                    <CalendarDays size={15} /> {club.meetingSchedule}
                  </li>
                ) : null}
                {club.location ? (
                  <li>
                    <MapPin size={15} /> {club.location}
                  </li>
                ) : null}
                {coordinator ? (
                  <li>
                    <UserRound size={15} /> Led by {coordinator.name}
                  </li>
                ) : null}
                <li>
                  <Users size={15} />{' '}
                  {members.length
                    ? `${members.length} approved ${members.length === 1 ? 'member' : 'members'}`
                    : 'Open to campus students'}
                </li>
              </ul>
            </div>

            <aside className="ch-preview__cta">
              <h2>
                {status === 'pending'
                  ? 'Request sent'
                  : status === 'blocked'
                    ? 'Access closed'
                    : 'Become a member'}
              </h2>
              <p>
                {status === 'pending'
                  ? 'Club admin will review your request. This page unlocks after approval.'
                  : status === 'blocked'
                    ? 'You cannot join this club right now.'
                    : 'Members get the club feed, events, notices, and member list.'}
              </p>
              <div className="ch-preview__actions">
                {status === 'none' || status === 'rejected' ? (
                  <button type="button" className="ch-btn ch-btn--lg" onClick={() => joinOrRequestClub(club.id)}>
                    <UserPlus size={16} /> {status === 'rejected' ? 'Request again' : 'Request to join'}
                  </button>
                ) : null}
                {status === 'pending' ? (
                  <span className="ch-tag is-pending">
                    <Clock size={13} /> Pending approval
                  </span>
                ) : null}
                <Link className="ch-text-link" to={getClubPath('clubs')}>
                  Browse other clubs
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  const meId = state.currentStudent.id;
  const myMembership = findStudentMembership(club, state.currentStudent);
  const myRole = roleByStudentId[String(meId)] || 'Member';
  const nextEvent = upcoming[0] || null;
  const pinnedNotice = notices[0] || null;
  const lastPost = clubPosts[0] || null;
  const nextGoingCount = (nextEvent?.registrations || []).length;
  const faceMembers = members.slice(0, 6);
  const extraMemberCount = Math.max(0, members.length - faceMembers.length);
  const memberPreviewNames = faceMembers
    .map((member) => member.studentName)
    .filter(Boolean)
    .slice(0, 2);
  const filteredMembers = members.filter((member) => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return true;
    const role = roleByStudentId[String(member.studentId)] || '';
    return `${member.studentName || ''} ${role}`.toLowerCase().includes(q);
  });

  const clubPageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${window.location.search}`
      : getClubPath(`clubs/${club.id}`);

  const inviteBlurb = tagline
    ? `Hey! Join ${club.name} on Focalyt — ${tagline}`
    : `Hey! Join ${club.name} on Focalyt Club with me.`;
  const inviteWithLink = `${inviteBlurb}\n${clubPageUrl}`;

  const copyText = async (text, kind, title, description) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopiedKind(kind);
      window.setTimeout(() => setCopiedKind(''), 2200);
      notify(title, description, 'success');
    } catch {
      notify('Could not copy', 'Copy the link from the address bar instead.', 'info');
    }
  };

  const shareClub = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: club.name,
          text: tagline || `Check out ${club.name} on Focalyt Club`,
          url: clubPageUrl,
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    copyText(clubPageUrl, 'share', 'Link copied', 'Share this club page with classmates.');
  };

  const inviteClassmates = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        // Put the link only in `url` so share apps do not paste it twice.
        await navigator.share({
          title: `Join ${club.name}`,
          text: inviteBlurb,
          url: clubPageUrl,
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(inviteWithLink)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
    copyText(inviteWithLink, 'invite', 'Invite ready', 'WhatsApp opened — message is also copied.');
  };

  const counts = {
    feed: clubPosts.length,
    events: upcoming.length,
    members: members.length,
  };

  const eventAction = (activity, { compact = false } = {}) => {
    if (isActivityRegistered(activity.id)) {
      return (
        <button
          type="button"
          className={`ch-btn ch-btn--ghost ${compact ? 'ch-btn--sm' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            cancelActivityRegistration(activity.id);
          }}
          title="Cancel your registration"
        >
          <Check size={14} /> Going
        </button>
      );
    }
    const full = activity.capacity > 0 && (activity.registrations || []).length >= activity.capacity;
    return (
      <button
        type="button"
        className={`ch-btn ${compact ? 'ch-btn--sm' : ''}`}
        disabled={full}
        onClick={(event) => {
          event.stopPropagation();
          registerForActivity(activity.id);
        }}
      >
        {full ? 'Full' : compact ? "I'm in" : 'Join'}
      </button>
    );
  };

  const eventRow = (activity, isPast = false) => {
    const calendarUrl = !isPast ? buildGoogleCalendarUrl(activity) : '';
    return (
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
        <div className="ch-event__actions">
          {!isPast ? eventAction(activity) : null}
          {calendarUrl ? (
            <a
              className="ch-icon-btn"
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              title="Add to Google Calendar"
              onClick={(event) => event.stopPropagation()}
            >
              <CalendarPlus size={15} />
            </a>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="club-container ch-page" style={themeVars}>
      <Link className="ch-back" to={getClubPath('my-space')}>
        <ArrowLeft size={15} /> My clubs
      </Link>

      <header className="ch-head">
        <div className={coverClass} style={coverStyle} aria-hidden="true">
          <div className="ch-cover__shade" />
        </div>
        <div className="ch-identity">
          <span className="ch-avatar ch-avatar--lg" aria-hidden="true">
            {initialsOf(club.name)}
          </span>
          <div className="ch-identity__main">
            <div className="ch-identity__top">
              <div className="ch-head__info">
                <h1 title={club.name}>{club.name}</h1>
                {tagline ? <p className="ch-tagline">{tagline}</p> : null}
                <p className="ch-head__sub">
                  {[
                    categoryLabel(club.category),
                    campusName,
                    `${members.length} ${members.length === 1 ? 'member' : 'members'}`,
                    `You · ${myRole}`,
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
                  <Check size={15} /> {myRole} <ChevronDown size={14} />
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
            <div className="ch-actions">
              <button type="button" className="ch-action" onClick={inviteClassmates}>
                <UserPlus size={14} />
                {copiedKind === 'invite' ? 'Invite ready' : 'Invite classmates'}
              </button>
              <button type="button" className="ch-action" onClick={shareClub}>
                <Share2 size={14} />
                {copiedKind === 'share' ? 'Link copied' : 'Share club'}
              </button>
              <button type="button" className="ch-action" onClick={() => setTab('events')}>
                <CalendarDays size={14} /> View events
              </button>
            </div>
          </div>
        </div>
        <nav className="ch-tabs ch-tabs--sticky" role="tablist" aria-label="Club sections">
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
      </header>

      <div className="ch-layout">
        <main className="ch-main">
          {tab === 'feed' ? (
            <>
              {pinnedNotice ? (
                <article className="ch-pin">
                  <span className="ch-pin__badge">
                    <Megaphone size={13} /> Pinned
                  </span>
                  <strong>{pinnedNotice.title}</strong>
                  <p>{pinnedNotice.body}</p>
                  <span>
                    {[pinnedNotice.submittedByName, formatDay(pinnedNotice.createdAt)].filter(Boolean).join(' · ')}
                  </span>
                </article>
              ) : null}

              {nextEvent ? (
                <div className="ch-next-strip">
                  <button type="button" className="ch-next-strip__hit" onClick={() => setSelectedActivity(nextEvent)}>
                    <DateTile value={nextEvent.startDate || nextEvent.date} />
                    <span className="ch-next-strip__body">
                      <em>Next up</em>
                      <strong>{nextEvent.title}</strong>
                      <span>
                        {[
                          formatDay(nextEvent.startDate || nextEvent.date),
                          nextEvent.time,
                          nextEvent.location,
                          nextGoingCount ? `${nextGoingCount} going` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </button>
                  {eventAction(nextEvent, { compact: true })}
                </div>
              ) : null}

              <CommunityPage lockedClubId={club.id} embedded />
            </>
          ) : null}

          {tab === 'events' ? (
            <>
              <section className="ch-panel">
                <div className="ch-panel__head">
                  <h2>Upcoming events</h2>
                </div>
                {upcoming.length === 0 ? (
                  <div className="ch-empty-card">
                    <CalendarDays size={22} />
                    <strong>No events yet</strong>
                    <p>When practice, matches, or meetups are announced, they show up here.</p>
                  </div>
                ) : (
                  <div className="ch-list">{upcoming.map((activity) => eventRow(activity))}</div>
                )}
              </section>
              {past.length > 0 ? (
                <section className="ch-panel">
                  <div className="ch-panel__head">
                    <h2>Past events</h2>
                  </div>
                  <div className="ch-list">{past.slice(0, 8).map((activity) => eventRow(activity, true))}</div>
                </section>
              ) : null}
            </>
          ) : null}

          {tab === 'members' ? (
            <section className="ch-panel">
              {coordinator ? (
                <>
                  <div className="ch-panel__head">
                    <h2>Club lead</h2>
                  </div>
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
              {officeBearers.length > 0 ? (
                <>
                  <div className="ch-panel__head">
                    <h2>Office-bearers</h2>
                  </div>
                  <div className="ch-list ch-list--spaced">
                    {officeBearers.map((row) => (
                      <div key={`${row.positionTitle}-${row.studentId}`} className="ch-person">
                        <span className="ch-avatar" aria-hidden="true">
                          {initialsOf(row.studentName)}
                        </span>
                        <div>
                          <strong>
                            {row.studentName}
                            {String(row.studentId) === String(meId) ? <em> · You</em> : null}
                          </strong>
                          <span>
                            {row.positionTitle}
                            {row.termLabel ? ` · ${row.termLabel}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="ch-panel__head ch-panel__head--search">
                <h2>
                  Members <span className="ch-count">{members.length}</span>
                </h2>
                {members.length > 6 ? (
                  <label className="ch-search">
                    <Search size={14} />
                    <input
                      type="search"
                      value={memberQuery}
                      onChange={(event) => setMemberQuery(event.target.value)}
                      placeholder="Search members"
                      aria-label="Search members"
                    />
                  </label>
                ) : null}
              </div>
              <div className="ch-list">
                {filteredMembers.length === 0 ? (
                  <p className="ch-empty ch-empty--left">No members match “{memberQuery.trim()}”.</p>
                ) : (
                  filteredMembers.map((member) => {
                    const role = roleByStudentId[String(member.studentId)] || 'Member';
                    const isYou = String(member.studentId) === String(meId);
                    return (
                      <div key={member.id} className="ch-person">
                        <span className="ch-avatar ch-avatar--soft" aria-hidden="true">
                          {initialsOf(member.studentName)}
                        </span>
                        <div>
                          <strong>
                            {member.studentName || 'Member'}
                            {isYou ? <em> · You</em> : null}
                          </strong>
                          <span>
                            {role}
                            {member.joinedAt ? ` · Joined ${formatDay(member.joinedAt)}` : ''}
                          </span>
                        </div>
                        {isYou || role !== 'Member' ? <span className="ch-role-pill">{role}</span> : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="ch-side">
          <section className="ch-panel ch-panel--info">
            <div className="ch-panel__head">
              <h2>Club info</h2>
            </div>
            {tagline && description ? <p className="ch-tagline ch-tagline--side">{tagline}</p> : null}
            {about ? <p className="ch-about">{description || tagline}</p> : null}
            {faceMembers.length > 0 ? (
              <button type="button" className="ch-faces" onClick={() => setTab('members')}>
                <span className="ch-faces__stack" aria-hidden="true">
                  {faceMembers.map((member) => (
                    <span key={member.id || member.studentId} className="ch-faces__avatar">
                      {initialsOf(member.studentName)}
                    </span>
                  ))}
                </span>
                <span className="ch-faces__copy">
                  {memberPreviewNames.length
                    ? `${memberPreviewNames.join(', ')}${
                        extraMemberCount > 0
                          ? ` and ${extraMemberCount} other${extraMemberCount === 1 ? '' : 's'}`
                          : members.length === 1
                            ? ''
                            : ` · ${members.length} members`
                      }`
                    : `${members.length} members`}
                </span>
              </button>
            ) : null}
            <ul className="ch-facts">
              {lastPost ? (
                <li>
                  <Clock size={14} /> Last post {relativeTime(lastPost.createdAt)}
                </li>
              ) : (
                <li>
                  <Clock size={14} /> No posts yet — be the first
                </li>
              )}
              {nextEvent ? (
                <li>
                  <Users size={14} />{' '}
                  {nextGoingCount
                    ? `${nextGoingCount} going to ${nextEvent.title}`
                    : `Next: ${nextEvent.title}`}
                </li>
              ) : null}
              {campusName ? (
                <li>
                  <MapPin size={14} /> {campusName}
                </li>
              ) : null}
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
              {officeBearers.slice(0, 3).map((row) => (
                <li key={`fact-${row.positionTitle}-${row.studentId}`}>
                  <UserRound size={14} /> {row.positionTitle}: {row.studentName}
                </li>
              ))}
              {myMembership?.joinedAt ? (
                <li>
                  <Check size={14} /> You joined {formatDay(myMembership.joinedAt)} · {myRole}
                </li>
              ) : null}
            </ul>
            <button type="button" className="ch-text-link ch-text-link--btn" onClick={shareClub}>
              <Link2 size={13} /> Copy club link
            </button>
          </section>

          {nextEvent ? (
            <section className="ch-panel">
              <div className="ch-panel__head">
                <h2>Next event</h2>
              </div>
              <div className="ch-list">{eventRow(nextEvent)}</div>
            </section>
          ) : null}

          {notices.length > 0 ? (
            <section className="ch-panel">
              <div className="ch-panel__head">
                <h2>Notices</h2>
              </div>
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
            </section>
          ) : null}
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
