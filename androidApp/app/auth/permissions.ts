import type { AuthUser, CustomPermissions, UserPermissions } from './authTypes';

function asPermissions(raw: unknown): UserPermissions | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as UserPermissions;
}

function permissionType(user: AuthUser): string {
  const t = asPermissions(user.permissions)?.permission_type;
  return typeof t === 'string' ? t.trim() : '';
}

/** Admin / default college admin — full access to all modules and actions. */
export function isCollegeAdmin(user: AuthUser | null | undefined): boolean {
  if (!user || user.role !== 2) return false;
  if (user.isDefaultAdmin) return true;
  return permissionType(user).toLowerCase() === 'admin';
}

function isCollegeViewOnly(user: AuthUser): boolean {
  const t = permissionType(user).toLowerCase();
  return t === 'view only' || t === 'view_only';
}

/** Any college permission flag — Admin always true (web: permission_type === 'Admin'). */
export function hasCollegePermission(
  user: AuthUser | null | undefined,
  key: keyof CustomPermissions,
): boolean {
  if (!user || user.role !== 2) return false;
  if (isCollegeAdmin(user)) return true;
  if (permissionType(user) === 'Custom') {
    return !!asPermissions(user.permissions)?.custom_permissions?.[key];
  }
  if (isCollegeViewOnly(user)) {
    return key === 'can_view_leads' || key === 'can_view_leads_b2b';
  }
  return false;
}

/** Same rules as web institute sidebar (B2B Sales). */
export function canAccessB2B(user: AuthUser | null | undefined): boolean {
  if (!user || user.role !== 2) return false;
  if (isCollegeAdmin(user)) return true;
  if (isCollegeViewOnly(user)) return true;
  if (permissionType(user) === 'Custom') {
    return !!asPermissions(user.permissions)?.custom_permissions
      ?.can_view_leads_b2b;
  }
  return false;
}

/** Same rules as web institute sidebar (B2C Sales). */
export function canAccessB2C(user: AuthUser | null | undefined): boolean {
  if (!user || user.role !== 2) return false;
  if (isCollegeAdmin(user)) return true;
  if (isCollegeViewOnly(user)) return true;
  if (permissionType(user) === 'Custom') {
    return !!asPermissions(user.permissions)?.custom_permissions?.can_view_leads;
  }
  return false;
}

export type CollegeModuleAccess = {
  b2b: boolean;
  b2c: boolean;
  isAdmin: boolean;
};

export function getCollegeModuleAccess(
  user: AuthUser | null | undefined,
): CollegeModuleAccess {
  const admin = isCollegeAdmin(user);
  return {
    b2b: canAccessB2B(user),
    b2c: canAccessB2C(user),
    isAdmin: admin,
  };
}
