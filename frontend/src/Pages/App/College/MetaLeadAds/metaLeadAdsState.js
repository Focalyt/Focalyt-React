export function readSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch (error) {
    return {};
  }
}

export function isCrmAdmin(user) {
  return Boolean(user && user.permissions && user.permissions.permission_type === 'Admin');
}

export function formKey(pageId, formId) {
  return `${pageId || ''}:${formId || ''}`;
}

export function dedupeByForm(rows) {
  const map = new Map();
  (rows || []).forEach((row) => {
    if (!row || !row.pageId || !row.formId) return;
    const key = formKey(row.pageId, row.formId);
    if (!map.has(key)) map.set(key, row);
  });
  return [...map.values()];
}

export function mergeMappingRows(mappings, unmapped) {
  const map = new Map();
  dedupeByForm(unmapped).forEach((form) => {
    map.set(formKey(form.pageId, form.formId), {
      pageId: form.pageId,
      formId: form.formId,
      formName: form.formName || '',
      mappingId: form.mappingId || null,
      courseId: '',
      courseName: '',
      jobId: '',
      jobName: '',
      leadSourceId: '',
      leadSource: '',
      defaultStatusId: '',
      defaultStatus: '',
      defaultSubstatusId: '',
      defaultSubstatus: '',
      isActive: false,
      statusLabel: form.inactiveMapping ? 'Inactive' : 'Unmapped',
    });
  });
  dedupeByForm(mappings).forEach((mapping) => {
    map.set(formKey(mapping.pageId, mapping.formId), {
      ...mapping,
      mappingId: mapping.id || mapping.mappingId || null,
      formName: mapping.formName || '',
      statusLabel: mapping.isActive ? 'Mapped' : 'Inactive',
    });
  });
  return [...map.values()];
}

export function applyFormCatalog(rows, forms) {
  const catalog = new Map(dedupeByForm(forms).map(form => [formKey(form.pageId, form.formId), form]));
  return rows.map((row) => {
    const form = catalog.get(formKey(row.pageId, row.formId));
    if (!form) return row;
    return {
      ...row,
      formName: row.formName || form.formName || '',
      metadataStatus: form.metadataStatus || row.metadataStatus || '',
    };
  });
}

export function filterMappingRows(rows, { status, search }) {
  const query = String(search || '').trim().toLowerCase();
  return (rows || []).filter((row) => {
    if (status && status !== 'All' && row.statusLabel !== status) return false;
    if (!query) return true;
    const haystack = [
      row.pageId,
      row.formId,
      row.formName,
      row.courseName,
      row.jobName,
      row.leadSource,
      row.defaultStatus,
      row.defaultSubstatus,
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

export function adsQuery(filter, page) {
  const params = new URLSearchParams({ page: String(page || 1), limit: '20' });
  if (filter === 'active') params.set('effectiveStatus', 'ACTIVE');
  if (filter === 'unresolved') params.set('discoveryStatus', 'form_unresolved');
  return params.toString();
}

export function emptySelection(form) {
  return {
    pageId: form.pageId || '',
    formId: form.formId || '',
    formName: form.formName || '',
    mappingId: form.mappingId || null,
    courseId: '',
    jobId: '',
    leadSource: '',
    defaultStatus: '',
    defaultSubstatus: '',
    isActive: form.statusLabel !== 'Inactive',
  };
}

export function selectionFromMapping(mapping) {
  return {
    pageId: mapping.pageId || '',
    formId: mapping.formId || '',
    formName: mapping.formName || '',
    mappingId: mapping.id || mapping.mappingId || null,
    courseId: mapping.courseId || '',
    jobId: mapping.jobId || '',
    leadSource: mapping.leadSourceId || '',
    defaultStatus: mapping.defaultStatusId || '',
    defaultSubstatus: mapping.defaultSubstatusId || '',
    isActive: mapping.isActive !== false,
  };
}

export function nextSelection(current, patch) {
  const next = { ...current, ...patch };
  if (patch.courseId) next.jobId = '';
  if (patch.jobId) next.courseId = '';
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultStatus') && patch.defaultStatus !== current.defaultStatus) {
    next.defaultSubstatus = '';
  }
  return next;
}

export function substatusesFor(statuses, statusId) {
  const status = (statuses || []).find(item => item.id === statusId);
  return status ? status.substatuses || [] : [];
}

const FIELD_CODES = {
  course_not_found: 'courseId',
  job_not_found: 'jobId',
  target_required: 'courseId',
  target_conflict: 'courseId',
  project_not_used: 'courseId',
  lead_source_not_found: 'leadSource',
  lead_source_inactive: 'leadSource',
  status_not_found: 'defaultStatus',
  status_not_assigned: 'defaultStatus',
  substatus_not_found: 'defaultSubstatus',
  substatus_not_assigned: 'defaultSubstatus',
};

export function fieldError(code) {
  return FIELD_CODES[code] || '';
}

export function selectionIsCurrent(selection, options) {
  const hasCourse = Boolean(selection.courseId);
  const hasJob = Boolean(selection.jobId);
  if (hasCourse === hasJob) return false;
  if (!selection.leadSource || !selection.defaultStatus || !selection.defaultSubstatus) return false;
  const courseOk = !hasCourse || (options.courses || []).some(course => course.id === selection.courseId);
  const jobOk = !hasJob || (options.jobs || []).some(job => job.id === selection.jobId);
  const sourceOk = (options.leadSources || []).some(source => source.id === selection.leadSource);
  const status = (options.statuses || []).find(item => item.id === selection.defaultStatus);
  const subOk = Boolean(status && (status.substatuses || []).some(sub => sub.id === selection.defaultSubstatus));
  return courseOk && jobOk && sourceOk && subOk;
}

export function mappingPayload(selection) {
  const payload = {
    pageId: selection.pageId,
    formId: selection.formId,
    leadSource: selection.leadSource,
    defaultStatus: selection.defaultStatus,
    defaultSubstatus: selection.defaultSubstatus,
  };
  if (selection.jobId) payload.jobId = selection.jobId;
  else payload.courseId = selection.courseId;
  return payload;
}

export function discoveryLabel(status) {
  if (status === 'lead_form_found') return 'Lead form found';
  if (status === 'form_unresolved') return 'Form unresolved';
  if (status === 'not_lead_ad') return 'Not a lead ad';
  return status || 'Unknown';
}

export function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}
