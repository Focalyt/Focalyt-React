import type { AuthUser, UserPermissions } from './authTypes';
import { fetchCollegePermissions } from '../services/collegeApi';

export async function refreshUserPermissions(
  user: AuthUser,
): Promise<AuthUser> {
  if (!user.token || user.role !== 2) return user;
  try {
    const data = await fetchCollegePermissions(user.token);
    if (data.status === true && data.permissions) {
      return {
        ...user,
        permissions: data.permissions as UserPermissions,
      };
    }
  } catch {
    // Keep cached user when offline
  }
  return user;
}
