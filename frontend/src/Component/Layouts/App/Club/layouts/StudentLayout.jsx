import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Compass, Sparkles, Calendar, Heart, Users } from 'lucide-react';
import { STUDENT_NAV_ITEMS } from '../../../../../config/club/navigationConfig';
import { useClub } from '../../../../../contexts/ClubContext';
import { ToastViewport } from '../../../../../Pages/App/Club/Components/ToastViewport';

export const StudentLayout = () => {
  const { state, getClubPath } = useClub();

  const joinedClubsCount = state.clubs.filter((club) =>
    club.members.some((m) => m.studentId === state.currentStudent.id && (m.status === 'joined' || m.status === 'approved'))
  ).length;

  const pendingClubsCount = state.clubs.filter((club) =>
    club.members.some((m) => m.studentId === state.currentStudent.id && m.status === 'pending')
  ).length;

  const registeredActivitiesCount = state.activities.filter((act) =>
    act.registrations.some((r) => r.studentId === state.currentStudent.id)
  ).length;

  const mySpaceBadgeCount =
    joinedClubsCount +
    pendingClubsCount +
    state.currentStudent.savedActivityIds.length +
    registeredActivitiesCount;

  const getNavIcon = (slug) => {
    switch (slug) {
      case 'discover':
        return <Compass size={15} />;
      case 'clubs':
        return <Users size={15} />;
      case 'whats-on':
        return <Calendar size={15} />;
      case 'my-space':
        return <Heart size={15} />;
      default:
        return <Sparkles size={15} />;
    }
  };

  return (
    <div className="club-portal-shell">
      <nav className="club-portal-tabs" aria-label="Student club sections">
        {STUDENT_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.slug}
            to={getClubPath(item.slug)}
            className={({ isActive }) => `club-portal-tab ${isActive ? 'active' : ''}`}
          >
            {getNavIcon(item.slug)}
            <span>{item.label}</span>
            {item.slug === 'my-space' && mySpaceBadgeCount > 0 && (
              <span className="nav-badge-count">{mySpaceBadgeCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <main>
        <Outlet />
      </main>

      <ToastViewport />
    </div>
  );
};
