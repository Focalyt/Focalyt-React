import type { AuthUser, UserRole } from './authTypes';

const ROLES: UserRole[] = [1, 2, 3, 4];

function toRole(value: unknown): UserRole {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n === 'number' && ROLES.includes(n as UserRole)) {
    return n as UserRole;
  }
  return 2;
}

/** Coerce API / storage payload into a consistent AuthUser (role as number, _id as string). */
export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o._id;
  if (id == null) return null;
  return {
    ...(o as AuthUser),
    _id: String(id),
    role: toRole(o.role),
  };
}
