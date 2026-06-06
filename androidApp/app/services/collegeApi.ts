import { API_URL, GOOGLE_OAUTH_REDIRECT_URI, WEB_APP_URL } from '@env';
import { getJson } from './apiClient';

type Json = Record<string, unknown>;

function normalizeWebOrigin(raw: string): string {
  let base = raw.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/+$/, '');
}

/** College portal origin (React app), NOT the /api base. */
export function getWebAppBaseSafe(): string | null {
  const explicit =
    WEB_APP_URL != null ? normalizeWebOrigin(String(WEB_APP_URL)) : '';
  if (explicit) return explicit;

  const redirect =
    GOOGLE_OAUTH_REDIRECT_URI != null
      ? normalizeWebOrigin(String(GOOGLE_OAUTH_REDIRECT_URI))
      : '';
  if (redirect) return redirect;

  const apiBase = getApiBaseSafe();
  if (!apiBase) return null;

  // API_URL=https://focalyt.com/api → portal at https://focalyt.com
  if (/\/api$/i.test(apiBase)) {
    return apiBase.replace(/\/api$/i, '');
  }
  return apiBase;
}

export function buildInstituteWebUrl(
  pathname: string,
  query: Record<string, string> = {},
): string | null {
  const base = getWebAppBaseSafe();
  if (!base) return null;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== '')
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    )
    .join('&');
  return qs ? `${base}${path}?${qs}` : `${base}${path}`;
}

/** Same route as web: /institute/lrp?b2bLeadId=&mode=add */
export function b2bLrpAddUrl(leadId: string): string | null {
  if (!leadId) return null;
  return buildInstituteWebUrl('/institute/lrp', {
    b2bLeadId: leadId,
    mode: 'add',
    embedded: '1',
  });
}

/** Same route as web: /institute/lrp-view?b2bLeadId= */
export function b2bLrpViewUrl(leadId: string): string | null {
  if (!leadId) return null;
  return buildInstituteWebUrl('/institute/lrp-view', {
    b2bLeadId: leadId,
    embedded: '1',
  });
}

export function getApiBaseSafe(): string | null {
  const raw = API_URL != null ? String(API_URL).trim() : '';
  if (!raw) {
    return null;
  }
  const noQuotes = raw.replace(/^['"]|['"]$/g, '');
  let base = noQuotes.replace(/\s+/g, '');
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  return base.replace(/\/+$/, '');
}

function requireBase(): string {
  const b = getApiBaseSafe();
  if (!b) {
    throw new Error('Set API_URL in androidApp/.env (e.g. API_URL=https://your-api.com)');
  }
  return b;
}

export function apiErrorMessage(data: Json): string | undefined {
  const m = data.message ?? data.error;
  return typeof m === 'string' ? m : undefined;
}

/** 10-digit mobile, or email — strips +91 / spaces from phone input. */
export function normalizeOtpUserInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.length === 10 ? digits : trimmed;
}

/** Paths under express `router.use('/api', apiRoutes)` when API_URL ends with `/api`. */
function resolveApiPath(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const base = requireBase();
  if (/\/api$/i.test(base) && path.startsWith('/api/')) {
    return path.slice(4);
  }
  return path;
}

async function postJson(pathname: string, body: Json): Promise<Json> {
  const base = requireBase();
  const path = resolveApiPath(pathname);
  const url = `${base}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new Error(msg);
  }
  const text = await res.text();
  let data: Json = {};
  if (text) {
    try {
      data = JSON.parse(text) as Json;
    } catch {
      const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (/cannot post/i.test(plain) || res.status === 404) {
        throw new Error(
          'OTP service unavailable. Server update required — contact support.',
        );
      }
      throw new Error(plain.slice(0, 200) || 'Invalid response from server');
    }
  }
  if (!res.ok && data.status !== true) {
    throw new Error(apiErrorMessage(data) || `Request failed (${res.status})`);
  }
  return data;
}

async function postPortalJson(pathname: string, body: Json): Promise<Json> {
  const portal = getWebAppBaseSafe();
  if (!portal) {
    throw new Error('Set API_URL or WEB_APP_URL in androidApp/.env');
  }
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const url = `${portal}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new Error(msg);
  }
  const text = await res.text();
  let data: Json = {};
  if (text) {
    try {
      data = JSON.parse(text) as Json;
    } catch {
      throw new Error(text.slice(0, 200) || 'Invalid response from server');
    }
  }
  return data;
}

export async function fetchCollegePermissions(token: string): Promise<Json> {
  return getJson('/college/permission', token);
}

export async function collegePasswordLogin(
  userInput: string,
  password: string,
): Promise<Json> {
  return postPortalJson('/college/login', {
    userInput,
    password,
    module: 'college',
  });
}

export async function collegeOtpVerifyLogin(
  userInput: string,
  otp: string,
): Promise<Json> {
  const input = normalizeOtpUserInput(userInput);
  return postJson('/api/otpCollegeLogin', { userInput: input, otp });
}

export async function collegeSendOtp(userInput: string): Promise<Json> {
  const input = normalizeOtpUserInput(userInput);
  return postJson('/api/sendOtp', { userInput: input, module: 'college' });
}

export async function collegeVerifyOtpReset(
  userInput: string,
  otp: string,
): Promise<Json> {
  return postJson('/api/verifyOtp', {
    userInput,
    otp,
    module: 'college',
    purpose: 'reset_password',
  });
}

export async function collegeResetPassword(
  userInput: string,
  password: string,
): Promise<Json> {
  return postJson('/college/users/reset-password', {
    userInput,
    password,
    module: 'college',
  });
}
