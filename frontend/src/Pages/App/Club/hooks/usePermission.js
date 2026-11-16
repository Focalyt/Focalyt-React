import { roleHasPermission } from '../../../../config/club/permissions';
import { CLUB_ASSIGNABLE_KEYS } from '../../../../config/club/clubAssignablePermissions';
import { useClub } from '../../../../contexts/ClubContext';

export function usePermission() {
  const { activeRole, isLiveMode, livePermissions } = useClub();

  const can = (permission) => {
    if (isLiveMode && livePermissions) {
      if (Object.prototype.hasOwnProperty.call(livePermissions, permission)) {
        return Boolean(livePermissions[permission]);
      }
      if (CLUB_ASSIGNABLE_KEYS.includes(permission)) {
        return false;
      }
    }
    return roleHasPermission(activeRole, permission);
  };

  return { can, activeRole };
}
