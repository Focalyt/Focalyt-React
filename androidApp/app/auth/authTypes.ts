export type UserRole = 1 | 2 | 3 | 4;

export type AuthUser = {
  _id: string;
  name?: string;
  role: UserRole;
  email?: string;
  mobile?: number | string;
  token?: string;
  collegeName?: string;
  collegeId?: string;
  isDefaultAdmin?: boolean;
  permissions?: unknown;
};

