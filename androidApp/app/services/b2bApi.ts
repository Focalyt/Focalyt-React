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
  status?: {
    _id?: string;
    title?: string;
    name?: string;
    substatuses?: Array<{ _id?: string; title?: string; name?: string }>;
  };
  subStatus?: { _id?: string; title?: string; name?: string } | string;
  b2bProject?: { _id?: string; name?: string } | string;
  b2bDepartment?: { _id?: string; name?: string };
  typeOfB2B?: { _id?: string; name?: string };
  leadOwner?: { name?: string };
  leadAddedBy?: { name?: string };
  parentLeadId?: string;
  crossSaleRootId?: string;
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

export type B2BFollowupBucket = 'done' | 'planned' | 'missed';

export type B2BFollowupDashboardCounts = {
  call: { done: number; planned: number; missed: number };
  visit: { done: number; planned: number; missed: number };
};

export type B2BListFilterParams = {
  b2bDepartment?: string;
  b2bProject?: string;
  typeOfB2B?: string;
  leadOwner?: string;
  search?: string;
  status?: string;
  approvalStatus?: B2BApprovalStatus;
  followUpCallBucket?: B2BFollowupBucket | '';
  followUpVisitBucket?: B2BFollowupBucket | '';
};

function appendB2BListFilters(
  params: Record<string, string | number | undefined>,
  filters?: B2BListFilterParams,
) {
  if (!filters) return params;
  if (filters.b2bDepartment) params.b2bDepartment = filters.b2bDepartment;
  if (filters.b2bProject) params.b2bProject = filters.b2bProject;
  if (filters.typeOfB2B) params.typeOfB2B = filters.typeOfB2B;
  if (filters.leadOwner) params.leadOwner = filters.leadOwner;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.approvalStatus) params.approvalStatus = filters.approvalStatus;
  if (filters.followUpCallBucket) {
    params.followUpCallBucket = filters.followUpCallBucket;
  }
  if (filters.followUpVisitBucket) {
    params.followUpVisitBucket = filters.followUpVisitBucket;
  }
  return params;
}

function parseFollowupDashboardCounts(raw: unknown): B2BFollowupDashboardCounts {
  const empty = {
    call: { done: 0, planned: 0, missed: 0 },
    visit: { done: 0, planned: 0, missed: 0 },
  };
  if (!raw || typeof raw !== 'object') return empty;
  const d = raw as Json;
  const pick = (slot: unknown) => {
    if (!slot || typeof slot !== 'object') {
      return { done: 0, planned: 0, missed: 0 };
    }
    const s = slot as Json;
    return {
      done: typeof s.done === 'number' ? s.done : 0,
      planned: typeof s.planned === 'number' ? s.planned : 0,
      missed: typeof s.missed === 'number' ? s.missed : 0,
    };
  };
  return {
    call: pick(d.call),
    visit: pick(d.visit),
  };
}

export async function fetchB2BStatusCounts(
  token: string,
  filters?: B2BListFilterParams,
): Promise<{
  ok: boolean;
  totalLeads: number;
  statusCounts: B2BStatusCount[];
  followupDashboardCounts: B2BFollowupDashboardCounts;
  message?: string;
}> {
  const params = appendB2BListFilters({}, filters);
  const res = await getJson('/college/b2b/leads/status-count', token, params);
  if (res.status === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      totalLeads: typeof d.totalLeads === 'number' ? d.totalLeads : 0,
      statusCounts: Array.isArray(d.statusCounts)
        ? (d.statusCounts as B2BStatusCount[])
        : [],
      followupDashboardCounts: parseFollowupDashboardCounts(
        d.followupDashboardCounts,
      ),
    };
  }
  return {
    ok: false,
    totalLeads: 0,
    statusCounts: [],
    followupDashboardCounts: parseFollowupDashboardCounts(null),
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
    b2bDepartment?: string;
    b2bProject?: string;
    typeOfB2B?: string;
    leadOwner?: string;
    followUpCallBucket?: B2BFollowupBucket | '';
    followUpVisitBucket?: B2BFollowupBucket | '';
  } = {},
): Promise<{
  ok: boolean;
  leads: B2BLead[];
  totalLeads: number;
  totalPages: number;
  message?: string;
}> {
  const params = appendB2BListFilters(
    { page: options.page ?? 1 },
    {
      b2bDepartment: options.b2bDepartment,
      b2bProject: options.b2bProject,
      typeOfB2B: options.typeOfB2B,
      leadOwner: options.leadOwner,
      search: options.search,
      status: options.status,
      approvalStatus: options.approvalStatus || undefined,
      followUpCallBucket: options.followUpCallBucket,
      followUpVisitBucket: options.followUpVisitBucket,
    },
  );
  if (options.limit) params.limit = options.limit;

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

export type B2BOption = {
  _id: string;
  name?: string;
  /** B2B department id (for projects / types) */
  department?: string;
};

function deptIdFromJson(dept: unknown): string {
  if (dept && typeof dept === 'object' && '_id' in (dept as Json)) {
    return String((dept as Json)._id ?? '');
  }
  return dept != null ? String(dept) : '';
}

function mapB2BOption(row: Json): B2BOption {
  return {
    _id: String(row._id ?? ''),
    name: typeof row.name === 'string' ? row.name : undefined,
    department: deptIdFromJson(row.department) || undefined,
  };
}

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

function apiResponseOk(res: Json): boolean {
  return res.status === true || res.success === true;
}

export async function fetchB2BUsers(
  token: string,
): Promise<{ ok: boolean; items: B2BOption[]; message?: string }> {
  const res = await getJson('/college/users/b2b-users', token);
  if (apiResponseOk(res) && Array.isArray(res.data)) {
    return {
      ok: true,
      items: (res.data as Json[]).map(row => ({
        _id: String(row._id ?? ''),
        name:
          typeof row.name === 'string'
            ? row.name
            : typeof row.email === 'string'
              ? row.email
              : undefined,
      })),
    };
  }
  return {
    ok: false,
    items: [],
    message:
      typeof res.message === 'string' ? res.message : 'Failed to load counsellors',
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

export async function fetchB2BDepartments(
  token: string,
): Promise<{ ok: boolean; items: B2BOption[]; message?: string }> {
  const res = await getJson('/college/b2b/b2b-departments', token, {
    status: 'true',
  });
  if (res.status === true && Array.isArray(res.data)) {
    return {
      ok: true,
      items: (res.data as Json[]).map(mapB2BOption),
    };
  }
  return {
    ok: false,
    items: [],
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to load departments',
  };
}

export async function fetchB2BProjects(
  token: string,
  departmentId?: string,
): Promise<{ ok: boolean; items: B2BOption[]; message?: string }> {
  const params: Record<string, string> = { status: 'true' };
  if (departmentId) params.department = departmentId;
  const res = await getJson('/college/b2b/b2b-projects', token, params);
  if (res.status === true && Array.isArray(res.data)) {
    return {
      ok: true,
      items: (res.data as Json[]).map(mapB2BOption),
    };
  }
  return {
    ok: false,
    items: [],
    message:
      typeof res.message === 'string' ? res.message : 'Failed to load projects',
  };
}

export async function fetchB2BTypes(
  token: string,
  departmentId?: string,
): Promise<{ ok: boolean; items: B2BOption[]; message?: string }> {
  const params: Record<string, string> = { status: 'true' };
  if (departmentId) params.department = departmentId;
  const res = await getJson('/college/b2b/type-of-b2b', token, params);
  if (res.status === true && Array.isArray(res.data)) {
    return {
      ok: true,
      items: (res.data as Json[]).map(mapB2BOption),
    };
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
  b2bDepartment: string;
  b2bProject: string;
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

export async function referB2BLead(
  token: string,
  leadId: string,
  counselorId: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await postJson(
    '/college/b2b/refer-lead',
    { leadId, counselorId },
    token,
  );
  if (res.status === true) {
    return { ok: true, message: typeof res.message === 'string' ? res.message : undefined };
  }
  return {
    ok: false,
    message:
      typeof res.message === 'string' ? res.message : 'Failed to refer lead',
  };
}

export async function fetchB2BLeadDocuments(
  token: string,
  leadId: string,
): Promise<{ ok: boolean; documents: B2BLeadDocument[]; message?: string }> {
  const res = await getJson(`/college/b2b/leads/${leadId}/documents`, token);
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, documents: res.data as B2BLeadDocument[] };
  }
  return {
    ok: false,
    documents: [],
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to load documents',
  };
}

export async function fetchB2BLeadCategoryById(
  token: string,
  categoryId: string,
): Promise<{
  ok: boolean;
  documents: Array<{ name?: string; required?: boolean }>;
  message?: string;
}> {
  const res = await getJson(
    `/college/b2b/lead-categories/${categoryId}`,
    token,
  );
  if (res.status === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    const docs = Array.isArray(d.documents) ? d.documents : [];
    return {
      ok: true,
      documents: docs as Array<{ name?: string; required?: boolean }>,
    };
  }
  return {
    ok: false,
    documents: [],
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to load lead category',
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
  base: B2BListFilterParams = {},
): Promise<{ ok: boolean; counts: B2BApprovalCounts; message?: string }> {
  const baseParams = appendB2BListFilters({}, base);

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

export async function fetchB2BCrossSales(
  token: string,
  leadId: string,
): Promise<{ ok: boolean; rootId?: string; leads: B2BLead[]; message?: string }> {
  const res = await getJson(`/college/b2b/leads/${leadId}/cross-sales`, token);
  if (res.status === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      rootId: typeof d.rootId === 'string' ? d.rootId : undefined,
      leads: Array.isArray(d.leads) ? (d.leads as B2BLead[]) : [],
    };
  }
  return {
    ok: false,
    rootId: undefined,
    leads: [],
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to load cross-sales',
  };
}

export type B2BCrossSaleCreateBody = {
  b2bDepartment: string;
  b2bProject: string;
  typeOfB2B: string;
  leadOwner?: string;
  status?: string;
  subStatus?: string;
  remark?: string;
};

export async function createB2BCrossSale(
  token: string,
  leadId: string,
  body: B2BCrossSaleCreateBody,
): Promise<{ ok: boolean; lead?: B2BLead; message?: string }> {
  const res = await postJson(`/college/b2b/leads/${leadId}/cross-sale`, body, token);
  if (res.status === true && res.data) {
    return { ok: true, lead: res.data as B2BLead };
  }
  return {
    ok: false,
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to create cross-sale',
  };
}

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

export function getLeadSubStatusTitle(lead: B2BLead): string {
  const raw = lead.subStatus;
  const id =
    raw && typeof raw === 'object'
      ? raw._id
      : raw
        ? String(raw)
        : '';
  if (!id) return '';
  const list = lead.status?.substatuses;
  if (!Array.isArray(list) || list.length === 0) return '';
  const found = list.find(ss => ss?._id && String(ss._id) === String(id));
  return found?.title || found?.name || '';
}

function formatFollowupDate(dateLike?: string): string {
  if (!dateLike) return '—';
  const dt = new Date(dateLike);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB');
}

export function getLeadFollowupDateLabel(
  lead: B2BLead,
  type: 'Call' | 'Visit',
): string {
  const t = type.toLowerCase();
  const bySlot = t === 'visit' ? lead.followUpVisit : lead.followUpCall;
  if (bySlot?.scheduledDate) return formatFollowupDate(bySlot.scheduledDate);
  const legacy = lead.followUp;
  if (
    legacy?.scheduledDate &&
    String(legacy.followUpType || '').toLowerCase() === t
  ) {
    return formatFollowupDate(legacy.scheduledDate);
  }
  return '—';
}

export function getLeadB2bProjectName(lead: B2BLead): string {
  const p = lead.b2bProject;
  if (!p) return '—';
  if (typeof p === 'object') return p.name || '—';
  return 'Project';
}

export function getLeadB2bDepartmentName(lead: B2BLead): string {
  return lead.b2bDepartment?.name || '—';
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
