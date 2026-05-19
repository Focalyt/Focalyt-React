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
  googleAuthToken?: GoogleAuthToken;
};

