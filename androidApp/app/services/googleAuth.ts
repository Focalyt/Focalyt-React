import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_REDIRECT_URI } from '@env';
import { getApiBaseSafe } from './collegeApi';
import { postJson } from './apiClient';
import type { AuthUser, GoogleAuthToken } from '../auth/authTypes';

const DEFAULT_CLIENT_ID =
  '449914901350-ibgtfl0tbog7vb91u7d5s9cmo92ba1kg.apps.googleusercontent.com';

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
];

export function getOAuthClientId(): string {
  return GOOGLE_OAUTH_CLIENT_ID || DEFAULT_CLIENT_ID;
}

export function getOAuthRedirectUri(): string {
  if (GOOGLE_OAUTH_REDIRECT_URI && GOOGLE_OAUTH_REDIRECT_URI.trim()) {
    return GOOGLE_OAUTH_REDIRECT_URI.trim();
  }
  const apiBase = getApiBaseSafe();
  if (apiBase) {
    try {
      const u = new URL(apiBase);
      return `${u.protocol}//${u.host}`;
    } catch {
      // ignore
    }
  }
  return 'https://focalyt.com';
}

export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getOAuthClientId(),
    redirect_uri: getOAuthRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: `auth_${Date.now()}`,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleAuthExchangeResult = {
  ok: boolean;
  googleAuthToken?: GoogleAuthToken;
  message?: string;
};

const B64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function pureBase64Decode(input: string): string {
  let str = input.replace(/=+$/, '');
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const v = B64_CHARS.indexOf(ch);
    if (v < 0) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
}

function base64UrlDecode(b64url: string): string {
  const s = b64url.replace(/-/g, '+').replace(/_/g, '/');
  let decoded = '';
  const atobFn = (globalThis as { atob?: (s: string) => string }).atob;
  try {
    if (typeof atobFn === 'function') {
      const pad = s.length % 4;
      const padded = pad ? s + '='.repeat(4 - pad) : s;
      decoded = atobFn(padded);
    } else {
      decoded = pureBase64Decode(s);
    }
  } catch {
    decoded = pureBase64Decode(s);
  }
  if (!decoded) return '';
  try {
    return decodeURIComponent(
      decoded
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );
  } catch {
    return decoded;
  }
}

type IdTokenClaims = {
  email?: string;
  name?: string;
  picture?: string;
};

export function decodeGoogleIdToken(idToken?: string): IdTokenClaims {
  if (!idToken || typeof idToken !== 'string') return {};
  const parts = idToken.split('.');
  if (parts.length < 2) return {};
  const json = base64UrlDecode(parts[1]);
  if (!json) return {};
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return {
      email: typeof obj.email === 'string' ? obj.email : undefined,
      name: typeof obj.name === 'string' ? obj.name : undefined,
      picture: typeof obj.picture === 'string' ? obj.picture : undefined,
    };
  } catch {
    return {};
  }
}

function enrichGoogleToken(token: GoogleAuthToken): GoogleAuthToken {
  if (token.email) return token;
  const claims = decodeGoogleIdToken(token.idToken);
  if (!claims.email && !claims.name && !claims.picture) return token;
  return {
    ...token,
    email: token.email || claims.email,
    name: token.name || claims.name,
    picture: token.picture || claims.picture,
  };
}

export async function exchangeGoogleCode(
  code: string,
  user: AuthUser,
): Promise<GoogleAuthExchangeResult> {
  const apiBase = getApiBaseSafe();
  if (!apiBase) return { ok: false, message: 'API_URL not configured' };

  // `/api/getgoogleauth` is mounted at API root (without /api prefix issue):
  // the backend file is api.js, commonRoutes prefixed with /api in main app.
  const res = await postJson(
    '/api/getgoogleauth',
    {
      code,
      redirectUri: getOAuthRedirectUri(),
      user: { _id: user._id, name: user.name, email: user.email },
    },
    user.token,
  );

  if (res.success === true && res.data && typeof res.data === 'object') {
    return {
      ok: true,
      googleAuthToken: enrichGoogleToken(res.data as GoogleAuthToken),
    };
  }
  return {
    ok: false,
    message:
      typeof (res as { error?: string }).error === 'string'
        ? (res as { error?: string }).error
        : typeof res.message === 'string'
          ? (res.message as string)
          : 'Failed to connect Google Calendar',
  };
}

export function isGoogleConnected(user?: AuthUser | null): boolean {
  return !!user?.googleAuthToken?.accessToken;
}

export function getGoogleEmail(user?: AuthUser | null): string | undefined {
  const t = user?.googleAuthToken;
  if (!t) return undefined;
  if (t.email) return t.email;
  return decodeGoogleIdToken(t.idToken).email;
}

export function getGoogleProfile(user?: AuthUser | null): {
  email?: string;
  name?: string;
  picture?: string;
} {
  const t = user?.googleAuthToken;
  if (!t) return {};
  if (t.email || t.name || t.picture) {
    return { email: t.email, name: t.name, picture: t.picture };
  }
  return decodeGoogleIdToken(t.idToken);
}
