import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClub } from '../../../../../contexts/ClubContext';
import { usePermission } from '../../hooks/usePermission';
import { DEFAULT_HOME_SLUG, STAFF_NAV, STUDENT_NAV } from '../../../../../config/club/navigation';
import { STAFF_ROLES } from '../../../../../config/club/roles';

export const ClubRouteGuard = ({ permission, roles, children }) => {
  const { activeRole, getClubPath, isLiveMode, cmsStatus, state } = useClub();
  const { can } = usePermission();

  if (isLiveMode && cmsStatus === 'loading') return null;
  if (isLiveMode && cmsStatus === 'error') {
    return (
      <div className="empty-state-box">
        <strong>Club could not load</strong>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Refresh the page or try again. Club actions stay locked until the server responds.
        </p>
      </div>
    );
  }

  const navItems = STAFF_ROLES.includes(activeRole) ? STAFF_NAV : STUDENT_NAV;
  const allowedItem = navItems.find(
    (item) =>
      item.permission !== permission &&
      can(item.permission) &&
      (!item.roles || item.roles.includes(activeRole))
  );
  const fallbackSlug = allowedItem?.slug || DEFAULT_HOME_SLUG[activeRole] || 'dashboard';

  if (roles && !roles.includes(activeRole)) {
    return <Navigate to={getClubPath(fallbackSlug)} replace />;
  }
  if (permission && !can(permission)) {
    if (allowedItem) {
      return <Navigate to={getClubPath(allowedItem.slug)} replace />;
    }
    const isStudent = !STAFF_ROLES.includes(activeRole);
    return (
      <div className="empty-state-box">
        <strong>You do not have access to this Club page</strong>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isStudent
            ? 'Refresh the page, or open Club again from Home.'
            : 'Ask an Institute Admin to grant Club Admin, SSE, or SE in Access Management.'}
        </p>
      </div>
    );
  }
  if (permission === 'positions.request' && state.settings?.positionsFeatureEnabled === false) {
    return <Navigate to={getClubPath('discover')} replace />;
  }

  return children;
};

export default ClubRouteGuard;
