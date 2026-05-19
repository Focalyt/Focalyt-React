import { getJson, postJson, putJson } from './apiClient';

export type B2BPeriod = 'last7' | 'last30' | 'last90';

type Json = Record<string, unknown>;

export type B2BFollowUpSlot = {
  scheduledDate?: string;
  status?: string;
  followUpType?: string;
};

export type B2BLeadDocument = {
  _id?: string;
  name?: string;
  status?: string;
  url?: string;
};

export type B2BLead = {
  _id: string;
  businessName?: string;
  concernPersonName?: string;
  designation?: string;
  mobile?: string | number;
  whatsapp?: string | number;
  email?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  status?: { _id?: string; title?: string; name?: string };
  leadCategory?: {
    _id?: string;
    name?: string;
    documents?: Array<{ name?: string; required?: boolean }>;
  };
  followUpCall?: B2BFollowUpSlot | null;
  followUpVisit?: B2BFollowUpSlot | null;
  followUp?: B2BFollowUpSlot | null;
  documents?: B2BLeadDocument[];
  approval?: { status?: 'APPROVED' | 'PENDING' | 'REJECTED' | string };
};

export type B2BApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type B2BApprovalCounts = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

export type B2BStatusCount = {
  statusId?: string | null;
  statusName?: string;
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
  options: {
    page?: number;
    status?: string;
    search?: string;
    limit?: number;
    approvalStatus?: B2BApprovalStatus | null;
  } = {},
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
  if (options.approvalStatus) params.approvalStatus = options.approvalStatus;

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

export type B2BOption = { _id: string; name?: string };

export type B2BSubStatus = {
  _id: string;
  title: string;
  description?: string;
  hasRemarks?: boolean;
  hasFollowup?: boolean;
  hasAttachment?: boolean;
};

export type B2BFullStatus = {
  _id: string;
  title: string;
  milestone?: string;
  index?: number;
  substatuses?: B2BSubStatus[];
};

export async function fetchB2BStatuses(
  token: string,
): Promise<{ ok: boolean; items: B2BFullStatus[]; message?: string }> {
  const res = await getJson('/college/statusB2b', token);
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, items: res.data as B2BFullStatus[] };
  }
  return {
    ok: false,
    items: [],
    message:
      typeof res.message === 'string' ? res.message : 'Failed to load statuses',
  };
}

export type B2BUpdateStatusBody = {
  status: string;
  subStatus?: string;
  remarks?: string;
  followUpDate?: string;
  followUpTime?: string;
};

export async function updateB2BLeadStatus(
  token: string,
  leadId: string,
  body: B2BUpdateStatusBody,
): Promise<{ ok: boolean; message?: string }> {
  const res = await putJson(`/college/b2b/leads/${leadId}/status`, body, token);
  if (res.status === true || res.success === true) return { ok: true };
  return {
    ok: false,
    message:
      typeof res.message === 'string' ? res.message : 'Failed to update status',
  };
}

export async function fetchB2BLeadCategories(
  token: string,
): Promise<{ ok: boolean; items: B2BOption[]; message?: string }> {
  const res = await getJson('/college/b2b/lead-categories', token, {
    status: 'true',
  });
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, items: res.data as B2BOption[] };
  }
  return {
    ok: false,
    items: [],
    message:
      typeof res.message === 'string' ? res.message : 'Failed to load categories',
  };
}

export async function fetchB2BTypes(
  token: string,
): Promise<{ ok: boolean; items: B2BOption[]; message?: string }> {
  const res = await getJson('/college/b2b/type-of-b2b', token, {
    status: 'true',
  });
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, items: res.data as B2BOption[] };
  }
  return {
    ok: false,
    items: [],
    message:
      typeof res.message === 'string' ? res.message : 'Failed to load types',
  };
}

export type B2BCreateLeadBody = {
  leadCategory: string;
  typeOfB2B: string;
  businessName: string;
  concernPersonName: string;
  mobile: string;
  designation?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  remark?: string;
};

export async function createB2BLead(
  token: string,
  body: B2BCreateLeadBody,
): Promise<{ ok: boolean; message?: string }> {
  const res = await postJson('/college/b2b/add-lead', body, token);
  if (res.status === true) return { ok: true };
  return {
    ok: false,
    message: typeof res.message === 'string' ? res.message : 'Failed to add lead',
  };
}

export type B2BLeadLog = {
  _id?: string;
  user?: string;
  timestamp?: string;
  action?: string;
  remarks?: string;
};

export async function fetchB2BLeadLogs(
  token: string,
  leadId: string,
): Promise<{ ok: boolean; logs: B2BLeadLog[]; message?: string }> {
  const res = await getJson(`/college/b2b/leads/${leadId}/logs`, token);
  if (res.status === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      logs: Array.isArray(d.logs) ? (d.logs as B2BLeadLog[]) : [],
    };
  }
  return {
    ok: false,
    logs: [],
    message:
      typeof res.message === 'string' ? res.message : 'Failed to load history',
  };
}

export async function createB2BLeadFollowup(
  token: string,
  leadId: string,
  body: {
    followUpType: 'Call' | 'Visit';
    scheduledDate: string;
    scheduledTime: string;
    description?: string;
    remarks?: string;
    googleCalendarEvent?: boolean;
  },
): Promise<{ ok: boolean; message?: string }> {
  const res = await postJson(`/college/b2b/leads/${leadId}/followup`, body, token);
  if (res.status === true) {
    return { ok: true };
  }
  return {
    ok: false,
    message:
      typeof res.message === 'string' ? res.message : 'Failed to save follow-up',
  };
}

export async function fetchB2BApprovalCounts(
  token: string,
  base: { status?: string; search?: string } = {},
): Promise<{ ok: boolean; counts: B2BApprovalCounts; message?: string }> {
  const baseParams: Record<string, string | number | undefined> = {};
  if (base.status) baseParams.status = base.status;
  if (base.search) baseParams.search = base.search;

  const callOne = async (approvalStatus?: B2BApprovalStatus) => {
    const params = approvalStatus
      ? { ...baseParams, approvalStatus }
      : { ...baseParams };
    const res = await getJson('/college/b2b/leads/status-count', token, params);
    if (res.status === true && res.data && typeof res.data === 'object') {
      const d = res.data as Json;
      return typeof d.totalLeads === 'number' ? d.totalLeads : 0;
    }
    return 0;
  };

  try {
    const [total, approved, pending, rejected] = await Promise.all([
      callOne(),
      callOne('APPROVED'),
      callOne('PENDING'),
      callOne('REJECTED'),
    ]);
    return {
      ok: true,
      counts: { total, approved, pending, rejected },
    };
  } catch (e) {
    return {
      ok: false,
      counts: { total: 0, approved: 0, pending: 0, rejected: 0 },
      message: e instanceof Error ? e.message : 'Failed to load approval counts',
    };
  }
}

export type B2BFollowupBucket = 'done' | 'planned' | 'missed';
export type B2BDocumentsBucket = 'done' | 'pending';

function followupBucket(
  slot?: B2BFollowUpSlot | null,
): B2BFollowupBucket | null {
  if (!slot) return null;
  const status = String(slot.status || '').toLowerCase();
  if (status === 'completed') return 'done';
  const dt = slot.scheduledDate ? new Date(slot.scheduledDate) : null;
  if (!dt || isNaN(dt.getTime())) return null;
  return dt.getTime() < Date.now() ? 'missed' : 'planned';
}

export function getLeadFollowupBucket(
  lead: B2BLead,
  type: 'Call' | 'Visit',
): B2BFollowupBucket | null {
  const slot = type === 'Visit' ? lead.followUpVisit : lead.followUpCall;
  const slotBucket = followupBucket(slot);
  if (slotBucket) return slotBucket;

  const legacy = lead.followUp || null;
  if (
    legacy &&
    String(legacy.followUpType || '').toLowerCase() === type.toLowerCase()
  ) {
    return followupBucket(legacy);
  }
  return null;
}

export function getLeadDocumentsBucket(
  lead: B2BLead,
): B2BDocumentsBucket | null {
  const required = Array.isArray(lead.leadCategory?.documents)
    ? lead.leadCategory!.documents!
    : [];
  if (required.length === 0) return null;
  const docs = Array.isArray(lead.documents) ? lead.documents : [];
  if (docs.length === 0) return 'pending';
  const anyPending = docs.some(
    d => String(d?.status || 'PENDING').toUpperCase() !== 'APPROVED',
  );
  return anyPending ? 'pending' : 'done';
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
