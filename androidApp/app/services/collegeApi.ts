import { API_URL } from '@env';

type Json = Record<string, unknown>;

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

async function postJson(pathname: string, body: Json): Promise<Json> {
  const base = requireBase();
  const url = `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
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

export async function collegePasswordLogin(
  userInput: string,
  password: string,
): Promise<Json> {
  return postJson('/college/login', {
    userInput,
    password,
    module: 'college',
  });
}

export async function collegeOtpVerifyLogin(
  userInput: string,
  otp: string,
): Promise<Json> {
  return postJson('/api/otpCollegeLogin', { userInput, otp });
}

export async function collegeSendOtp(userInput: string): Promise<Json> {
  return postJson('/api/sendOtp', { userInput, module: 'college' });
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
