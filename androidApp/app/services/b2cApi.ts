import { getJson, postJson, putJson } from './apiClient';

type Json = Record<string, unknown>;

export type B2COption = { _id: string; name?: string };

export type B2CFollowUpSlot = {
  _id?: string;
  scheduledDate?: string;
  followupDate?: string;
  status?: string;
  followUpType?: string;
  remarks?: string;
};

export type B2CDocUpload = {
  _id?: string;
  status?: string;
  fileUrl?: string;
};

export type B2CUploadedDoc = {
  _id?: string;
  Name?: string;
  name?: string;
  docsId?: string;
  mandatory?: boolean;
  uploads?: B2CDocUpload[];
  status?: string;
};

export type B2CDocCounts = {
  totalRequired?: number;
  uploadedCount?: number;
  pendingVerificationCount?: number;
  verifiedCount?: number;
  RejectedCount?: number;
  notUploadedCount?: number;
  uploadPercentage?: number;
};

export type B2CProfile = {
  _id: string;
  _candidate?: {
    _id?: string;
    name?: string;
    mobile?: string | number;
    email?: string;
    whatsapp?: string | number;
    sex?: string;
    dob?: string;
    isExperienced?: boolean;
    personalInfo?: {
      professionalTitle?: string;
      summary?: string;
      image?: string;
      currentAddress?: {
        fullAddress?: string;
        city?: string;
        state?: string;
      };
      permanentAddress?: {
        fullAddress?: string;
        city?: string;
        state?: string;
      };
    };
    experiences?: Array<{
      jobTitle?: string;
      companyName?: string;
      from?: string;
      to?: string;
      currentlyWorking?: boolean;
      jobDescription?: string;
    }>;
    qualifications?: Array<{
      education?: string;
      course?: string;
      university?: string;
      passingYear?: string;
    }>;
  };
  _course?: {
    _id?: string;
    name?: string;
    projectName?: string;
    sectors?: string;
    typeOfProject?: string;
    batchName?: string;
    docsRequired?: Array<{ _id?: string; Name?: string; name?: string; mandatory?: boolean }>;
  };
  _center?: { name?: string };
  _leadStatus?: {
    _id?: string;
    title?: string;
    substatuses?: Array<{ _id: string; title?: string; name?: string }>;
  };
  _leadSubStatus?: string | { _id?: string; title?: string; name?: string };
  selectedSubstatus?: string | { _id?: string; title?: string; name?: string };
  parentAppliedCourseId?: string;
  crossSaleRootId?: string;
  createdAt?: string;
  updatedAt?: string;
  kyc?: boolean;
  remarks?: string;
  approval?: { status?: 'APPROVED' | 'PENDING' | 'REJECTED' | string };
  followUpCall?: B2CFollowUpSlot | null;
  followUpVisit?: B2CFollowUpSlot | null;
  followup?: B2CFollowUpSlot | null;
  registeredBy?: { name?: string };
  counsellor?: { name?: string };
  leadAssignment?: Array<{ counsellorName?: string; name?: string }>;
  logs?: Array<{ user?: { name?: string } }>;
  uploadedDocs?: B2CUploadedDoc[];
  docCounts?: B2CDocCounts;
};

export type B2CCourseHistoryRow = {
  _id?: string;
  createdAt?: string;
  _course?: { name?: string };
  registeredBy?: { name?: string };
  _leadStatus?: { title?: string };
  month?: string;
  year?: string;
};

export type B2CJobHistoryRow = {
  _id?: string;
  _job?: { title?: string; displayCompanyName?: string };
};

export type B2CPreVerificationAnswer = {
  question?: string;
  answer?: string;
  rejectionReason?: string;
  visitDate?: string;
};

export type B2CApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type B2CApprovalCounts = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

export type B2CCrmFilter = {
  _id: string;
  name: string;
  count: number;
  milestone?: string;
};

export type B2CFollowupBucket = 'done' | 'planned' | 'missed';

export type B2CFollowupDashboardCounts = {
  call: { done: number; planned: number; missed: number };
  visit: { done: number; planned: number; missed: number };
};

export type B2CCycleFiltersState = {
  department: string;
  project: string;
  center: string;
  course: string;
  batch: string;
};

export type B2CListFilterParams = {
  name?: string;
  leadStatus?: string;
  approvalStatus?: string;
  followupStatus?: B2CFollowupBucket | '';
  registeredByMe?: string;
  cycle?: B2CCycleFiltersState;
};

function mapOption(row: Json): B2COption {
  return {
    _id: String(row._id ?? ''),
    name: typeof row.name === 'string' ? row.name : typeof row.title === 'string' ? row.title : undefined,
  };
}

function appendCycleFilters(
  params: Record<string, string | number | undefined>,
  cycle?: B2CCycleFiltersState,
) {
  if (!cycle) return params;
  if (cycle.project) params.projects = JSON.stringify([cycle.project]);
  if (cycle.department) params.verticals = JSON.stringify([cycle.department]);
  if (cycle.course) params.course = JSON.stringify([cycle.course]);
  if (cycle.center) params.center = JSON.stringify([cycle.center]);
  if (cycle.batch) params.batch = JSON.stringify([cycle.batch]);
  return params;
}

function appendListFilters(
  params: Record<string, string | number | undefined>,
  filters?: B2CListFilterParams,
) {
  if (!filters) return params;
  if (filters.name) params.name = filters.name;
  if (filters.leadStatus) params.leadStatus = filters.leadStatus;
  if (filters.approvalStatus) params.approvalStatus = filters.approvalStatus;
  if (filters.followupStatus) params.followupStatus = filters.followupStatus;
  if (filters.registeredByMe) params.registeredByMe = filters.registeredByMe;
  appendCycleFilters(params, filters.cycle);
  return params;
}

export async function fetchB2CFilterOptions(token: string): Promise<{
  ok: boolean;
  verticals: B2COption[];
  projects: B2COption[];
  courses: B2COption[];
  centers: B2COption[];
  counselors: B2COption[];
  message?: string;
}> {
  const empty = {
    ok: false,
    verticals: [],
    projects: [],
    courses: [],
    centers: [],
    counselors: [],
  };
  try {
    const res = await getJson('/college/filters-data', token);
    if (res.status !== true) {
      return { ...empty, message: 'Failed to load filters' };
    }
    const verticals = Array.isArray(res.verticals)
      ? (res.verticals as Json[]).map(mapOption)
      : [];
    const projects = Array.isArray(res.projects)
      ? (res.projects as Json[]).map(mapOption)
      : [];
    const courses = Array.isArray(res.courses)
      ? (res.courses as Json[]).map(mapOption)
      : [];
    let centers: B2COption[] = [];
    try {
      const centersRes = await getJson('/college/list_all_centers', token);
      if (centersRes.success === true && Array.isArray(centersRes.data)) {
        centers = (centersRes.data as Json[]).map(mapOption);
      } else if (Array.isArray(res.centers)) {
        centers = (res.centers as Json[]).map(mapOption);
      }
    } catch {
      if (Array.isArray(res.centers)) {
        centers = (res.centers as Json[]).map(mapOption);
      }
    }
    const counselors = Array.isArray(res.counselors)
      ? (res.counselors as Json[])
          .filter(
            c =>
              c?.status === true ||
              c?.status === 'active' ||
              c?.status === undefined,
          )
          .map(mapOption)
      : [];
    return {
      ok: true,
      verticals,
      projects,
      courses,
      centers,
      counselors,
    };
  } catch (e) {
    return {
      ...empty,
      message: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export async function fetchB2CBatches(
  token: string,
  centerId?: string,
  courseId?: string,
): Promise<{ ok: boolean; items: B2COption[] }> {
  const params: Record<string, string> = {};
  if (centerId) params.centerId = centerId;
  if (courseId) params.courseId = courseId;
  const res = await getJson('/college/get_batches', token, params);
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, items: (res.data as Json[]).map(mapOption) };
  }
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, items: (res.data as Json[]).map(mapOption) };
  }
  return { ok: false, items: [] };
}

export async function fetchB2CProfiles(
  token: string,
  options: {
    page?: number;
    limit?: number;
  } & B2CListFilterParams = {},
): Promise<{
  ok: boolean;
  profiles: B2CProfile[];
  totalPages: number;
  totalCount: number;
  message?: string;
}> {
  const params = appendListFilters(
    { page: options.page ?? 1, limit: options.limit ?? 20 },
    options,
  );
  const res = await getJson('/college/appliedCandidates', token, params);
  if (res.success === true) {
    return {
      ok: true,
      profiles: Array.isArray(res.data) ? (res.data as B2CProfile[]) : [],
      totalPages: typeof res.totalPages === 'number' ? res.totalPages : 1,
      totalCount: typeof res.totalCount === 'number' ? res.totalCount : 0,
    };
  }
  return {
    ok: false,
    profiles: [],
    totalPages: 1,
    totalCount: 0,
    message: typeof res.message === 'string' ? res.message : 'Failed to load leads',
  };
}

export type B2CStatusTemplate = {
  _id: string;
  title: string;
  milestone?: string;
};

function countFromBackendRow(row: Json | number | undefined): number {
  if (row && typeof row === 'object' && typeof row.count === 'number') {
    return row.count;
  }
  if (typeof row === 'number') return row;
  return 0;
}

/** Match web Registrationsold: only college statuses, counts merged from backend. */
export function buildB2CCrmFilters(
  statusList: B2CStatusTemplate[],
  backendCounts: Record<string, Json>,
): B2CCrmFilter[] {
  const calculatedTotal = statusList.reduce(
    (sum, status) => sum + countFromBackendRow(backendCounts[status._id]),
    0,
  );
  const allCount =
    calculatedTotal > 0
      ? calculatedTotal
      : typeof backendCounts.all === 'number'
        ? backendCounts.all
        : 0;

  return [
    { _id: 'all', name: 'All', count: allCount },
    ...statusList.map(status => {
      const backendFilter = backendCounts[status._id];
      if (backendFilter && typeof backendFilter === 'object') {
        return {
          _id: status._id,
          name: status.title,
          count: countFromBackendRow(backendFilter),
          milestone:
            typeof backendFilter.milestone === 'string'
              ? backendFilter.milestone
              : status.milestone,
        };
      }
      return {
        _id: status._id,
        name: status.title,
        count: 0,
        milestone: status.milestone,
      };
    }),
  ];
}

export async function fetchB2CCrmCounts(
  token: string,
  filters?: B2CListFilterParams,
  statusList?: B2CStatusTemplate[],
): Promise<{
  ok: boolean;
  crmFilters: B2CCrmFilter[];
  approvalCounts: B2CApprovalCounts;
  message?: string;
}> {
  const params = appendListFilters({}, filters);
  const res = await getJson('/college/registrationCrmFilterCounts', token, params);
  if (res.success !== true) {
    return {
      ok: false,
      crmFilters: [],
      approvalCounts: { total: 0, approved: 0, pending: 0, rejected: 0 },
      message: typeof res.message === 'string' ? res.message : 'Failed to load counts',
    };
  }
  const backendCounts = (res.crmFilterCount || {}) as Record<string, Json>;

  let templates = statusList;
  if (!templates?.length) {
    const statusRes = await fetchB2CStatuses(token);
    if (!statusRes.ok) {
      return {
        ok: false,
        crmFilters: [],
        approvalCounts: { total: 0, approved: 0, pending: 0, rejected: 0 },
        message: statusRes.message,
      };
    }
    templates = statusRes.items.map(s => ({
      _id: s._id,
      title: s.title,
      milestone: s.milestone,
    }));
  }

  const crmFilters = buildB2CCrmFilters(templates, backendCounts);
  const allCount = crmFilters.find(f => f._id === 'all')?.count ?? 0;

  const ac = (res.approvalCounts || {}) as Json;
  const approvalCounts: B2CApprovalCounts = {
    total: typeof ac.total === 'number' ? ac.total : allCount,
    approved: typeof ac.approved === 'number' ? ac.approved : 0,
    pending: typeof ac.pending === 'number' ? ac.pending : 0,
    rejected: typeof ac.rejected === 'number' ? ac.rejected : 0,
  };

  return { ok: true, crmFilters, approvalCounts };
}

export async function fetchB2CFollowupCounts(
  token: string,
  cycle?: B2CCycleFiltersState,
): Promise<{ ok: boolean; counts: B2CFollowupDashboardCounts }> {
  const params = appendCycleFilters({ allTime: 'true' }, cycle);
  const res = await getJson('/college/followupcounts', token, params);
  const empty: B2CFollowupDashboardCounts = {
    call: { done: 0, planned: 0, missed: 0 },
    visit: { done: 0, planned: 0, missed: 0 },
  };
  if (res.success === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      counts: {
        call: {
          done: typeof d.done === 'number' ? d.done : 0,
          planned: typeof d.planned === 'number' ? d.planned : 0,
          missed: typeof d.missed === 'number' ? d.missed : 0,
        },
        visit: empty.visit,
      },
    };
  }
  return { ok: false, counts: empty };
}

export type B2CSubStatus = {
  _id: string;
  title: string;
  hasRemarks?: boolean;
  hasFollowup?: boolean;
};

export type B2CFullStatus = {
  _id: string;
  title: string;
  milestone?: string;
  substatuses?: B2CSubStatus[];
};

export async function fetchB2CStatuses(
  token: string,
): Promise<{ ok: boolean; items: B2CFullStatus[]; message?: string }> {
  const res = await getJson('/college/status', token);
  if (res.success === true && Array.isArray(res.data)) {
    return {
      ok: true,
      items: (res.data as Json[]).map(row => ({
        _id: String(row._id ?? ''),
        title: typeof row.title === 'string' ? row.title : 'Status',
        milestone: typeof row.milestone === 'string' ? row.milestone : undefined,
        substatuses: Array.isArray(row.substatuses)
          ? (row.substatuses as B2CSubStatus[])
          : undefined,
      })),
    };
  }
  return {
    ok: false,
    items: [],
    message: typeof res.message === 'string' ? res.message : 'Failed to load statuses',
  };
}

export async function fetchB2CSubStatuses(
  token: string,
  statusId: string,
): Promise<{ ok: boolean; items: B2CSubStatus[] }> {
  const res = await getJson(`/college/status/${statusId}/substatus`, token);
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, items: res.data as B2CSubStatus[] };
  }
  return { ok: false, items: [] };
}

export async function updateB2CLeadStatus(
  token: string,
  profileId: string,
  body: {
    _leadStatus: string;
    _leadSubStatus?: string | null;
    followup?: string | null;
    remarks?: string;
    googleCalendarEvent?: boolean;
  },
): Promise<{ ok: boolean; message?: string }> {
  const res = await putJson(
    `/college/lead/status_change/${profileId}`,
    body,
    token,
  );
  if (res.success === true) return { ok: true };
  return {
    ok: false,
    message: typeof res.message === 'string' ? res.message : 'Failed to update status',
  };
}

export async function createB2CFollowup(
  token: string,
  profile: B2CProfile,
  body: {
    followUpType: 'Call' | 'Visit';
    followupDateIso: string;
    remarks: string;
    googleCalendarEvent?: boolean;
  },
): Promise<{ ok: boolean; message?: string }> {
  const type = body.followUpType;
  const slot =
    type === 'Visit'
      ? profile.followUpVisit
      : profile.followUpCall || profile.followup;
  const hasExisting = Boolean(slot?._id);
  const payload: Json = hasExisting
    ? {
        id: slot!._id,
        appliedCourseId: profile._id,
        followUpType: type,
        followupDate: body.followupDateIso,
        remarks: body.remarks,
        folloupType: 'update',
        googleCalendarEvent: body.googleCalendarEvent ?? false,
      }
    : {
        appliedCourseId: profile._id,
        followUpType: type,
        followupDate: body.followupDateIso,
        remarks: body.remarks,
        folloupType: 'new',
        googleCalendarEvent: body.googleCalendarEvent ?? false,
      };
  const res = await postJson('/college/b2c-set-followups', payload, token);
  if (res.status === true || res.success === true) return { ok: true };
  return {
    ok: false,
    message: typeof res.message === 'string' ? res.message : 'Failed to save follow-up',
  };
}

export type B2CCreateLeadBody = {
  courseId: string;
  centerId: string;
  counselorId: string;
  registeredBy: string;
  candidateData: {
    name: string;
    mobile: string;
    whatsapp: string;
    sex: string;
    dob: string;
    email?: string;
    highestQualification: string;
  };
};

export async function createB2CLead(
  token: string,
  body: B2CCreateLeadBody,
): Promise<{ ok: boolean; message?: string }> {
  const res = await postJson('/college/courses/addleadsb2c', body, token);
  if (res.status === true) return { ok: true };
  return {
    ok: false,
    message: typeof res.message === 'string' ? res.message : 'Failed to add lead',
  };
}

function followupBucket(slot?: B2CFollowUpSlot | null): B2CFollowupBucket | null {
  if (!slot) return null;
  const status = String(slot.status || '').toLowerCase();
  if (status === 'completed') return 'done';
  const raw = slot.scheduledDate || slot.followupDate;
  const dt = raw ? new Date(raw) : null;
  if (!dt || isNaN(dt.getTime())) return null;
  return dt.getTime() < Date.now() ? 'missed' : 'planned';
}

export function getProfileGroupRootId(profile: B2CProfile): string {
  return String(
    profile.crossSaleRootId || profile.parentAppliedCourseId || profile._id || '',
  );
}

export function getProfileFollowupBucket(
  profile: B2CProfile,
  type: 'Call' | 'Visit',
): B2CFollowupBucket | null {
  const slot = type === 'Visit' ? profile.followUpVisit : profile.followUpCall;
  const slotBucket = followupBucket(slot);
  if (slotBucket) return slotBucket;
  const legacy = profile.followup;
  if (
    legacy &&
    String(legacy.followUpType || '').toLowerCase() === type.toLowerCase()
  ) {
    return followupBucket(legacy);
  }
  return null;
}

export function getProfileFollowupDateLabel(
  profile: B2CProfile,
  type: 'Call' | 'Visit',
): string {
  const t = type.toLowerCase();
  const bySlot = t === 'visit' ? profile.followUpVisit : profile.followUpCall;
  const raw = bySlot?.scheduledDate || bySlot?.followupDate;
  if (raw) {
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-GB');
  }
  const legacy = profile.followup;
  if (
    legacy &&
    String(legacy.followUpType || '').toLowerCase() === t
  ) {
    const lr = legacy.scheduledDate || legacy.followupDate;
    if (lr) {
      const dt = new Date(lr);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-GB');
    }
  }
  return '—';
}

export function getProfileSubStatusTitle(profile: B2CProfile): string {
  const raw = profile.selectedSubstatus;
  if (raw && typeof raw === 'object') {
    const direct =
      (typeof raw.title === 'string' ? raw.title : '') ||
      (typeof raw.name === 'string' ? raw.name : '');
    const trimmed = direct.trim();
    if (trimmed && trimmed !== 'No Sub Status') return trimmed;
  }

  const subStatusId =
    profile._leadSubStatus ??
    (raw && typeof raw === 'object' ? raw._id : raw ? String(raw) : '');
  const id =
    subStatusId && typeof subStatusId === 'object'
      ? subStatusId._id
      : subStatusId
        ? String(subStatusId)
        : '';
  if (!id) return '';

  const list = profile._leadStatus?.substatuses;
  if (Array.isArray(list) && list.length > 0) {
    const found = list.find(ss => ss?._id && String(ss._id) === id);
    if (found?.title) return found.title;
    if (found?.name) return found.name;
  }

  if (subStatusId && typeof subStatusId === 'object') {
    const nested =
      (typeof subStatusId.title === 'string' ? subStatusId.title : '') ||
      (typeof subStatusId.name === 'string' ? subStatusId.name : '');
    const trimmed = nested.trim();
    if (trimmed && trimmed !== 'No Sub Status') return trimmed;
  }

  return '';
}

export function getProfileApprovalStatus(
  profile: B2CProfile,
): 'approved' | 'pending' | 'rejected' {
  const raw = profile.approval?.status;
  const safe = String(raw || 'PENDING').toUpperCase();
  if (safe === 'APPROVED') return 'approved';
  if (safe === 'REJECTED') return 'rejected';
  return 'pending';
}

export function getProfileDocBucket(
  profile: B2CProfile,
): 'done' | 'pending' | null {
  const pct = profile.docCounts?.uploadPercentage;
  const total = profile.docCounts?.totalRequired;
  if (total == null || total === 0) return null;
  if (pct == null) return 'pending';
  return pct >= 100 ? 'done' : 'pending';
}

export function buildProfileDocumentsList(profile: B2CProfile): B2CUploadedDoc[] {
  const uploadedDocs = Array.isArray(profile.uploadedDocs) ? profile.uploadedDocs : [];
  if (uploadedDocs.length > 0 && uploadedDocs.some(d => d.Name || d.name)) {
    return uploadedDocs.map(doc => ({
      ...doc,
      Name: doc.Name || doc.name || 'Document',
      uploads: Array.isArray(doc.uploads) ? doc.uploads : [],
    }));
  }
  const requiredDocs = profile._course?.docsRequired || [];
  if (!requiredDocs.length) return uploadedDocs;
  const uploadsByDocId = new Map<string, B2CDocUpload[]>();
  uploadedDocs.forEach(d => {
    const key = String(d.docsId || d._id || '');
    if (!key) return;
    const arr = uploadsByDocId.get(key) || [];
    arr.push(...(Array.isArray(d.uploads) ? d.uploads : []));
    uploadsByDocId.set(key, arr);
  });
  return requiredDocs.map(reqDoc => {
    const id = String(reqDoc._id || '');
    const matchingUploads = uploadsByDocId.get(id) || [];
    return {
      _id: reqDoc._id,
      Name: reqDoc.Name || reqDoc.name || 'Document',
      mandatory: reqDoc.mandatory,
      uploads: matchingUploads,
      ...(matchingUploads.length === 0 ? { status: 'Not Uploaded' } : {}),
    };
  });
}

export type KycDocProgress = {
  pct: number;
  verified: number;
  pending: number;
  rejected: number;
  total: number;
};

export function getKycDocProgress(profile: B2CProfile): KycDocProgress {
  const dc = profile.docCounts;
  if (dc?.totalRequired != null && dc.totalRequired > 0) {
    const verified = dc.verifiedCount ?? 0;
    const rejected = dc.RejectedCount ?? 0;
    const pending =
      (dc.pendingVerificationCount ?? 0) + (dc.notUploadedCount ?? 0);
    const total = dc.totalRequired;
    return {
      pct: dc.uploadPercentage ?? Math.round((verified / total) * 100),
      verified,
      pending,
      rejected,
      total,
    };
  }
  const docs = buildProfileDocumentsList(profile);
  const total = docs.length;
  if (!total) return { pct: 0, verified: 0, pending: 0, rejected: 0, total: 0 };
  const verified = docs.filter(
    d => d.uploads?.slice(-1)[0]?.status === 'Verified',
  ).length;
  const pending = docs.filter(d => {
    const st = d.uploads?.slice(-1)[0]?.status;
    return st === 'Pending' || !d.uploads?.length;
  }).length;
  const rejected = docs.filter(
    d => d.uploads?.slice(-1)[0]?.status === 'Rejected',
  ).length;
  return {
    pct: Math.round((verified / total) * 100),
    verified,
    pending,
    rejected,
    total,
  };
}

export function getProfileLeadOwnerLabel(profile: B2CProfile): string {
  const latest =
    Array.isArray(profile.leadAssignment) && profile.leadAssignment.length > 0
      ? profile.leadAssignment[profile.leadAssignment.length - 1]
      : null;
  return (
    latest?.counsellorName ||
    latest?.name ||
    profile.counsellor?.name ||
    profile.registeredBy?.name ||
    'Self Registered'
  );
}

export async function fetchB2CProfileDetails(
  token: string,
  leadId: string,
): Promise<{ ok: boolean; profile: B2CProfile | null; message?: string }> {
  const res = await getJson('/college/appliedCandidatesDetails', token, { leadId });
  if (res.success === true && res.data && typeof res.data === 'object') {
    return { ok: true, profile: res.data as B2CProfile };
  }
  return {
    ok: false,
    profile: null,
    message: typeof res.message === 'string' ? res.message : 'Failed to load details',
  };
}

export async function fetchB2CCourseHistory(
  token: string,
  candidateId: string,
): Promise<{ ok: boolean; rows: B2CCourseHistoryRow[] }> {
  const res = await getJson(
    `/college/candidate/appliedCourses/${candidateId}`,
    token,
  );
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, rows: res.data as B2CCourseHistoryRow[] };
  }
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, rows: res.data as B2CCourseHistoryRow[] };
  }
  return { ok: false, rows: [] };
}

export async function fetchB2CJobHistory(
  token: string,
  candidateId: string,
): Promise<{ ok: boolean; rows: B2CJobHistoryRow[] }> {
  const res = await getJson(
    `/college/candidate/appliedJobs/${candidateId}`,
    token,
  );
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, rows: res.data as B2CJobHistoryRow[] };
  }
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, rows: res.data as B2CJobHistoryRow[] };
  }
  return { ok: false, rows: [] };
}

export async function fetchB2CPreVerification(
  token: string,
  appliedCourseId: string,
): Promise<{ ok: boolean; answers: B2CPreVerificationAnswer[] }> {
  const res = await getJson(
    `/college/candidate/questionAnswer/${appliedCourseId}`,
    token,
  );
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, answers: res.data as B2CPreVerificationAnswer[] };
  }
  return { ok: false, answers: [] };
}

export async function markB2CKycDone(
  token: string,
  profileId: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await postJson(`/college/kycDone/${profileId}`, {}, token);
  if (res.success === true || res.status === true) return { ok: true };
  return {
    ok: false,
    message: typeof res.message === 'string' ? res.message : 'Failed to mark KYC done',
  };
}

export type B2CReEnquiry = {
  _id?: string;
  reEnquireDate?: string;
  createdAt?: string;
  source?: string;
  course?: { _id?: string; name?: string };
  appliedCourse?: {
    _id?: string;
    _course?: { name?: string };
    _center?: { name?: string };
    _leadStatus?: { title?: string };
    createdAt?: string;
  };
  counselorName?: { name?: string };
};

export type B2CLeadLog = {
  _id?: string;
  action?: string;
  remarks?: string;
  timestamp?: string;
  user?: string | { name?: string; email?: string };
};

export async function fetchB2CCrossSales(
  token: string,
  profileId: string,
): Promise<{ ok: boolean; rootId?: string; leads: B2CProfile[]; message?: string }> {
  const res = await getJson(
    `/college/applied-courses/${profileId}/cross-sales`,
    token,
  );
  if (res.success === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      rootId: typeof d.rootId === 'string' ? d.rootId : undefined,
      leads: Array.isArray(d.leads) ? (d.leads as B2CProfile[]) : [],
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

export async function fetchB2CReapplyHistory(
  token: string,
  profileId: string,
): Promise<{
  ok: boolean;
  courseName?: string;
  centerName?: string;
  reEnquiries: B2CReEnquiry[];
  message?: string;
}> {
  const res = await getJson(
    `/college/applied-courses/${profileId}/reapply-history`,
    token,
  );
  if (res.success === true && res.data && typeof res.data === 'object') {
    const d = res.data as Json;
    return {
      ok: true,
      courseName: typeof d.courseName === 'string' ? d.courseName : undefined,
      centerName: typeof d.centerName === 'string' ? d.centerName : undefined,
      reEnquiries: Array.isArray(d.reEnquiries)
        ? (d.reEnquiries as B2CReEnquiry[])
        : [],
    };
  }
  return {
    ok: false,
    reEnquiries: [],
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to load reapply history',
  };
}

export async function fetchB2CLeadLogs(
  token: string,
  profileId: string,
): Promise<{ ok: boolean; logs: B2CLeadLog[]; message?: string }> {
  const res = await getJson(`/college/lead-history/${profileId}`, token);
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, logs: res.data as B2CLeadLog[] };
  }
  return {
    ok: false,
    logs: [],
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to load history',
  };
}

export type B2CCrossSaleCreateBody = {
  course: string;
  center: string;
  leadStatus: string;
  leadSubStatus: string;
  counsellor: string;
  remark?: string;
};

export async function createB2CCrossSale(
  token: string,
  profileId: string,
  body: B2CCrossSaleCreateBody,
): Promise<{ ok: boolean; profile?: B2CProfile; message?: string }> {
  const res = await postJson(
    `/college/applied-courses/${profileId}/cross-sale`,
    body,
    token,
  );
  if (res.success === true && res.data) {
    return { ok: true, profile: res.data as B2CProfile };
  }
  return {
    ok: false,
    message:
      typeof res.message === 'string'
        ? res.message
        : 'Failed to create cross-sale',
  };
}

export async function fetchB2CCourseCenters(
  token: string,
  courseId: string,
): Promise<{ ok: boolean; items: B2COption[] }> {
  const res = await getJson('/college/courses/course_centers', token, {
    courseId,
  });
  if (res.status === true && Array.isArray(res.data)) {
    return { ok: true, items: (res.data as Json[]).map(mapOption) };
  }
  return { ok: false, items: [] };
}

export async function fetchB2CAllCourses(
  token: string,
): Promise<{ ok: boolean; items: B2COption[] }> {
  const res = await getJson('/college/all_courses', token);
  if (res.success === true && Array.isArray(res.data)) {
    return { ok: true, items: (res.data as Json[]).map(mapOption) };
  }
  return { ok: false, items: [] };
}
