import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../Components/cms/PageHeader';
import { StatCard } from '../Components/cms/StatCard';
import { useClub } from '../../../../contexts/ClubContext';

export const StudentOverviewPage = () => {
  const { state, getClubPath } = useClub();
  const studentId = state.currentStudent.id;
  const joined = state.clubs.filter((c) =>
    (c.members || []).some((m) => m.studentId === studentId && (m.status === 'joined' || m.status === 'approved'))
  ).length;
  const pending = state.clubs.filter((c) =>
    (c.members || []).some((m) => m.studentId === studentId && m.status === 'pending')
  ).length;
  const registered = state.activities.filter((a) =>
    a.registrations.some((r) => r.studentId === studentId)
  ).length;

  return (
    <div className="section-white" style={{ paddingTop: 28 }}>
      <div className="club-container">
        <PageHeader
          eyebrow="Student"
          title={`Hi, ${state.currentStudent.name.split(' ')[0]}`}
          subtitle="Your clubs, activities, points, and campus community in one place."
        />
        <div className="myspace-stats-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Joined clubs" value={joined} />
          <StatCard label="Pending joins" value={pending} />
          <StatCard label="Joined events" value={registered} />
          <StatCard label="Points" value={state.currentStudent.points || 0} hint="Join a club +50 · Attend +40" />
        </div>
        <div className="cards-grid-2">
          <div className="form-card">
            <h3 style={{ marginBottom: 10 }}>Continue</h3>
            <div className="club-quick-links">
              <Link className="club-quick-link" to={getClubPath('clubs')}>Find a club</Link>
              <Link className="club-quick-link" to={getClubPath('whats-on')}>See events</Link>
              <Link className="club-quick-link" to={getClubPath('my-space')}>My clubs</Link>
              <Link className="club-quick-link" to={getClubPath('rewards')}>Rewards</Link>
            </div>
          </div>
          <div className="form-card">
            <h3 style={{ marginBottom: 10 }}>Latest announcements & updates</h3>
            {state.notifications
              .filter((n) => n.role === 'student')
              .slice(0, 4)
              .map((n) => (
                <p key={n.id} style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span className="pill pill-pink" style={{ marginRight: 6, padding: '2px 7px', fontSize: '0.65rem' }}>
                    Update
                  </span>
                  <strong style={{ color: 'var(--text-plum)' }}>{n.title}.</strong> {n.body}
                </p>
              ))}
            {state.announcements.slice(0, 3).map((a) => (
              <p key={a.id} style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text-plum)' }}>{a.title}.</strong> {a.body}
              </p>
            ))}
            {state.notifications.filter((n) => n.role === 'student').length === 0 &&
              state.announcements.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  No recent notices or updates yet.
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverviewPage;
