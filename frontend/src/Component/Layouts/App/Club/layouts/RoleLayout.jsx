import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { STAFF_ROLES, ROLE_LABELS } from '../../../../../config/club/roles';
import { STUDENT_NAV, STUDENT_MORE_NAV, STAFF_NAV } from '../../../../../config/club/navigation';
import { useClub } from '../../../../../contexts/ClubContext';
import { ToastViewport } from '../../../../../Pages/App/Club/Components/ToastViewport';
import { RoleSwitcher } from '../../../../../Pages/App/Club/Components/cms/RoleSwitcher';
import { Can } from '../../../../../Pages/App/Club/Components/cms/Can';
import { usePermission } from '../../../../../Pages/App/Club/hooks/usePermission';

export const RoleLayout = () => {
  const {
    activeRole,
    getClubPath,
    resetDemoData,
    state,
    mode,
    assignedColleges,
    cmsStatus,
    cmsError,
    isLiveMode,
    refreshLiveCms,
  } = useClub();
  const { can } = usePermission();
  const location = useLocation();
  const isStaffPortal = mode === 'admin' || mode === 'club_admin' || mode === 'company';
  const isStaff = isStaffPortal || STAFF_ROLES.includes(activeRole);
  const isLiveClubAdmin = mode === 'club_admin';
  const hideTopTabs = isLiveMode && (mode === 'admin' || mode === 'club_admin');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const items = (isStaff ? STAFF_NAV : STUDENT_NAV).filter((item) => {
    if (!can(item.permission)) return false;
    if (item.roles && !item.roles.includes(activeRole)) return false;
    return true;
  });

  const moreItems = isStaff || isStaffPortal
    ? []
    : STUDENT_MORE_NAV.filter((item) => {
        if (!can(item.permission)) return false;
        if (item.slug === 'positions' && !state.settings?.positionsFeatureEnabled) return false;
        return true;
      });

  const moreActive = moreItems.some((item) => location.pathname.includes(`/${item.slug}`));

  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className={`club-portal-shell ${isStaff ? 'is-staff' : 'is-student'} ${isLiveClubAdmin ? 'is-club-admin' : ''}`}>
      {isLiveMode && !hideTopTabs && (
        <div className="cms-demo-banner">
          {assignedColleges.length
            ? `${ROLE_LABELS[activeRole] || 'Club'} · ${assignedColleges.map((c) => c.name).join(', ')}.`
            : isStaff
              ? 'No college assigned yet. Club actions stay limited until a campus is assigned.'
              : 'Student Club — browse every club created by Club Admins.'}
        </div>
      )}
      {isStaff && !isLiveMode && (
        <>
          <div className="cms-demo-banner">
            Simulated Club frontend only — actions stay in this browser and are not saved to a server.
          </div>
          <div className="cms-toolbar">
            <span className="pill pill-pink">{ROLE_LABELS[activeRole]}</span>
            <RoleSwitcher />
            <Can permission="demo.reset">
              <button type="button" className="fc-btn fc-btn-outline fc-btn-sm" onClick={resetDemoData}>
                Reset demo data
              </button>
            </Can>
          </div>
        </>
      )}

      {!hideTopTabs && (
      <nav className="club-portal-tabs" aria-label="Club sections">
        {items.map((item) => (
          <NavLink
            key={item.slug}
            to={getClubPath(item.slug)}
            className={({ isActive }) => `club-portal-tab ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}

        {moreItems.length > 0 && (
          <div className="club-more-wrap" ref={moreRef}>
            <button
              type="button"
              className={`club-portal-tab club-more-btn ${moreActive || moreOpen ? 'active' : ''}`}
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
            >
              More <ChevronDown size={14} />
            </button>
            {moreOpen && (
              <div className="club-more-menu" role="menu">
                {moreItems.map((item) => (
                  <NavLink
                    key={item.slug}
                    to={getClubPath(item.slug)}
                    role="menuitem"
                    className={({ isActive }) => `club-more-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
      )}

      <main>
        {isLiveMode && cmsStatus === 'loading' && (
          <div className="club-list-page">
            <p className="club-list-page__empty">Loading club data…</p>
          </div>
        )}
        {isLiveMode && cmsStatus === 'error' && (
          <div className="club-list-page">
            <p className="club-list-page__empty">{cmsError || 'Could not load club data.'}</p>
            <button type="button" className="fc-btn fc-btn-primary fc-btn-sm" onClick={() => refreshLiveCms()}>
              Retry
            </button>
          </div>
        )}
        {(!isLiveMode || cmsStatus === 'ready') && <Outlet />}
      </main>
      <ToastViewport />
    </div>
  );
};
