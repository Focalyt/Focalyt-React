export type UserRole = 1 | 2 | 3 | 4;

export type GoogleAuthToken = {
  accessToken?: string;
  expiresAt?: string;
  tokenType?: string;
  idToken?: string;
  refreshToken?: string;
  scopes?: string;
  lastUpdated?: string;
  email?: string;
  name?: string;
  picture?: string;
};

export type CustomPermissions = {
  can_view_leads_b2b?: boolean;
  can_view_leads?: boolean;
};

export type UserPermissions = {
  permission_type?: string;
  custom_permissions?: CustomPermissions;
};

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
  permissions?: UserPermissions;
  googleAuthToken?: GoogleAuthToken;
};

