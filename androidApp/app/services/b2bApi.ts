import { getJson, postJson } from './apiClient';

export type B2BPeriod = 'last7' | 'last30' | 'last90';

type Json = Record<string, unknown>;

export type B2BLead = {
  _id: string;
  businessName?: string;
  concernPersonName?: string;
  designation?: string;
  mobile?: string | number;
  email?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  status?: { _id?: string; title?: string; name?: string };
  leadCategory?: { _id?: string; name?: string };
};

export type B2BStatusCount = {
  _id?: string;
  name?: string;
  count?: number;
  color?: string;
};

export type B2BDashboardData = {
  overview: {
    totalLeads: number;
    activeLeads: number;
    convertedLeads: number;
    pendingFollowups: number;
    totalRevenue: number;
  };
  recentLeads?: Array<{
    businessName?: string;
    concernPersonName?: string;
    designation?: string;
    leadCategory?: string;
    mobile?: string | number;
    status?: string;
    createdAt?: string;
  }>;
  upcomingFollowups?: Array<{
    businessName?: string;
    concernPersonName?: string;
    mobile?: string | number;
    scheduledDate?: string;
    priority?: 'High' | 'Medium' | 'Low' | string;
  }>;
};

export async function fetchB2BDashboard(
  token: string,
  period: B2BPeriod,
): Promise<{ ok: boolean; data?: B2BDashboardData; message?: string }> {
  const days = period === 'last7' ? 7 : period === 'last90' ? 90 : 30;
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const res = await getJson('/college/b2b/dashboard', token, {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    period,
  });
  if (res.status === true && res.data) {
    return { ok: true, data: res.data as B2BDashboardData };
  }
  return {
    ok: false,
    message: typeof res.message === 'string' ? res.message : 'Failed to load dashboard',
  };
}

export async function fetchB2BStatusCounts(
  token: string,
): Promise<{
  ok: boolean;
  totalLeads: number;
  statusCounts: B2BStatusCount[];
  message?: string;
}> {
  const res = await getJson('/college/b2b/leads/status-count', token);
  if (res.status === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      totalLeads: typeof d.totalLeads === 'number' ? d.totalLeads : 0,
      statusCounts: Array.isArray(d.statusCounts)
        ? (d.statusCounts as B2BStatusCount[])
        : [],
    };
  }
  return {
    ok: false,
    totalLeads: 0,
    statusCounts: [],
    message: typeof res.message === 'string' ? res.message : 'Failed to load counts',
  };
}

export async function fetchB2BLeads(
  token: string,
  options: { page?: number; status?: string; search?: string; limit?: number } = {},
): Promise<{
  ok: boolean;
  leads: B2BLead[];
  totalLeads: number;
  totalPages: number;
  message?: string;
}> {
  const params: Record<string, string | number | undefined> = {
    page: options.page ?? 1,
  };
  if (options.limit) params.limit = options.limit;
  if (options.status) params.status = options.status;
  if (options.search) params.search = options.search;

  const res = await getJson('/college/b2b/leads', token, params);
  if (res.status === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      leads: Array.isArray(d.leads) ? (d.leads as B2BLead[]) : [],
      totalLeads: typeof d.totalLeads === 'number' ? d.totalLeads : 0,
      totalPages: typeof d.totalPages === 'number' ? d.totalPages : 1,
    };
  }
  return {
    ok: false,
    leads: [],
    totalLeads: 0,
    totalPages: 1,
    message: typeof res.message === 'string' ? res.message : 'Failed to load leads',
  };
}

export type B2BCalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export async function fetchB2BCalendarEvents(
  token: string,
  user: Json,
  range: { start: Date; end: Date },
): Promise<{ ok: boolean; events: B2BCalendarEvent[]; message?: string }> {
  const accessToken = (user.googleAuthToken as Json | undefined)?.accessToken as
    | string
    | undefined;
  if (!accessToken) {
    return {
      ok: false,
      events: [],
      message: 'Google Calendar connect karna hoga (web par login karke).',
    };
  }
  const res = await postJson(
    '/api/getb2bcalendarevents',
    {
      user,
      accessToken,
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    },
    token,
  );
  if (res.success === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      events: Array.isArray(d.events) ? (d.events as B2BCalendarEvent[]) : [],
    };
  }
  return {
    ok: false,
    events: [],
    message: typeof res.error === 'string' ? res.error : 'Failed to load events',
  };
}
