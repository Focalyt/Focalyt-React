import { getApiBaseSafe } from './collegeApi';

type Json = Record<string, unknown>;
type QueryValue = string | number | boolean | null | undefined;
type Query = Record<string, QueryValue>;

function buildUrl(pathname: string, params?: Query): string {
  const base = getApiBaseSafe();
  if (!base) {
    throw new Error('Set API_URL in androidApp/.env');
  }
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const url = `${base}${path}`;
  if (!params) return url;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
  return qs ? `${url}?${qs}` : url;
}

async function readBody(res: Response): Promise<Json> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Json;
  } catch {
    throw new Error(text.slice(0, 200) || 'Invalid response from server');
  }
}

export async function getJson(
  pathname: string,
  token?: string,
  params?: Query,
): Promise<Json> {
  const url = buildUrl(pathname, params);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { 'x-auth': token } : {}),
      },
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Network error');
  }
  return readBody(res);
}

export async function postJson(
  pathname: string,
  body: Json,
  token?: string,
): Promise<Json> {
  return sendJson('POST', pathname, body, token);
}

export async function putJson(
  pathname: string,
  body: Json,
  token?: string,
): Promise<Json> {
  return sendJson('PUT', pathname, body, token);
}

async function sendJson(
  method: 'POST' | 'PUT',
  pathname: string,
  body: Json,
  token?: string,
): Promise<Json> {
  const url = buildUrl(pathname);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { 'x-auth': token } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Network error');
  }
  return readBody(res);
}
