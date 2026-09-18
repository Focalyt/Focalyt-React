const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const router = express.Router();
const { isCollege } = require('../../../helpers');
const StatusHr = require('../../models/statusHr');
const College = require('../../models/college');
const User = require('../../models/users');
const CandidateProfile = require('../../models/candidateProfile');
const Project = require('../../models/Project');
let Status = require('../../models/status');
const Vertical = require('../../models/verticals');
const Vacancy = require('../../models/vacancy');
const AppliedJobs = require('../../models/appliedJobs');
const { resolveJobHrOwner } = require('../../../helpers/resolveJobHrOwner');

const STATUS_POPULATE = { path: 'leadStatus', select: 'title milestone substatuses' };
const HR_DOCUMENT_TYPES = [
  { key: 'resume', name: 'Resume / CV' },
];
const { resolvePublicUrl } = require('../../../helpers/s3Storage');
const { uploadSinglefile } = require('../functions/images');

const isActualMediaFile = (value) => {
  const v = String(value || '').trim();
  if (!v) return false;
  if (/^(n\/?a|null|undefined|not found|none|-)$/i.test(v)) return false;
  const path = v.split('?')[0];
  if (/\.(pdf|png|jpe?g|gif|webp|bmp|doc|docx)$/i.test(path)) return true;
  return /(?:^|\/)uploads\//i.test(v);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

// Lead sources send mobiles as +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX or plain 10 digits.
const normalizeMobile = (value) => {
  let mobile = String(value || '')
    .trim()
    .replace(/[\s\-()]/g, '');

  if (mobile.startsWith('+91')) mobile = mobile.slice(3);
  else if (mobile.startsWith('0091')) mobile = mobile.slice(4);
  else if (mobile.startsWith('91') && mobile.length === 12) mobile = mobile.slice(2);
  else if (mobile.startsWith('0') && mobile.length === 11) mobile = mobile.slice(1);

  return mobile;
};

const capitalizeWords = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const serializeLead = (doc) => {
  const lead = doc?.toObject ? doc.toObject() : { ...doc };
  const candidate = lead._candidate && typeof lead._candidate === 'object' ? lead._candidate : null;
  const job = lead._job && typeof lead._job === 'object' ? lead._job : null;
  if (!lead.fullName && candidate?.name) lead.fullName = candidate.name;
  if (!lead.mobile && (candidate?.mobile || candidate?.mobile === 0)) lead.mobile = candidate.mobile;
  if (!lead.email && candidate?.email) lead.email = candidate.email;
  if (!lead.city && candidate?.personalInfo?.currentAddress?.city) {
    lead.city = candidate.personalInfo.currentAddress.city;
  }
  if (!lead.gender && candidate?.sex) lead.gender = candidate.sex;
  if (!lead.applyingFor && job?.title) lead.applyingFor = job.title;
  if (!lead.experience && candidate?.personalInfo?.totalExperience != null) {
    lead.experience = String(candidate.personalInfo.totalExperience);
  }
  if (!lead.qualification && candidate?.qualifications?.[0]?.specialization) {
    lead.qualification = candidate.qualifications[0].specialization;
  }
  if (!lead.dateOfBirth && candidate?.dob) lead.dateOfBirth = candidate.dob;
  if (!lead.remark && candidate?.remark) lead.remark = candidate.remark;
  if (!lead.source && candidate?.source) lead.source = candidate.source;
  if (!lead.maritalStatus && candidate?.maritalStatus) lead.maritalStatus = candidate.maritalStatus;
  if (!lead.project && candidate?.project) lead.project = candidate.project;
  if (!lead.department && candidate?.department) lead.department = candidate.department;
  if (!lead.resume && candidate?.personalInfo?.resume?.[0]?.url) {
    lead.resume = candidate.personalInfo.resume[0].url;
  }
  if (!lead.leadOwner && job?.hr) lead.leadOwner = job.hr;
  if (isActualMediaFile(lead.resume)) {
    lead.resume = resolvePublicUrl(lead.resume) || lead.resume;
  } else {
    lead.resume = '';
  }
  lead.leadOwner = lead.leadOwner || lead.assignedTo || null;
  lead.projectName = (lead.project && typeof lead.project === 'object' && lead.project.name) ? lead.project.name : '';
  lead.departmentName = (lead.department && typeof lead.department === 'object' && lead.department.name) ? lead.department.name : '';
  if (lead.project && typeof lead.project === 'object' && lead.project.name) {
    lead.project = { _id: lead.project._id, name: lead.project.name };
  }
  if (lead.department && typeof lead.department === 'object' && lead.department.name) {
    lead.department = { _id: lead.department._id, name: lead.department.name };
  }

  const statusRef = lead.leadStatus;
  if (statusRef && typeof statusRef === 'object' && statusRef.title) {
    const sub = (statusRef.substatuses || []).find(
      (item) => String(item._id) === String(lead.leadSubstatus || '')
    );
    lead.leadStatus = {
      _id: statusRef._id,
      title: statusRef.title,
      milestone: statusRef.milestone || '',
    };
    lead.statusTitle = statusRef.title;
    lead.statusMilestone = statusRef.milestone || '';
    lead.subStatusTitle = sub?.title || '';
  } else {
    lead.leadStatus = null;
    lead.statusTitle = '';
    lead.statusMilestone = '';
    lead.subStatusTitle = '';
  }

  const docsByKey = {};
  (lead.documents || []).forEach((item) => {
    if (item?.key && isActualMediaFile(item.fileUrl)) docsByKey[item.key] = item;
  });
  if (isActualMediaFile(lead.resume) && !docsByKey.resume?.fileUrl) {
    docsByKey.resume = {
      key: 'resume',
      name: 'Resume / CV',
      fileUrl: lead.resume,
      uploadedAt: lead.updatedAt || lead.createdAt || null,
    };
  }
  lead.documents = HR_DOCUMENT_TYPES.map((type) => {
    const saved = docsByKey[type.key] || {};
    const raw = saved.fileUrl || (type.key === 'resume' ? lead.resume : '') || '';
    const fileUrl = isActualMediaFile(raw) ? (resolvePublicUrl(raw) || raw) : '';
    return {
      key: type.key,
      name: type.name,
      fileUrl,
      uploadedAt: fileUrl ? (saved.uploadedAt || null) : null,
    };
  });
  const summary = buildFollowupSummary(lead.followups);
  lead.followupCounts = summary.counts;
  lead.nextCallFollowup = summary.nextCall;
  lead.nextVisitFollowup = summary.nextVisit;
  return lead;
};

const IST_TIMEZONE = 'Asia/Kolkata';

const getStartOfTodayIST = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return new Date(`${y}-${m}-${d}T00:00:00+05:30`);
};

const closeOpenHrFollowups = (lead, type) => {
  const now = new Date();
  const startOfToday = getStartOfTodayIST();
  (lead.followups || []).forEach((item) => {
    if (item.type !== type || item.status !== 'planned') return;
    const when = item.followupDate ? new Date(item.followupDate) : null;
    if (when && when.getTime() < startOfToday.getTime()) {
      item.status = 'missed';
      return;
    }
    item.status = 'done';
    item.completedAt = now;
  });
};

const isHrFollowupMissed = (item, startOfToday = getStartOfTodayIST()) => {
  if (!item || item.status === 'done') return false;
  if (item.status === 'missed') return true;
  const followupDate = item.followupDate ? new Date(item.followupDate) : null;
  return Boolean(followupDate && followupDate < startOfToday);
};

const buildFollowupSummary = (followups = []) => {
  const startOfToday = getStartOfTodayIST();
  const counts = {
    call: { done: 0, planned: 0, missed: 0 },
    visit: { done: 0, planned: 0, missed: 0 },
  };
  let nextCall = null;
  let nextVisit = null;

  (followups || []).forEach((item) => {
    const bucketKey = item?.type === 'Visit' ? 'visit' : 'call';
    const followupDate = item?.followupDate ? new Date(item.followupDate) : null;
    if (item?.status === 'done') {
      counts[bucketKey].done += 1;
      return;
    }
    if (isHrFollowupMissed(item, startOfToday)) {
      counts[bucketKey].missed += 1;
      return;
    }
    if (!followupDate) return;
    counts[bucketKey].planned += 1;
    const current = bucketKey === 'visit' ? nextVisit : nextCall;
    if (!current || followupDate < new Date(current.followupDate)) {
      const next = { followupDate, remarks: item.remarks || '' };
      if (bucketKey === 'visit') nextVisit = next;
      else nextCall = next;
    }
  });

  return { counts, nextCall, nextVisit };
};

const followupMatch = (type, bucket) => {
  const startOfToday = getStartOfTodayIST();
  if (bucket === 'done') {
    return { followups: { $elemMatch: { type, status: 'done' } } };
  }
  if (bucket === 'missed') {
    return {
      followups: {
        $elemMatch: {
          type,
          $or: [
            { status: 'missed' },
            { status: 'planned', followupDate: { $lt: startOfToday } },
          ],
        },
      },
    };
  }
  return { followups: { $elemMatch: { type, status: 'planned', followupDate: { $gte: startOfToday } } } };
};

const parseHrFollowupDate = (value) => {
  if (!value || value === 'null') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const parsed = moment(value, 'YYYY-MM-DD');
    return parsed.isValid() ? parsed : null;
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed : null;
};

const resolveHrFollowupRange = (fromDate, toDate, allTime) => {
  if (String(allTime) === 'true') return { from: null, to: null };
  const fromM = parseHrFollowupDate(fromDate);
  const toM = parseHrFollowupDate(toDate) || fromM;
  if (!fromM && !toM) {
    return {
      from: moment().startOf('day').toDate(),
      to: moment().endOf('day').toDate(),
    };
  }
  return {
    from: fromM ? fromM.clone().startOf('day').toDate() : null,
    to: toM ? toM.clone().endOf('day').toDate() : null,
  };
};

const buildHrUnwoundFollowupMatch = (status = 'planned', from, to) => {
  const startOfToday = getStartOfTodayIST();
  const dateFilter = {};

  if (status === 'done') {
    if (from) dateFilter.$gte = from;
    if (to) dateFilter.$lte = to;
    return {
      'followups.status': 'done',
      ...(Object.keys(dateFilter).length ? { 'followups.followupDate': dateFilter } : {}),
    };
  }

  if (status === 'missed') {
    const missedDate = {};
    if (from) missedDate.$gte = from;
    if (to) missedDate.$lte = to;
    const overdueDate = { $lt: startOfToday };
    if (from) overdueDate.$gte = from;
    if (to && to < startOfToday) overdueDate.$lt = to;
    return {
      $or: [
        {
          'followups.status': 'missed',
          ...(Object.keys(missedDate).length ? { 'followups.followupDate': missedDate } : {}),
        },
        { 'followups.status': 'planned', 'followups.followupDate': overdueDate },
      ],
    };
  }

  const plannedFrom = from && from > startOfToday ? from : startOfToday;
  dateFilter.$gte = plannedFrom;
  if (to) dateFilter.$lte = to;
  if (dateFilter.$lte && dateFilter.$gte > dateFilter.$lte) {
    dateFilter.$gte = new Date('9999-01-01');
  }
  return { 'followups.status': 'planned', 'followups.followupDate': dateFilter };
};

const buildHrFollowupLeadMatch = (req) => {
  const match = {
    isDeleted: { $ne: true },
    followups: { $exists: true, $not: { $size: 0 } },
  };

  const name = String(req.query.name || '').trim();
  if (name) {
    match.$or = [
      { fullName: new RegExp(name, 'i') },
      { email: new RegExp(name, 'i') },
      { mobile: new RegExp(name, 'i') },
    ];
  }

  let counselorArray = [];
  try {
    if (req.query.counselor) counselorArray = JSON.parse(req.query.counselor);
  } catch (error) {
    counselorArray = [];
  }
  if (Array.isArray(counselorArray) && counselorArray.length) {
    const ids = counselorArray
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (ids.length) {
      const ownerOr = [
        { leadOwner: { $in: ids } },
        { assignedTo: { $in: ids } },
        { 'followups.createdBy': { $in: ids } },
      ];
      if (match.$or) {
        match.$and = [{ $or: match.$or }, { $or: ownerOr }];
        delete match.$or;
      } else {
        match.$or = ownerOr;
      }
    }
  }

  return applyCollegeScope(match, req.user?.college?._id);
};

const serializeHrFollowupRow = (lead, item) => ({
  _id: item._id,
  leadId: lead._id,
  appliedCourseId: lead._id,
  name: lead.fullName,
  mobile: lead.mobile,
  email: lead.email,
  city: lead.city,
  applyingFor: lead.applyingFor,
  followupDate: item.followupDate,
  followUpType: item.type || 'Call',
  remarks: item.remarks || '',
  status: item.status,
  _candidate: {
    name: lead.fullName,
    mobile: lead.mobile,
    email: lead.email,
  },
});

const toObjectId = (value) => {
  if (!value) return null;
  const id = typeof value === 'object' ? (value._id || value.id) : value;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
  return String(id);
};

const sameId = (a, b) => {
  const left = toObjectId(a);
  const right = toObjectId(b);
  return Boolean(left && right && left === right);
};

const toCollegeObjectId = (value) => {
  const id = toObjectId(value);
  return id ? new mongoose.Types.ObjectId(id) : null;
};

const collegeScopeFilter = (collegeId) => {
  const id = toCollegeObjectId(collegeId);
  if (!id) return {};
  return { college: id };
};

const applyCollegeScope = (match, collegeId) => {
  const scope = collegeScopeFilter(collegeId);
  if (scope.college) match.college = scope.college;
  return match;
};

const parseIdList = (value) => {
  if (value == null || value === '') return [];
  let items = value;
  if (typeof value === 'string') {
    try {
      items = JSON.parse(value);
    } catch {
      items = value.split(',');
    }
  }
  if (!Array.isArray(items)) items = [items];
  return items
    .map((id) => String(id || '').trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

const parseYesNo = (value) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'true' || raw === 'yes' || raw === '1') return true;
  if (raw === 'false' || raw === 'no' || raw === '0') return false;
  return null;
};

const dayRange = (from, to) => {
  const range = {};
  if (from) {
    const start = moment(from).startOf('day').toDate();
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }
  if (to) {
    const end = moment(to).endOf('day').toDate();
    if (!Number.isNaN(end.getTime())) range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const exactInsensitive = (value) => new RegExp(`^${String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const pickBodyValue = (body, keys) => {
  for (const key of keys) {
    const value = body?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return undefined;
};

const normalizeGender = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'm' || raw === 'male') return 'Male';
  if (raw === 'f' || raw === 'female') return 'Female';
  if (raw === 'o' || raw === 'other') return 'Other';
  return String(value || '').trim();
};

const parseIncomingDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const str = String(value).trim();
  const parsed = moment(str, ['DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'M/D/YYYY', moment.ISO_8601], true);
  if (parsed.isValid()) return parsed.toDate();
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const mobileLookupValues = (mobile) => {
  const values = [mobile, String(mobile)];
  const asNumber = Number(mobile);
  if (!Number.isNaN(asNumber)) values.push(asNumber);
  return [...new Set(values)];
};

const resolveNamedProjectAndDepartment = async ({ projectName, departmentName, collegeId }) => {
  const result = { projectId: null, departmentId: null };

  if (departmentName) {
    const collegeScoped = collegeId
      ? await Vertical.findOne({ name: exactInsensitive(departmentName), college: collegeId })
      : null;
    const department = collegeScoped
      || await Vertical.findOne({ name: exactInsensitive(departmentName) });
    if (!department) {
      return { error: 'department_not_found' };
    }
    result.departmentId = department._id;
  }

  if (projectName) {
    const collegeQuery = { name: exactInsensitive(projectName) };
    if (collegeId) collegeQuery.college = collegeId;
    const collegeScoped = await Project.findOne(collegeQuery);
    const project = collegeScoped
      || await Project.findOne({ name: exactInsensitive(projectName) });
    if (!project) {
      return { error: 'project_not_found' };
    }
    if (result.departmentId && project.vertical && String(project.vertical) !== String(result.departmentId)) {
      return { error: 'project_department_mismatch' };
    }
    result.projectId = project._id;
    if (!result.departmentId && project.vertical) {
      result.departmentId = project.vertical;
    }
  }

  return result;
};

const firstHrStatus = async (collegeId) => {
  const id = toCollegeObjectId(collegeId);
  if (id) {
    const owned = await StatusHr.findOne({ isDeleted: { $ne: true }, college: id }).sort({ index: 1 });
    if (owned) return owned;
  }
  return StatusHr.findOne({
    isDeleted: { $ne: true },
    $or: [{ college: null }, { college: { $exists: false } }],
  }).sort({ index: 1 });
};

// Digital lead payloads send status/sub-status as titles, so resolve them against HR Status Design.
const resolveHrStatus = async (statusTitle, subStatusTitle, collegeId) => {
  const id = toCollegeObjectId(collegeId);
  let status = null;
  if (statusTitle) {
    if (id) {
      status = await StatusHr.findOne({
        isDeleted: { $ne: true },
        title: exactInsensitive(statusTitle),
        college: id,
      });
    }
    if (!status) {
      status = await StatusHr.findOne({
        isDeleted: { $ne: true },
        title: exactInsensitive(statusTitle),
        $or: [{ college: null }, { college: { $exists: false } }],
      });
    }
    if (!status) return { error: 'Status not found' };
  } else {
    status = await firstHrStatus(collegeId);
  }

  if (!status) return { status: null, substatus: null };

  let substatus = null;
  if (subStatusTitle) {
    substatus = (status.substatuses || []).find(
      (item) => String(item.title || '').trim().toLowerCase() === String(subStatusTitle).trim().toLowerCase()
    );
    if (!substatus) return { error: 'Substatus not found' };
  } else {
    substatus = status.substatuses?.[0] || null;
  }

  return { status, substatus };
};

const findSubstatusByTitle = (statusDoc, subStatusTitle) => {
  const wanted = String(subStatusTitle || '').trim().toLowerCase();
  if (!wanted) return null;
  return (statusDoc?.substatuses || []).find(
    (item) => String(item.title || '').trim().toLowerCase() === wanted
  ) || null;
};

const resolveCollegeStatus = async (statusTitle, subStatusTitle, collegeId) => {
  const title = String(statusTitle || '').trim();
  if (!title) return { error: 'Status not found' };

  const id = toCollegeObjectId(collegeId);
  const statuses = await Status.find({ title: exactInsensitive(title) });
  if (!statuses.length) return { error: 'Status not found' };

  const rank = (doc) => {
    if (id && doc.college && String(doc.college) === String(id)) return 0;
    if (!doc.college) return 1;
    return 2;
  };

  const ordered = [...statuses].sort((a, b) => rank(a) - rank(b));
  for (const status of ordered) {
    const substatus = findSubstatusByTitle(status, subStatusTitle);
    if (substatus) return { status, substatus };
  }

  return { error: 'Substatus not found' };
};

const parseHiringStatusTitles = (hiringStatus = [], jobId) => {
  const entry = (hiringStatus || []).find((item) => String(item?.job || '') === String(jobId || ''));
  const raw = String(entry?.status || '').trim();
  if (!raw) return { statusTitle: '', subStatusTitle: '', entry: null };
  const [statusTitle, ...rest] = raw.split('/').map((part) => part.trim()).filter(Boolean);
  return { statusTitle: statusTitle || '', subStatusTitle: rest.join(' / '), entry: entry || null };
};

const hiringEntryForJob = (candidate, jobId) =>
  (candidate?.hiringStatus || []).find((item) => String(item?.job || '') === String(jobId || '')) || null;

const APPLY_LEAD_POPULATE = [
  {
    path: '_candidate',
    populate: [
      { path: 'project', select: 'name' },
      { path: 'department', select: 'name' },
      { path: 'college', select: 'name' },
    ],
  },
  {
    path: '_job',
    select: 'title hr',
    populate: [
      { path: 'hr', select: 'name email' },
      { path: 'vertical', select: 'name' },
      { path: 'project', select: 'name' },
    ],
  },
  { path: 'leadOwner', select: 'name email' },
  { path: 'leadCoOwner', select: 'name email' },
  { path: 'assignedTo', select: 'name email' },
  { path: 'project', select: 'name' },
  { path: 'department', select: 'name' },
  { path: 'logs.user', select: 'name email' },
  STATUS_POPULATE,
];

const loadStatusIndex = async (collegeId) => {
  const id = toCollegeObjectId(collegeId);
  const scope = [{ college: null }, { college: { $exists: false } }];
  if (id) scope.unshift({ college: id });
  const list = await StatusHr.find({ isDeleted: { $ne: true }, $or: scope }).sort({ index: 1 }).lean();
  const byTitle = new Map();
  const byId = new Map();
  list.forEach((status) => {
    byId.set(String(status._id), status);
    byTitle.set(String(status.title || '').trim().toLowerCase(), status);
  });
  return { list, byTitle, byId };
};

const mapApplyToLead = (apply, statusIndex) => {
  const candidate = apply?._candidate && typeof apply._candidate === 'object' ? apply._candidate : {};
  const job = apply?._job && typeof apply._job === 'object' ? apply._job : {};
  const jobId = job._id || apply?._job;
  const { statusTitle, subStatusTitle } = parseHiringStatusTitles(candidate.hiringStatus, jobId);
  let statusDoc = apply.leadStatus && apply.leadStatus.title
    ? apply.leadStatus
    : (apply.leadStatus ? statusIndex.byId.get(String(apply.leadStatus)) : null);
  if (!statusDoc && statusTitle) {
    statusDoc = statusIndex.byTitle.get(statusTitle.toLowerCase()) || null;
  }
  const subFromApply = apply.leadSubstatus
    ? (statusDoc?.substatuses || []).find((item) => String(item._id) === String(apply.leadSubstatus))
    : null;
  const subFromHiring = (statusDoc?.substatuses || []).find(
    (item) => String(item.title || '').trim().toLowerCase() === String(subStatusTitle || '').trim().toLowerCase()
  ) || null;
  const sub = subFromApply || subFromHiring || null;
  const resumeUrl = apply.resume
    || (candidate.personalInfo?.resume || []).find((item) => isActualMediaFile(item?.url))?.url
    || '';
  const leadOwner = apply.leadOwner || apply.assignedTo || job.hr || null;

  return serializeLead({
    _id: apply._id,
    fullName: candidate.name || '',
    mobile: candidate.mobile,
    email: candidate.email || '',
    city: candidate.personalInfo?.currentAddress?.city || '',
    gender: candidate.sex || '',
    applyingFor: job.title || '',
    experience: candidate.personalInfo?.totalExperience != null
      ? String(candidate.personalInfo.totalExperience)
      : '',
    qualification: candidate.qualifications?.[0]?.specialization || '',
    dateOfBirth: candidate.dob || null,
    remark: apply.remark || candidate.remark || '',
    source: apply.source || candidate.source || '',
    college: apply.college || candidate.college || null,
    project: apply.project || candidate.project || job.project || null,
    department: apply.department || candidate.department || job.vertical || null,
    maritalStatus: candidate.maritalStatus || '',
    resume: resumeUrl,
    documents: apply.documents || [],
    leadStatus: statusDoc || null,
    leadSubstatus: sub?._id || apply.leadSubstatus || null,
    leadOwner,
    leadCoOwner: apply.leadCoOwner || null,
    assignedTo: apply.assignedTo || leadOwner,
    followups: apply.followups || [],
    logs: apply.logs || [],
    createdAt: apply.createdAt,
    updatedAt: apply.updatedAt,
    candidate: candidate._id || apply._candidate,
    _job: job._id || apply._job,
  });
};

const collegeCandidateMatch = (collegeId, extra = {}) => {
  const id = toCollegeObjectId(collegeId);
  const match = { isDeleted: { $ne: true }, ...extra };
  if (id) match.college = id;
  return match;
};

const queryAppliedLeads = async (query, collegeId) => {
  const candMatch = collegeCandidateMatch(collegeId);
  const extraClauses = [];
  const q = String(query.search || '').trim();
  if (q) {
    const digits = q.replace(/\D/g, '');
    const searchOr = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
    if (digits) {
      searchOr.push({ mobile: digits });
      const asNumber = Number(digits);
      if (!Number.isNaN(asNumber)) searchOr.push({ mobile: asNumber });
    }
    extraClauses.push({ $or: searchOr });
  }
  if (query.city) {
    extraClauses.push({ 'personalInfo.currentAddress.city': new RegExp(String(query.city).trim(), 'i') });
  }
  if (extraClauses.length) candMatch.$and = extraClauses;

  const collegeIdObj = toCollegeObjectId(collegeId);
  const candidateIds = await CandidateProfile.find(candMatch).distinct('_id');
  const applyMatch = {
    isDeleted: { $ne: true },
    $or: [
      ...(collegeIdObj ? [{ college: collegeIdObj }] : []),
      { _candidate: { $in: candidateIds.length ? candidateIds : [new mongoose.Types.ObjectId()] } },
    ],
  };

  const createdRange = dayRange(query.createdFromDate || query.startDate, query.createdToDate || query.endDate);
  if (createdRange) applyMatch.createdAt = createdRange;
  const modifiedRange = dayRange(query.modifiedFromDate, query.modifiedToDate);
  if (modifiedRange) applyMatch.updatedAt = modifiedRange;

  let applies = await AppliedJobs.find(applyMatch)
    .populate(APPLY_LEAD_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  applies = applies.filter((item) => item._candidate && item._candidate._id);

  if (query.applyingFor) {
    applies = applies.filter((item) => String(item._job?.title || '') === String(query.applyingFor));
  }

  const statusIndex = await loadStatusIndex(collegeId);
  let leads = applies.map((item) => mapApplyToLead(item, statusIndex));

  if (query.leadStatus && query.leadStatus !== 'all') {
    if (query.leadStatus === 'none') {
      leads = leads.filter((lead) => !lead.leadStatus);
    } else {
      leads = leads.filter((lead) => String(lead.leadStatus?._id || '') === String(query.leadStatus));
    }
  }
  if (query.subStatus) {
    leads = leads.filter((lead) => String(lead.leadSubstatus || '') === String(query.subStatus));
  }

  const ownerIds = parseIdList(query.owner).map(String);
  const counselorIds = parseIdList(query.counselor).map(String);
  const ownerFilter = [...ownerIds, ...counselorIds];
  if (ownerFilter.length) {
    leads = leads.filter((lead) => ownerFilter.includes(String(lead.leadOwner?._id || lead.leadOwner || '')));
  }

  if (query.project && mongoose.Types.ObjectId.isValid(String(query.project))) {
    const projectId = String(query.project);
    leads = leads.filter((lead) => String(lead.project?._id || lead.project || '') === projectId);
  }
  if (query.department && mongoose.Types.ObjectId.isValid(String(query.department))) {
    const departmentId = String(query.department);
    leads = leads.filter((lead) => {
      const leadDept = String(lead.department?._id || lead.department || '');
      return !leadDept || leadDept === departmentId;
    });
  }

  return { leads, statusIndex };
};

const loadAppliedLead = async (id, collegeId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const apply = await AppliedJobs.findById(id).populate(APPLY_LEAD_POPULATE);
  if (!apply?._candidate) return null;
  const college = toCollegeObjectId(collegeId);
  const applyCollege = toCollegeObjectId(apply.college);
  const candidateCollege = toCollegeObjectId(apply._candidate.college);
  if (college) {
    const matchesApply = applyCollege && String(applyCollege) === String(college);
    const matchesCandidate = candidateCollege && String(candidateCollege) === String(college);
    if (!matchesApply && !matchesCandidate) return null;
  }
  const statusIndex = await loadStatusIndex(collegeId);
  return {
    apply,
    candidate: apply._candidate,
    job: apply._job,
    lead: mapApplyToLead(apply, statusIndex),
    statusIndex,
  };
};

const buildMatch = (query = {}, collegeId) => {
  const {
    search,
    leadStatus,
    subStatus,
    applyingFor,
    startDate,
    endDate,
    createdFromDate,
    createdToDate,
    modifiedFromDate,
    modifiedToDate,
    nextActionFromDate,
    nextActionToDate,
    city,
    followupType,
    followupBucket,
    owner,
    counselor,
    hasFollowUpCall,
    hasFollowUpVisit,
  } = query;

  const match = { isDeleted: { $ne: true } };
  const extraClauses = [];
  const followupClauses = [];

  if (followupType && followupBucket) {
    followupClauses.push(followupMatch(followupType === 'Visit' ? 'Visit' : 'Call', followupBucket));
  }

  const hasCall = parseYesNo(hasFollowUpCall);
  if (hasCall === true) {
    followupClauses.push({ followups: { $elemMatch: { type: 'Call' } } });
  } else if (hasCall === false) {
    followupClauses.push({ followups: { $not: { $elemMatch: { type: 'Call' } } } });
  }

  const hasVisit = parseYesNo(hasFollowUpVisit);
  if (hasVisit === true) {
    followupClauses.push({ followups: { $elemMatch: { type: 'Visit' } } });
  } else if (hasVisit === false) {
    followupClauses.push({ followups: { $not: { $elemMatch: { type: 'Visit' } } } });
  }

  const nextActionRange = dayRange(nextActionFromDate, nextActionToDate);
  if (nextActionRange) {
    followupClauses.push({ followups: { $elemMatch: { followupDate: nextActionRange } } });
  }

  if (followupClauses.length === 1) {
    Object.assign(match, followupClauses[0]);
  } else if (followupClauses.length > 1) {
    extraClauses.push(...followupClauses);
  }

  // Statuses are configured from the HR Status Design page, so filters carry StatusHr ids.
  // 'none' keeps the bucket of leads that were never moved to a configured status.
  if (leadStatus && leadStatus !== 'all') {
    if (leadStatus === 'none') {
      match.$or = [{ leadStatus: null }, { leadStatus: { $exists: false } }];
    } else if (mongoose.Types.ObjectId.isValid(String(leadStatus))) {
      match.leadStatus = new mongoose.Types.ObjectId(String(leadStatus));
    }
  }

  if (subStatus && mongoose.Types.ObjectId.isValid(String(subStatus))) {
    match.leadSubstatus = new mongoose.Types.ObjectId(String(subStatus));
  }

  if (applyingFor) {
    match.applyingFor = applyingFor;
  }

  if (city) {
    match.city = new RegExp(String(city).trim(), 'i');
  }

  const createdStart = createdFromDate || startDate;
  const createdEnd = createdToDate || endDate;
  const createdRange = dayRange(createdStart, createdEnd);
  if (createdRange) match.createdAt = createdRange;

  const modifiedRange = dayRange(modifiedFromDate, modifiedToDate);
  if (modifiedRange) match.updatedAt = modifiedRange;

  const ownerIds = parseIdList(owner);
  const counselorIds = parseIdList(counselor);
  if (ownerIds.length) {
    extraClauses.push({
      $or: [
        { leadOwner: { $in: ownerIds } },
        { assignedTo: { $in: ownerIds } },
      ],
    });
  }
  if (counselorIds.length) {
    extraClauses.push({
      $or: [
        { assignedTo: { $in: counselorIds } },
        { leadOwner: { $in: counselorIds } },
      ],
    });
  }

  if (extraClauses.length) {
    match.$and = [...(match.$and || []), ...extraClauses];
  }

  const q = String(search || '').trim();
  if (q) {
    const searchOr = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { mobile: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { applyingFor: new RegExp(q, 'i') },
      { experience: new RegExp(q, 'i') },
    ];
    if (match.$or) {
      match.$and = [...(match.$and || []), { $or: match.$or }, { $or: searchOr }];
      delete match.$or;
    } else if (match.$and) {
      match.$and.push({ $or: searchOr });
    } else {
      match.$or = searchOr;
    }
  }

  return applyCollegeScope(match, collegeId);
};

router.get('/leads', isCollege, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const { leads } = await queryAppliedLeads(req.query, req.user?.college?._id);
    const total = leads.length;
    const paged = leads.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: {
        leads: paged,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit) || 1, 1),
        },
      },
    });
  } catch (error) {
    console.error('[HR leads] list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR leads' });
  }
});

router.get('/leads/counts', isCollege, async (req, res) => {
  try {
    const { leads } = await queryAppliedLeads({
      ...req.query,
      leadStatus: 'all',
      followupType: undefined,
      followupBucket: undefined,
    }, req.user?.college?._id);

    const counts = { all: leads.length, none: 0 };
    const roles = new Set();
    const followups = {
      call: { done: 0, planned: 0, missed: 0 },
      visit: { done: 0, planned: 0, missed: 0 },
    };
    const startOfToday = getStartOfTodayIST();

    leads.forEach((lead) => {
      if (lead.applyingFor) roles.add(lead.applyingFor);
      const key = lead.leadStatus?._id ? String(lead.leadStatus._id) : 'none';
      counts[key] = (counts[key] || 0) + 1;
      if (key === 'none') counts.none += 1;

      (lead.followups || []).forEach((item) => {
        const bucketKey = item?.type === 'Visit' ? 'visit' : 'call';
        if (item?.status === 'done') followups[bucketKey].done += 1;
        else if (isHrFollowupMissed(item, startOfToday)) followups[bucketKey].missed += 1;
        else if (item?.status === 'planned') followups[bucketKey].planned += 1;
      });
    });

    return res.json({
      success: true,
      data: {
        counts,
        followups,
        roles: [...roles].sort((a, b) => a.localeCompare(b)),
      },
    });
  } catch (error) {
    console.error('[HR leads] counts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR lead counts' });
  }
});

router.get('/my-followups', isCollege, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const followupStatus = String(req.query.followupStatus || 'planned').toLowerCase();
    const { from, to } = resolveHrFollowupRange(req.query.fromDate, req.query.toDate, req.query.allTime);
    const { leads } = await queryAppliedLeads({ search: req.query.name }, req.user?.college?._id);
    const startOfToday = getStartOfTodayIST();

    const matchesStatus = (item) => {
      const when = item.followupDate ? new Date(item.followupDate) : null;
      if (followupStatus === 'done') return item.status === 'done';
      if (followupStatus === 'missed') return isHrFollowupMissed(item, startOfToday);
      return item.status === 'planned' && when && when >= startOfToday;
    };
    const matchesDate = (item) => {
      if (!from && !to) return true;
      const when = item.followupDate ? new Date(item.followupDate) : null;
      if (!when) return false;
      if (from && when < from) return false;
      if (to && when > to) return false;
      return true;
    };

    const rows = [];
    leads.forEach((lead) => {
      (lead.followups || []).forEach((item) => {
        if (!matchesStatus(item) || !matchesDate(item)) return;
        rows.push(serializeHrFollowupRow(lead, item));
      });
    });
    rows.sort((a, b) => new Date(a.followupDate) - new Date(b.followupDate));
    const total = rows.length;
    const data = rows.slice(skip, skip + limit);

    return res.json({
      success: true,
      data,
      page,
      totalPages: Math.max(Math.ceil(total / limit) || 1, 1),
      total,
    });
  } catch (error) {
    console.error('[HR followups] list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR followups' });
  }
});

router.get('/followupcounts', isCollege, async (req, res) => {
  try {
    const startOfToday = getStartOfTodayIST();
    const { from, to } = resolveHrFollowupRange(req.query.fromDate, req.query.toDate, req.query.allTime);
    const { leads } = await queryAppliedLeads({ search: req.query.name }, req.user?.college?._id);
    const counts = { planned: 0, done: 0, missed: 0 };

    leads.forEach((lead) => {
      (lead.followups || []).forEach((item) => {
        const when = item.followupDate ? new Date(item.followupDate) : null;
        if (from && when && when < from) return;
        if (to && when && when > to) return;
        if (item.status === 'done') counts.done += 1;
        else if (isHrFollowupMissed(item, startOfToday)) counts.missed += 1;
        else if (item.status === 'planned') counts.planned += 1;
      });
    });

    return res.json({ success: true, data: counts });
  } catch (error) {
    console.error('[HR followups] counts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR followup counts' });
  }
});

// Configured HR statuses (managed from the HR Status Design page)
router.get('/statuses', isCollege, async (req, res) => {
  try {
    const collegeId = req.user?.college?._id;
    const scope = [{ college: null }, { college: { $exists: false } }];
    if (collegeId) scope.unshift({ college: collegeId });

    const statuses = await StatusHr.find({ isDeleted: { $ne: true }, $or: scope }).sort({ index: 1 });

    return res.json({
      success: true,
      data: statuses.map((status) => ({
        _id: status._id,
        title: status.title,
        description: status.description,
        milestone: status.milestone,
        index: status.index,
        substatuses: (status.substatuses || []).map((sub) => ({
          _id: sub._id,
          title: sub.title,
          description: sub.description,
          hasRemarks: sub.hasRemarks,
          hasFollowup: sub.hasFollowup,
          hasAttachment: sub.hasAttachment,
        })),
      })),
    });
  } catch (error) {
    console.error('[HR leads] statuses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR statuses' });
  }
});

router.get('/leads/download', isCollege, async (req, res) => {
  try {
    const { leads } = await queryAppliedLeads(req.query, req.user?.college?._id);

    const rows = leads.map((lead) => ({
      Date: moment(lead.createdAt).utcOffset('+05:30').format('DD/MM/YYYY hh:mm A'),
      Name: lead.fullName || '',
      Mobile: lead.mobile || '',
      Email: lead.email || '',
      City: lead.city || '',
      'Applying For': lead.applyingFor || '',
      Qualification: lead.qualification || '',
      'Date Of Birth': lead.dateOfBirth ? moment(lead.dateOfBirth).format('DD/MM/YYYY') : '',
      Experience: lead.experience || '',
      Status: lead.leadStatus?.title || '',
      'Sub-Status': (lead.leadStatus?.substatuses || []).find(
        (item) => String(item._id) === String(lead.leadSubstatus || '')
      )?.title || '',
      'Lead Owner': lead.leadOwner?.name || '',
      'Lead Co-Owner': lead.leadCoOwner?.name || '',
      Source: lead.source || '',
      Remark: lead.remark || '',
      Resume: lead.resume ? resolvePublicUrl(lead.resume) || lead.resume : '',
    }));

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[HR leads] download error:', error);
    return res.status(500).json({ success: false, message: 'Failed to download HR leads' });
  }
});

router.post('/leads/refer', isCollege, async (req, res) => {
  try {
    const counselorId = toCollegeObjectId(req.body.counselorId);
    let leadIds = req.body.leadIds || req.body.appliedCourseId;
    if (!Array.isArray(leadIds)) leadIds = leadIds ? [leadIds] : [];
    leadIds = [...new Set(leadIds.map((id) => String(id || '').trim()).filter(Boolean))];

    if (!counselorId) {
      return res.status(400).json({ success: false, message: 'Valid counselor is required' });
    }
    if (!leadIds.length) {
      return res.status(400).json({ success: false, message: 'Select at least one lead to refer' });
    }

    const counselor = await User.findById(counselorId).select('name').lean();
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    const validIds = leadIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const applies = await AppliedJobs.find({ _id: { $in: validIds }, isDeleted: { $ne: true } })
      .populate('_candidate', 'name college')
      .populate('_job', 'hr');
    const collegeId = toCollegeObjectId(req.user?.college?._id);
    const leads = applies.filter((item) => {
      if (!collegeId) return true;
      if (item.college && String(item.college) === String(collegeId)) return true;
      return item._candidate && String(item._candidate.college) === String(collegeId);
    });

    if (!leads.length) {
      return res.status(404).json({ success: false, message: 'No HR leads found' });
    }

    const newName = counselor.name?.trim() || 'Unknown';
    let referred = 0;
    let skipped = 0;

    for (const apply of leads) {
      const previousOwnerId = toCollegeObjectId(apply.leadOwner || apply.assignedTo || apply._job?.hr);
      if (sameId(previousOwnerId, counselorId)) {
        skipped += 1;
        continue;
      }

      let nextCoOwner = toCollegeObjectId(apply.leadCoOwner);
      if (sameId(nextCoOwner, counselorId)) nextCoOwner = null;

      if (previousOwnerId && !sameId(previousOwnerId, counselorId)) {
        if (nextCoOwner && !sameId(nextCoOwner, previousOwnerId)) {
          return res.status(400).json({
            success: false,
            message: `${apply._candidate?.name || 'Lead'} already has a co-owner. Remove the co-owner first so the previous owner can become co-owner.`,
          });
        }
        if (!nextCoOwner) nextCoOwner = previousOwnerId;
      }

      const previousOwner = previousOwnerId
        ? await User.findById(previousOwnerId).select('name').lean()
        : null;
      const oldName = previousOwner?.name?.trim() || 'Unassigned';

      apply.leadOwner = counselorId;
      apply.assignedTo = counselorId;
      apply.leadCoOwner = nextCoOwner;
      apply.logs = apply.logs || [];
      apply.logs.push({
        user: req.user?._id,
        timestamp: new Date(),
        action: `Lead referred from ${oldName} to ${newName}`,
        remarks: previousOwnerId
          ? 'Previous owner set as co-owner'
          : 'No previous owner to set as co-owner',
      });
      await apply.save();
      referred += 1;
    }

    return res.json({
      success: true,
      message: referred
        ? `Referred ${referred} lead(s) successfully${skipped ? `, ${skipped} already owned` : ''}`
        : 'Selected leads are already owned by this counselor',
      data: { referred, skipped, found: leads.length },
    });
  } catch (error) {
    console.error('[HR leads] refer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refer HR leads' });
  }
});

// Manual add from the HR panel.
router.post('/leads', isCollege, async (req, res) => {
  try {
    const fullName = capitalizeWords(req.body.fullName || req.body.name);
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = normalizeMobile(req.body.mobile);
    const city = String(req.body.city || '').trim();
    const applyingFor = String(req.body.applyingFor || req.body.position || '').trim();
    const experience = String(req.body.experience || '').trim();
    const qualification = String(req.body.qualification || '').trim();
    const dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
    const remark = String(req.body.remark || '').trim();
    const source = String(req.body.source || 'manual').trim() || 'manual';

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter a valid full name' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email ID' });
    }
    if (!mobile || !MOBILE_RE.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }
    if (!applyingFor) {
      return res.status(400).json({ success: false, message: 'Applying for is required' });
    }
    if (!experience) {
      return res.status(400).json({ success: false, message: 'Experience is required' });
    }

    let resumeUrl = String(req.body.resume || '').trim();
    const resumeFile = req.files?.resume || req.files?.cv;
    if (resumeFile) {
      const cvKey = await uploadSinglefile(resumeFile);
      resumeUrl = resolvePublicUrl(cvKey);
    }

    const collegeId = req.user?.college?._id || null;
    const defaultStatus = await firstHrStatus(collegeId);
    const jobOwner = await resolveJobHrOwner({
      applyingFor,
      jobId: req.body.jobId || req.body._job,
      collegeId,
    });

    const jobId = toCollegeObjectId(jobOwner.jobId);
    const vacancy = jobId ? await Vacancy.findById(jobId).select('_id title _company hr').lean() : null;
    const mobileValues = mobileLookupValues(mobile);
    let candidate = await CandidateProfile.findOne({
      mobile: { $in: mobileValues },
      isDeleted: { $ne: true },
    });

    const experienceYears = parseInt(String(experience || '').replace(/_/g, ' '), 10);
    const statusLabel = defaultStatus
      ? `${defaultStatus.title}${defaultStatus.substatuses?.[0]?.title ? ` / ${defaultStatus.substatuses[0].title}` : ''}`
      : '';

    if (!candidate) {
      candidate = await CandidateProfile.create({
        name: fullName,
        email,
        mobile: parseInt(mobile, 10),
        source,
        remark,
        college: collegeId,
        dob: dateOfBirth && !Number.isNaN(dateOfBirth.getTime()) ? dateOfBirth : undefined,
        isImported: true,
        personalInfo: {
          totalExperience: Number.isFinite(experienceYears) ? experienceYears : undefined,
          currentAddress: { city },
          resume: isActualMediaFile(resumeUrl) ? [{ name: 'Resume / CV', url: resumeUrl, uploadedAt: new Date() }] : [],
        },
        qualifications: qualification ? [{ specialization: qualification }] : [],
        appliedJobs: jobId ? [{ jobId }] : [],
        hiringStatus: jobId ? [{
          company: vacancy?._company,
          job: jobId,
          status: statusLabel,
          comment: remark,
          eventDate: new Date().toISOString(),
        }] : [],
      });
    } else {
      if (!candidate.college) candidate.college = collegeId;
      if (remark && !candidate.remark) candidate.remark = remark;
      if (city) {
        candidate.personalInfo = candidate.personalInfo || {};
        candidate.personalInfo.currentAddress = candidate.personalInfo.currentAddress || {};
        if (!candidate.personalInfo.currentAddress.city) candidate.personalInfo.currentAddress.city = city;
      }
      if (jobId) {
        const alreadyLinked = (candidate.appliedJobs || []).some((item) => String(item.jobId || item) === String(jobId));
        if (!alreadyLinked) {
          candidate.appliedJobs = candidate.appliedJobs || [];
          candidate.appliedJobs.push({ jobId });
        }
        const existingHiring = hiringEntryForJob(candidate, jobId);
        if (!existingHiring) {
          candidate.hiringStatus = candidate.hiringStatus || [];
          candidate.hiringStatus.push({
            company: vacancy?._company,
            job: jobId,
            status: statusLabel,
            comment: remark,
            eventDate: new Date().toISOString(),
          });
        }
      }
      await candidate.save();
    }

    if (jobId) {
      const alreadyApplied = await AppliedJobs.findOne({ _candidate: candidate._id, _job: jobId });
      if (alreadyApplied) {
        const loaded = await loadAppliedLead(alreadyApplied._id, collegeId);
        return res.status(200).json({
          success: true,
          message: 'Candidate already applied for this job',
          data: loaded?.lead,
        });
      }
    }

    const applied = await AppliedJobs.create({
      _candidate: candidate._id,
      _job: jobId || undefined,
      _company: vacancy?._company || undefined,
      college: collegeId,
      remark,
      source,
      resume: isActualMediaFile(resumeUrl) ? resumeUrl : '',
      leadStatus: defaultStatus?._id || null,
      leadSubstatus: defaultStatus?.substatuses?.[0]?._id || null,
      leadOwner: jobOwner.hrId || undefined,
      assignedTo: jobOwner.hrId || undefined,
      logs: [{
        user: req.user?._id,
        action: 'Lead created',
        remarks: source === 'manual' ? 'Added from HR panel' : source,
      }],
    });
    const loaded = await loadAppliedLead(applied._id, collegeId);

    return res.status(201).json({
      success: true,
      message: 'HR lead added successfully',
      data: loaded?.lead,
    });
  } catch (error) {
    console.error('[HR leads] create error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add HR lead' });
  }
});

// Public ingestion for digital career leads (ads / landing pages / Excel).
// Verify User by mobile. New numbers create User then CandidateProfile, then AppliedJobs.
// Repeat apply for the same job is returned as duplicate. HR list reads AppliedJobs.
router.route("/digitalhrleads").post(async (req, res) => {
  try {
      let fullname = pickBodyValue(req.body, ['fullname', 'full_name', 'fullName', 'name']);
      let mobile = pickBodyValue(req.body, ['mobile', 'phone_number', 'phoneNumber', 'phone']);
      let email = pickBodyValue(req.body, ['email']);
      let gender = pickBodyValue(req.body, ['gender']);
      let city = pickBodyValue(req.body, ['city']);
      let applyingFor = pickBodyValue(req.body, ['applyingFor', 'applying_for']);
      let experience = pickBodyValue(req.body, ['experience']);
      let qualification = pickBodyValue(req.body, ['qualification', 'education_level', 'educationLevel']);
      let dob = pickBodyValue(req.body, ['dob', 'date_of_birth', 'dateOfBirth']);
      let source = pickBodyValue(req.body, ['source']);
      let remark = pickBodyValue(req.body, ['remark', 'Remarks', 'remarks']);
      let status = pickBodyValue(req.body, ['status']);
      let subStatus = pickBodyValue(req.body, ['subStatus', 'sub_status', 'sub status']);
      let college = pickBodyValue(req.body, ['college', 'CollegeId', 'collegeId', 'college_id']);
      const projectName = String(pickBodyValue(req.body, ['project_name', 'projectName', 'project name']) || '').trim();
      const departmentName = String(pickBodyValue(req.body, ['department_name', 'departmentName', 'department name']) || '').trim();
      const maritalStatus = String(pickBodyValue(req.body, ['marital_status', 'maritalStatus']) || '').trim();
      const incomingJobId = pickBodyValue(req.body, ['jobId', '_job', 'job_id']);

      console.log("[DigitalHRLead] POST /digitalhrleads →", {
          fullname,
          mobile,
          applyingFor,
          jobId: incomingJobId,
          city,
          college,
          projectName,
          departmentName,
          source: source || "Digital Lead"
      });

      if (!fullname || !mobile || !email || !gender || !city || !status || !subStatus || !college) {
          return res.status(400).json({
              status: false,
              msg: "All required fields must be provided"
          });
      }

      const collegeId = toCollegeObjectId(college);
      if (!collegeId) {
          return res.status(400).json({
              status: false,
              msg: "Valid college is required"
          });
      }

      const collegeDoc = await College.findOne({ _id: collegeId, isDeleted: { $ne: true } });
      if (!collegeDoc) {
          return res.status(404).json({
              status: false,
              msg: "College not found"
          });
      }

      if (!source) {
        source = 'Digital Lead';
      }

      mobile = normalizeMobile(mobile);

      if (!MOBILE_RE.test(mobile)) {
          return res.status(400).json({
              status: false,
              msg: "Invalid Indian mobile number"
          });
      }

      if (!EMAIL_RE.test(String(email).trim())) {
          return res.status(400).json({
              status: false,
              msg: "Invalid email format"
          });
      }

      gender = normalizeGender(gender);
      const namedRefs = await resolveNamedProjectAndDepartment({
          projectName,
          departmentName,
          collegeId,
      });
      if (namedRefs.error === 'department_not_found') {
          return res.status(404).json({
              status: false,
              msg: "Department not found"
          });
      }
      if (namedRefs.error === 'project_not_found') {
          return res.status(404).json({
              status: false,
              msg: "Project not found"
          });
      }
      if (namedRefs.error === 'project_department_mismatch') {
          return res.status(400).json({
              status: false,
              msg: "Project does not belong to the given department"
          });
      }

      const resolvedStatus = await resolveCollegeStatus(status, subStatus, collegeId);
      if (resolvedStatus.error) {
          return res.status(404).json({
              status: false,
              msg: resolvedStatus.error
          });
      }
      const statusId = resolvedStatus.status;
      const subStatusId = resolvedStatus.substatus;

      const parsedDob = parseIncomingDate(dob);

      if (dob && !parsedDob) {
          return res.status(400).json({
              status: false,
              msg: "Invalid date of birth"
          });
      }

      let resumeUrl = String(req.body.resume || req.body.cv || "").trim();
      const resumeFile = req.files?.resume || req.files?.cv;
      if (resumeFile) {
          const cvKey = await uploadSinglefile(resumeFile);
          resumeUrl = resolvePublicUrl(cvKey);
      }

      applyingFor = String(applyingFor || '').trim();
      const jobOwner = await resolveJobHrOwner({
          applyingFor,
          jobId: incomingJobId,
          collegeId,
      });

      if (jobOwner.error === 'invalid_job_id') {
          return res.status(400).json({
              status: false,
              msg: "Invalid job id"
          });
      }
      if (jobOwner.error === 'job_not_found') {
          return res.status(404).json({
              status: false,
              msg: "Job not found"
          });
      }

      if (incomingJobId) {
          applyingFor = String(jobOwner.jobTitle || applyingFor).trim();
      }

      if (!applyingFor) {
          return res.status(400).json({
              status: false,
              msg: "A valid job id or applyingFor is required"
          });
      }

      const jobId = toCollegeObjectId(jobOwner.jobId || incomingJobId);
      if (!jobId) {
          return res.status(400).json({
              status: false,
              msg: "A valid job id is required"
          });
      }

      const vacancy = await Vacancy.findById(jobId).select('_id title _company vertical project center').lean();
      if (!vacancy) {
          return res.status(404).json({
              status: false,
              msg: "Job not found"
          });
      }

      if (!namedRefs.projectId && vacancy.project) {
          namedRefs.projectId = vacancy.project;
      }
      if (!namedRefs.departmentId && vacancy.vertical) {
          namedRefs.departmentId = vacancy.vertical;
      }

      const mobileNumber = parseInt(mobile, 10);
      const mobileValues = mobileLookupValues(mobile);
      const existingUser = await User.findOne({
          mobile: { $in: mobileValues },
          isDeleted: { $ne: true },
      });
      let existingCandidate = await CandidateProfile.findOne({
          mobile: { $in: mobileValues },
          isDeleted: { $ne: true },
      });

      if (existingCandidate) {
          const alreadyApplied = await AppliedJobs.findOne({
              _candidate: existingCandidate._id,
              _job: jobId,
          });
          const alreadyOnProfile = (existingCandidate.appliedJobs || []).some(
              (item) => String(item.jobId || item) === String(jobId)
          );
          if (alreadyApplied || alreadyOnProfile) {
              console.log("[DigitalHRLead] Duplicate apply →", {
                  mobile,
                  candidateId: existingCandidate._id.toString(),
                  jobId: jobId.toString(),
                  appliedJobId: alreadyApplied?._id?.toString(),
              });
              return res.status(200).json({
                  status: false,
                  duplicate: true,
                  msg: existingUser
                      ? "User already exists for this number and job already applied"
                      : "Candidate already exists and job already applied",
                  data: {
                      appliedJobId: alreadyApplied?._id || null,
                      candidateId: existingCandidate._id,
                      jobId,
                      existingUser: Boolean(existingUser),
                  }
              });
          }
      }

      if (!existingUser) {
          await User.create({
              name: capitalizeWords(fullname),
              email: String(email).trim().toLowerCase(),
              mobile: mobileNumber,
              role: 3,
              status: true,
              source,
              isImported: true,
          });
          console.log("[DigitalHRLead] User created →", { mobile, name: fullname });
      }

      const experienceYears = parseInt(String(experience || '').replace(/_/g, ' '), 10);
      const hiringStatusEntry = {
          company: vacancy._company || undefined,
          job: jobId,
          status: `${statusId.title}${subStatusId?.title ? ` / ${subStatusId.title}` : ''}`,
          comment: remark || '',
          eventDate: new Date().toISOString(),
      };

      if (!existingCandidate) {
          const candidateData = {
              name: capitalizeWords(fullname),
              mobile: mobileNumber,
              email: String(email).trim().toLowerCase(),
              sex: gender,
              dob: parsedDob || undefined,
              verified: false,
              source,
              isImported: true,
              maritalStatus,
              remark: remark || '',
              college: collegeId,
              project: namedRefs.projectId || undefined,
              department: namedRefs.departmentId || undefined,
              isExperienced: Number.isFinite(experienceYears) && experienceYears > 0,
              personalInfo: {
                  totalExperience: Number.isFinite(experienceYears) ? experienceYears : undefined,
                  currentAddress: {
                      city: city || '',
                  },
              },
              appliedJobs: [{ jobId }],
              hiringStatus: [hiringStatusEntry],
          };
          if (qualification) {
              candidateData.qualifications = [{
                  specialization: String(qualification).trim(),
              }];
          }
          if (isActualMediaFile(resumeUrl)) {
              candidateData.personalInfo.resume = [{
                  name: 'Resume / CV',
                  url: resumeUrl,
                  uploadedAt: new Date(),
              }];
          }
          existingCandidate = await CandidateProfile.create(candidateData);
          console.log("[DigitalHRLead] CandidateProfile created →", {
              candidateId: existingCandidate._id.toString(),
              mobile,
          });
      } else {
          const alreadyLinked = (existingCandidate.appliedJobs || []).some(
              (item) => String(item.jobId || item) === String(jobId)
          );
          if (!alreadyLinked) {
              existingCandidate.appliedJobs = existingCandidate.appliedJobs || [];
              existingCandidate.appliedJobs.push({ jobId });
          }
          existingCandidate.personalInfo = existingCandidate.personalInfo || {};
          existingCandidate.personalInfo.currentAddress = existingCandidate.personalInfo.currentAddress || {};
          if (city && !existingCandidate.personalInfo.currentAddress.city) {
              existingCandidate.personalInfo.currentAddress.city = city;
          }
          if (Number.isFinite(experienceYears) && !existingCandidate.personalInfo.totalExperience) {
              existingCandidate.personalInfo.totalExperience = experienceYears;
              existingCandidate.isExperienced = experienceYears > 0;
          }
          if (maritalStatus && !existingCandidate.maritalStatus) existingCandidate.maritalStatus = maritalStatus;
          if (remark && !existingCandidate.remark) existingCandidate.remark = remark;
          if (!existingCandidate.college) existingCandidate.college = collegeId;
          if (!existingCandidate.project && namedRefs.projectId) existingCandidate.project = namedRefs.projectId;
          if (!existingCandidate.department && namedRefs.departmentId) existingCandidate.department = namedRefs.departmentId;
          if (qualification && !(existingCandidate.qualifications || []).length) {
              existingCandidate.qualifications = [{ specialization: String(qualification).trim() }];
          }
          existingCandidate.hiringStatus = existingCandidate.hiringStatus || [];
          existingCandidate.hiringStatus.push(hiringStatusEntry);
          if (isActualMediaFile(resumeUrl)) {
              existingCandidate.personalInfo.resume = existingCandidate.personalInfo.resume || [];
              existingCandidate.personalInfo.resume.push({
                  name: 'Resume / CV',
                  url: resumeUrl,
                  uploadedAt: new Date(),
              });
          }
          await existingCandidate.save();
      }

      const appliedJob = await AppliedJobs.create({
          _candidate: existingCandidate._id,
          _job: jobId,
          _company: vacancy._company || undefined,
          college: collegeId,
          project: namedRefs.projectId || existingCandidate.project || undefined,
          department: namedRefs.departmentId || existingCandidate.department || undefined,
          remark: remark || '',
          source: source || 'Digital Lead',
          resume: isActualMediaFile(resumeUrl) ? resumeUrl : '',
          leadStatus: statusId?._id || null,
          leadSubstatus: subStatusId?._id || null,
          leadOwner: jobOwner.hrId || undefined,
          assignedTo: jobOwner.hrId || undefined,
          logs: [{
              action: 'Lead created',
              remarks: 'Imported from digital job apply',
              timestamp: new Date(),
          }],
      });

      const createdApply = await AppliedJobs.findById(appliedJob._id)
          .populate({
              path: '_candidate',
              select: 'name mobile email sex dob source maritalStatus remark college project department personalInfo.currentAddress.city personalInfo.totalExperience qualifications hiringStatus appliedJobs',
              populate: [
                  { path: 'college', select: 'name' },
                  { path: 'project', select: 'name' },
                  { path: 'department', select: 'name' },
              ],
          })
          .populate('_job', 'title')
          .populate('_company', 'name');

      console.log("[DigitalHRLead] AppliedJobs created →", {
          appliedJobId: appliedJob._id.toString(),
          mobile,
          jobId: jobId.toString(),
          jobTitle: vacancy.title,
          projectId: namedRefs.projectId,
          departmentId: namedRefs.departmentId,
      });

      return res.status(201).json({
          status: true,
          msg: "Candidate saved and job applied successfully",
          data: {
              appliedJobId: appliedJob._id,
              candidateId: existingCandidate._id,
              jobId,
              appliedJob: createdApply,
          }
      });
  } catch (err) {
      console.error("[DigitalHRLead] Error:", err);


      return res.status(500).json({
          status: false,
          msg: err.message || "Failed to add HR lead"
      });
  }
});
router.get('/leads/:id', isCollege, async (req, res) => {
  try {
    const loaded = await loadAppliedLead(req.params.id, req.user?.college?._id);
    if (!loaded) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    return res.json({ success: true, data: loaded.lead });
  } catch (error) {
    console.error('[HR leads] get error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch HR lead' });
  }
});

router.patch('/leads/:id', isCollege, async (req, res) => {
  try {
    const loaded = await loadAppliedLead(req.params.id, req.user?.college?._id);
    if (!loaded) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const apply = await AppliedJobs.findById(loaded.apply._id);
    if (!apply) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    if (!apply.followups) apply.followups = [];
    if (!apply.logs) apply.logs = [];
    const candidate = await CandidateProfile.findById(loaded.candidate._id);
    const logActions = [];

    if (typeof req.body.leadStatus !== 'undefined') {
      const statusId = toObjectId(req.body.leadStatus);
      if (!statusId) {
        return res.status(400).json({ success: false, message: 'Please select a valid status' });
      }

      const status = await StatusHr.findOne({ _id: statusId, isDeleted: { $ne: true } });
      if (!status) {
        return res.status(404).json({ success: false, message: 'Selected status no longer exists' });
      }

      let substatus = null;
      const substatusId = toObjectId(req.body.leadSubstatus);
      if (substatusId) {
        substatus = (status.substatuses || []).find((item) => String(item._id) === substatusId) || null;
        if (!substatus) {
          return res.status(400).json({ success: false, message: 'Selected sub-status does not belong to this status' });
        }
      } else if ((status.substatuses || []).length) {
        return res.status(400).json({ success: false, message: 'Please select a sub-status' });
      }

      if (substatus?.hasRemarks && !String(req.body.remark || '').trim()) {
        return res.status(400).json({ success: false, message: 'Remarks are mandatory for this sub-status' });
      }

      if (substatus?.hasFollowup) {
        const nextFollowup = req.body.followupDate ? new Date(req.body.followupDate) : null;
        if (!nextFollowup || Number.isNaN(nextFollowup.getTime())) {
          return res.status(400).json({ success: false, message: 'Followup date and time are mandatory for this sub-status' });
        }

        const followupType = req.body.followupType === 'Visit' ? 'Visit' : 'Call';
        closeOpenHrFollowups(apply, followupType);
        apply.followups.push({
          type: followupType,
          followupDate: nextFollowup,
          remarks: String(req.body.remark || '').trim(),
          status: 'planned',
          createdBy: req.user?._id,
        });
        logActions.push(`${followupType} followup scheduled`);
      }

      apply.leadStatus = statusId;
      apply.leadSubstatus = substatus?._id || null;
      logActions.push(`Status changed to ${status.title}${substatus?.title ? ` / ${substatus.title}` : ''}`);
    }

    if (typeof req.body.remark === 'string') {
      apply.remark = req.body.remark.trim();
      logActions.push('Remark updated');
    }

    if (candidate && typeof req.body.qualification === 'string') {
      if (!(candidate.qualifications || []).length) candidate.qualifications = [{ specialization: req.body.qualification.trim() }];
      else candidate.qualifications[0].specialization = req.body.qualification.trim();
      logActions.push('Qualification updated');
    }

    if (candidate && typeof req.body.dateOfBirth !== 'undefined') {
      const nextDob = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
      candidate.dob = nextDob && !Number.isNaN(nextDob.getTime()) ? nextDob : null;
      logActions.push('Date of birth updated');
    }

    if (typeof req.body.leadOwner !== 'undefined' || typeof req.body.assignedTo !== 'undefined') {
      apply.leadOwner = toObjectId(req.body.leadOwner ?? req.body.assignedTo);
      apply.assignedTo = apply.leadOwner;
      logActions.push('Lead owner updated');
    }

    if (typeof req.body.leadCoOwner !== 'undefined') {
      apply.leadCoOwner = toObjectId(req.body.leadCoOwner);
      logActions.push('Lead co-owner updated');
    }

    logActions.forEach((action) => {
      apply.logs.push({
        user: req.user?._id,
        action,
        remarks: req.body.remark || '',
        timestamp: new Date(),
      });
    });

    await apply.save();
    if (candidate) await candidate.save();
    const next = await loadAppliedLead(req.params.id, req.user?.college?._id);
    return res.json({
      success: true,
      message: logActions.length ? 'Lead updated' : 'No changes',
      data: next?.lead,
    });
  } catch (error) {
    console.error('[HR leads] update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update HR lead' });
  }
});

router.post('/leads/:id/followup', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const type = req.body.type === 'Visit' ? 'Visit' : 'Call';
    const followupDate = req.body.followupDate ? new Date(req.body.followupDate) : null;
    const remarks = String(req.body.remarks || '').trim();

    if (!followupDate || Number.isNaN(followupDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Please select a valid followup date and time' });
    }
    if (!remarks) {
      return res.status(400).json({ success: false, message: 'Remarks are mandatory for followup' });
    }

    const loaded = await loadAppliedLead(id, req.user?.college?._id);
    if (!loaded) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const apply = await AppliedJobs.findById(id);
    if (!apply.followups) apply.followups = [];
    if (!apply.logs) apply.logs = [];
    closeOpenHrFollowups(apply, type);

    apply.followups.push({
      type,
      followupDate,
      remarks,
      status: 'planned',
      createdBy: req.user?._id,
    });
    apply.logs.push({
      user: req.user?._id,
      action: `${type} followup scheduled`,
      remarks,
      timestamp: new Date(),
    });
    await apply.save();

    const updated = await loadAppliedLead(id, req.user?.college?._id);

    return res.json({
      success: true,
      message: `${type} followup set successfully`,
      data: updated?.lead,
    });
  } catch (error) {
    console.error('[HR leads] followup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to set followup' });
  }
});

router.post('/leads/:id/followup/:followupId/complete', isCollege, async (req, res) => {
  try {
    const { id, followupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(followupId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const loaded = await loadAppliedLead(id, req.user?.college?._id);
    if (!loaded) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const apply = await AppliedJobs.findById(id);
    if (!apply.followups) apply.followups = [];
    if (!apply.logs) apply.logs = [];
    const item = apply.followups.id
      ? apply.followups.id(followupId)
      : (apply.followups || []).find((row) => String(row._id) === String(followupId));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Followup not found' });
    }
    if (item.status === 'done') {
      return res.status(400).json({ success: false, message: 'Followup is already complete' });
    }

    item.status = 'done';
    item.completedAt = new Date();
    apply.logs.push({
      user: req.user?._id,
      action: `${item.type || 'Call'} followup marked complete`,
      remarks: item.remarks || '',
      timestamp: new Date(),
    });
    await apply.save();

    return res.json({
      success: true,
      message: 'Follow-up marked complete successfully',
      data: serializeHrFollowupRow(loaded.lead, item),
    });
  } catch (error) {
    console.error('[HR followups] complete error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark followup complete' });
  }
});

router.post('/leads/:id/documents', isCollege, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead id' });
    }

    const key = String(req.body.key || req.body.documentKey || '').trim();
    const docType = HR_DOCUMENT_TYPES.find((item) => item.key === key);
    if (!docType) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    const file = req.files?.file || req.files?.document || req.files?.resume;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please choose a file to upload' });
    }

    const loaded = await loadAppliedLead(id, req.user?.college?._id);
    if (!loaded) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const uploadedKey = await uploadSinglefile(file);
    const fileUrl = resolvePublicUrl(uploadedKey) || uploadedKey;
    const nextDoc = {
      key: docType.key,
      name: docType.name,
      fileUrl,
      uploadedAt: new Date(),
    };

    const apply = await AppliedJobs.findById(id);
    if (!apply.documents) apply.documents = [];
    if (!apply.logs) apply.logs = [];
    const docs = Array.isArray(apply.documents) ? apply.documents.map((item) => item.toObject?.() || item) : [];
    const existingIndex = docs.findIndex((item) => item.key === docType.key);
    if (existingIndex >= 0) docs[existingIndex] = { ...docs[existingIndex], ...nextDoc };
    else docs.push(nextDoc);
    apply.documents = docs;
    if (docType.key === 'resume') apply.resume = fileUrl;
    apply.logs.push({
      user: req.user?._id,
      action: `${docType.name} uploaded`,
      remarks: '',
      timestamp: new Date(),
    });
    await apply.save();

    const updated = await loadAppliedLead(id, req.user?.college?._id);

    return res.json({
      success: true,
      message: `${docType.name} uploaded`,
      data: updated?.lead,
    });
  } catch (error) {
    console.error('[HR leads] document upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});

module.exports = router;
