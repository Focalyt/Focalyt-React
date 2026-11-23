const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {
  User,
  College,
  CandidateProfile,
  AppliedCourses,
  AppliedJobs,
  Courses,
  UploadCandidates,
  Club,
  ClubMember,
  ClubPosition,
  ClubPositionRequest,
  ClubActivity,
  ClubSuggestion,
  ClubPost,
  ClubAnnouncement,
  ClubChatMessage,
  ClubBudget,
  ClubResult,
  ClubCertificate,
  ClubRedemption,
  ClubWorkflow,
  ClubNotification,
  ClubStudentState,
  ClubCampusSetting,
  ClubStaffAssignment,
  ClubGoodie,
  ClubFaq,
  ClubBadge,
  ClubNotificationTemplate,
  ClubAchievementCard,
  Center,
  Project,
  Vertical,
} = require('../../models');
const { emitClubChat, emitClubMembership } = require('../../../helpers/clubSocket');
const { renderCertificatePdf, resolveCertificateTemplateId } = require('../../../helpers/clubCertificatePdf');
const { certificateSerial } = require('../../../helpers/clubCertificateTemplates');
const objectStorage = require('../../../helpers/objectStorage');
const { mobileLookupValues } = require('../../../helpers/b2cDuplicate');
const {
  CLUB_ASSIGNABLE_KEYS,
  cmsRoleFromFlags,
  mergeClubPermissions,
} = require('../../../helpers/clubAssignablePermissions');
const { isAllowedClubMediaUrl } = require('../../../helpers/clubSocketAuth');

const router = express.Router();
const clubAdminRouter = express.Router();
const companyClubStaffRouter = express.Router();

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();
const APPROVED_MEMBER_STATUSES = ['joined', 'approved'];
const isApprovedMemberStatus = (status) => APPROVED_MEMBER_STATUSES.includes(status);

function normalizeClubEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeClubMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : '';
}

function memberIdentityKey(member, user) {
  const mobile = normalizeClubMobile(member?.studentMobile || user?.mobile);
  const email = normalizeClubEmail(member?.studentEmail || user?.email);
  if (mobile) return `m:${mobile}`;
  if (email) return `e:${email}`;
  if (member?.studentUserId) return `u:${member.studentUserId}`;
  return member?._id ? `id:${member._id}` : '';
}

function dedupeByIdentity(rows, getKey) {
  const best = new Map();
  const rank = { blocked: 5, approved: 4, joined: 4, pending: 3, rejected: 1 };
  (rows || []).forEach((row) => {
    const key = getKey(row);
    if (!key) return;
    const prev = best.get(key);
    if (!prev || (rank[row.status] || 0) >= (rank[prev.status] || 0)) {
      best.set(key, row);
    }
  });
  return [...best.values()];
}

async function studentRosterFilter(user) {
  const emailN = normalizeClubEmail(user?.email);
  const mobileN = normalizeClubMobile(user?.mobile);
  const mobileValues = mobileN ? mobileLookupValues(mobileN) : [];
  const twinOr = [];
  if (emailN) twinOr.push({ email: emailN });
  if (mobileValues.length) {
    twinOr.push({ mobile: { $in: mobileValues } }, { whatsapp: { $in: mobileValues } });
  }
  let twinIds = user?._id ? [String(user._id)] : [];
  if (twinOr.length) {
    const twins = await User.find({ role: 3, isDeleted: { $ne: true }, $or: twinOr }).select('_id').lean();
    twins.forEach((row) => twinIds.push(String(row._id)));
  }
  twinIds = [...new Set(twinIds)].filter(isValidObjectId);
  const memberOr = [];
  if (twinIds.length) memberOr.push({ studentUserId: { $in: twinIds } });
  if (emailN) memberOr.push({ studentEmail: emailN });
  if (mobileN) memberOr.push({ studentMobile: mobileN });
  if (!memberOr.length) return { studentUserId: user?._id || null };
  return { $or: memberOr };
}

async function findClubMemberByIdentity(clubId, { userId, email, mobile }) {
  const emailN = normalizeClubEmail(email);
  const mobileN = normalizeClubMobile(mobile);
  const mobileValues = mobileN ? mobileLookupValues(mobileN) : [];
  const twinOr = [];
  if (emailN) twinOr.push({ email: emailN });
  if (mobileValues.length) {
    twinOr.push({ mobile: { $in: mobileValues } }, { whatsapp: { $in: mobileValues } });
  }

  let twinIds = [];
  if (userId && isValidObjectId(userId)) twinIds.push(String(userId));
  if (twinOr.length) {
    const twins = await User.find({ role: 3, isDeleted: { $ne: true }, $or: twinOr }).select('_id').lean();
    twins.forEach((user) => twinIds.push(String(user._id)));
  }
  twinIds = [...new Set(twinIds)];

  const memberOr = [];
  if (twinIds.length) memberOr.push({ studentUserId: { $in: twinIds } });
  if (emailN) memberOr.push({ studentEmail: emailN });
  if (mobileN) memberOr.push({ studentMobile: mobileN });
  if (!memberOr.length) return null;
  return ClubMember.findOne({ clubId, $or: memberOr }).sort({ updatedAt: -1 });
}

async function dedupeClubMembers(members) {
  const userIds = [...new Set((members || []).map((m) => m.studentUserId).filter(Boolean).map((id) => String(id)))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select('_id email mobile').lean()
    : [];
  const userById = new Map(users.map((user) => [String(user._id), user]));
  return dedupeByIdentity(members, (member) => {
    const identity = memberIdentityKey(member, userById.get(String(member.studentUserId)));
    return identity ? `${String(member.clubId)}|${identity}` : '';
  }).map((member) => {
    const user = userById.get(String(member.studentUserId));
    return {
      ...member,
      studentEmail: member.studentEmail || user?.email || '',
      studentMobile: member.studentMobile || normalizeClubMobile(user?.mobile),
    };
  });
}

const isValidObjectId = (val) =>
  Boolean(val && mongoose.Types.ObjectId.isValid(String(val)) && /^[a-fA-F0-9]{24}$/.test(String(val)));

const COLLEGE_SELECT = '_id name type place address collegeRepresentatives status description';
const STAFF_CMS_ROLES = ['club_admin', 'institute', 'senior_sales_engineer', 'sales_engineer'];

function permissionTypeOf(user) {
  const perms = user?.permissions;
  if (!perms) return '';
  const plain = typeof perms.toObject === 'function' ? perms.toObject() : perms;
  return String(plain.permission_type || '').trim();
}

function isMainInstituteAdminUser(user) {
  const roleNum = Number(user?.role);
  if (roleNum === 0) return true;
  if (roleNum !== 2) return false;
  return permissionTypeOf(user).toLowerCase() === 'admin';
}

function loadAllClubCampuses() {
  return College.find({
    isDeleted: { $ne: true },
    name: { $exists: true, $nin: [null, ''] },
  })
    .select(COLLEGE_SELECT)
    .sort({ name: 1 })
    .limit(500)
    .lean();
}
const ALL_CMS_ROLES = [...STAFF_CMS_ROLES, 'student'];

const CMS_PERMISSIONS = {
  'analytics.view': STAFF_CMS_ROLES,
  'clubs.view': ALL_CMS_ROLES,
  'clubs.create': ['club_admin', 'senior_sales_engineer'],
  'clubs.edit': ['club_admin', 'senior_sales_engineer'],
  'clubs.request': ['sales_engineer', 'institute'],
  'clubs.recommend': ['senior_sales_engineer', 'institute'],
  'members.view': STAFF_CMS_ROLES,
  'members.add': STAFF_CMS_ROLES,
  'members.request': ['student'],
  'members.approve': STAFF_CMS_ROLES,
  'members.reject': STAFF_CMS_ROLES,
  'members.block': STAFF_CMS_ROLES,
  'positions.view': ALL_CMS_ROLES,
  'positions.create': ['club_admin'],
  'positions.assign': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'positions.recommend': ['institute'],
  'positions.manageFeature': ['club_admin'],
  'positions.request': ['student'],
  'activities.view': ALL_CMS_ROLES,
  'activities.create': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'activities.edit': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'activities.request': ['institute', 'student'],
  'activities.recommend': ['club_admin', 'sales_engineer'],
  'activities.schedule': ['club_admin', 'senior_sales_engineer'],
  'activities.approveSchedule': ['club_admin', 'senior_sales_engineer'],
  'activities.register': ['club_admin', 'senior_sales_engineer', 'student'],
  'registrations.view': STAFF_CMS_ROLES,
  'registrations.approve': ['club_admin', 'senior_sales_engineer'],
  'budgets.view': ALL_CMS_ROLES,
  'budgets.create': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'budgets.request': ['institute', 'student'],
  'budgets.recommend': ['institute'],
  'budgets.approve': ['club_admin', 'senior_sales_engineer'],
  'results.view': ALL_CMS_ROLES,
  'results.declare': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'certificates.view': ALL_CMS_ROLES,
  'certificates.generate': ['club_admin', 'senior_sales_engineer'],
  'certificates.download': ALL_CMS_ROLES,
  'achievements.share': ALL_CMS_ROLES,
  'rewards.view': ALL_CMS_ROLES,
  'rewards.manage': ['club_admin'],
  'rewards.redeem': ['student', 'institute'],
  'rewards.process': ['club_admin', 'senior_sales_engineer'],
  'posts.view': ALL_CMS_ROLES,
  'posts.create': STAFF_CMS_ROLES,
  'posts.moderate': STAFF_CMS_ROLES,
  'posts.interact': ALL_CMS_ROLES,
  'announcements.view': ALL_CMS_ROLES,
  'announcements.create': STAFF_CMS_ROLES,
  'announcements.request': ['student'],
  'notifications.view': ['club_admin', 'senior_sales_engineer'],
  'notifications.configure': ['club_admin'],
  'notifications.send': ['senior_sales_engineer'],
  'profile.view': ALL_CMS_ROLES,
  'profile.edit': ALL_CMS_ROLES,
  'chat.use': ALL_CMS_ROLES,
  'faq.view': ALL_CMS_ROLES,
  'faq.manage': ['club_admin'],
  'settings.manage': ['club_admin'],
  'staff.assign': ['club_admin'],
};

function canCms(req, permissionKey) {
  const access = req.clubAccess || {};
  const overlay = access.permissions;
  if (overlay) {
    if (Object.prototype.hasOwnProperty.call(overlay, permissionKey)) {
      return Boolean(overlay[permissionKey]);
    }
    if (CLUB_ASSIGNABLE_KEYS.includes(permissionKey)) {
      return false;
    }
  }
  const allowed = CMS_PERMISSIONS[permissionKey];
  if (!allowed) return false;
  return allowed.includes(access.cmsRole);
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!canCms(req, permissionKey)) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    return next();
  };
}

function requireStaff(req, res, next) {
  if (!STAFF_CMS_ROLES.includes(req.clubAccess?.cmsRole)) {
    return res.status(403).json({ status: false, message: 'Staff access required.' });
  }
  return next();
}

function actorSnapshot(req) {
  return {
    userId: req.user?._id,
    name: req.user?.name || 'User',
    role: req.clubAccess?.cmsRole || '',
    at: nowIso(),
  };
}

async function isClubCaptain(userId, clubId) {
  if (!userId || !clubId) return false;
  const assigned = await ClubPositionRequest.find({
    clubId,
    studentUserId: userId,
    status: 'assigned',
  })
    .select('positionId')
    .lean();
  if (!assigned.length) return false;
  const positionIds = assigned.map((row) => row.positionId).filter(Boolean);
  if (!positionIds.length) return false;
  const captain = await ClubPosition.findOne({
    _id: { $in: positionIds },
    isDeleted: { $ne: true },
    title: { $regex: /captain/i },
  })
    .select('_id')
    .lean();
  return Boolean(captain);
}

async function isStudentClubMember(req, clubId) {
  if (req.clubAccess?.cmsRole !== 'student' || !isValidObjectId(clubId)) return false;
  const member = await findClubMemberByIdentity(clubId, {
    userId: req.user._id,
    email: req.user.email,
    mobile: req.user.mobile,
  });
  return Boolean(member && isApprovedMemberStatus(member.status));
}

/**
 * Students: campus bubble + act only inside approved clubs.
 * Browse campus events is fine; registering requires approved membership of that club.
 */
async function denyActivityRegistrationAccess(req, res, activity) {
  if (!activity) {
    res.status(404).json({ status: false, message: 'Activity not found' });
    return true;
  }
  const isStudent = req.clubAccess?.cmsRole === 'student';
  if (isStudent) {
    let collegeId = activity.collegeId;
    if (!collegeId && activity.clubId && isValidObjectId(activity.clubId)) {
      const club = await Club.findById(activity.clubId).select('collegeId').lean();
      collegeId = club?.collegeId;
    }
    if (!collegeId || !campusAllowed(req, collegeId)) {
      res.status(403).json({
        status: false,
        message: 'This activity is not on your campus.',
      });
      return true;
    }
    if (!isValidObjectId(activity.clubId)) {
      res.status(403).json({
        status: false,
        message: 'Join a campus club and get approved before registering for events.',
      });
      return true;
    }
    if (!(await isStudentClubMember(req, activity.clubId))) {
      res.status(403).json({
        status: false,
        message: 'Join this club and get approved before registering for its activities.',
      });
      return true;
    }
    return false;
  }
  return denyCampus(req, res, activity.collegeId);
}

function isPublishedSchedule(activity) {
  return !activity?.scheduleStatus || activity.scheduleStatus === 'scheduled';
}

function campusAllowed(req, collegeId) {
  if (!collegeId) return false;
  return (req.clubAccess?.campuses || []).some((c) => String(c._id) === String(collegeId));
}

function denyCampus(req, res, collegeId) {
  if (!collegeId) {
    res.status(403).json({ status: false, message: 'This campus is not assigned to you.' });
    return true;
  }
  if (campusAllowed(req, collegeId)) return false;
  res.status(403).json({ status: false, message: 'This campus is not assigned to you.' });
  return true;
}

function clubAdminIdList(club) {
  const ids = [];
  const push = (value) => {
    const id = value?._id || value;
    if (isValidObjectId(id)) ids.push(String(id));
  };
  push(club?.createdByUserId);
  (club?.adminUserIds || []).forEach(push);
  return [...new Set(ids)];
}

function withClubAdmins(ownerId, existingIds = []) {
  // Must return ObjectIds — assigning string[] to DocumentArray throws:
  // Parameter "obj" to Document() must be an object, got "<id>" (type string)
  const seen = new Set();
  const ids = [];
  const push = (value) => {
    const raw = value?._id || value;
    if (!isValidObjectId(raw)) return;
    const key = String(raw);
    if (seen.has(key)) return;
    seen.add(key);
    ids.push(new mongoose.Types.ObjectId(key));
  };
  push(ownerId);
  (existingIds || []).forEach(push);
  return ids;
}

function isClubOwnerOrCoordinator(user, club) {
  const uid = String(user?._id || '');
  if (!uid || !club) return false;
  if (clubAdminIdList(club).includes(uid)) return true;
  if (String(club.coordinatorId || '') === uid) return true;
  return false;
}

function clubStaffIdList(club) {
  const ids = [];
  const push = (value) => {
    const id = value?._id || value;
    if (isValidObjectId(id)) ids.push(String(id));
  };
  (club?.staffUserIds || []).forEach(push);
  if (String(club?.coordinatorId || '').trim() && isValidObjectId(club.coordinatorId)) {
    push(club.coordinatorId);
  }
  return [...new Set(ids)];
}

function withClubStaffIds(userIds = [], existingIds = []) {
  const seen = new Set();
  const ids = [];
  const push = (value) => {
    const raw = value?._id || value;
    if (!isValidObjectId(raw)) return;
    const key = String(raw);
    if (seen.has(key)) return;
    seen.add(key);
    ids.push(new mongoose.Types.ObjectId(key));
  };
  (existingIds || []).forEach(push);
  (userIds || []).forEach(push);
  return ids;
}

function isFieldStaffCmsRole(role) {
  return role === 'senior_sales_engineer' || role === 'sales_engineer';
}

/** SSE/SE: linked via staffUserIds or coordinatorId only. */
function isClubLinkedFieldStaff(user, club) {
  const uid = String(user?._id || '');
  if (!uid || !club) return false;
  return clubStaffIdList(club).includes(uid);
}

/** Club Admin: own/coordinate only. SSE/SE: assigned clubs only. Institute Admin: campus-wide. */
function canManageClubMembership(req, club) {
  if (!club) return false;
  if (!campusAllowed(req, club.collegeId)) return false;
  if (isMainInstituteAdminUser(req.user)) return true;
  const role = req.clubAccess?.cmsRole;
  if (role === 'institute') return true;
  if (isFieldStaffCmsRole(role)) {
    return isClubLinkedFieldStaff(req.user, club);
  }
  if (role === 'club_admin') {
    // Legacy clubs with no owner yet stay manageable by campus Club Admins.
    if (!club.createdByUserId && !String(club.coordinatorId || '').trim()) return true;
    return isClubOwnerOrCoordinator(req.user, club);
  }
  return false;
}

function denyClubMembershipManage(req, res, club) {
  if (canManageClubMembership(req, club)) return false;
  res.status(403).json({
    status: false,
    message:
      'You can only manage members for clubs you are assigned to. Institute Admin can manage any club on the campus.',
  });
  return true;
}

function denyClubStaffManage(req, res, club) {
  if (!club) {
    res.status(404).json({ status: false, message: 'Club not found' });
    return true;
  }
  if (isMainInstituteAdminUser(req.user) || req.clubAccess?.cmsRole === 'institute') return false;
  const role = req.clubAccess?.cmsRole;
  if (role === 'club_admin') {
    if (
      !isClubOwnerOrCoordinator(req.user, club) &&
      (club.createdByUserId || String(club.coordinatorId || '').trim())
    ) {
      res.status(403).json({
        status: false,
        message: 'You can only edit clubs you own or coordinate.',
      });
      return true;
    }
    return false;
  }
  if (isFieldStaffCmsRole(role)) {
    if (!isClubLinkedFieldStaff(req.user, club)) {
      res.status(403).json({
        status: false,
        message: 'You can only manage clubs you are assigned to.',
      });
      return true;
    }
    return false;
  }
  return false;
}

const CLUB_MANAGE_SELECT =
  'collegeId createdByUserId coordinatorId adminUserIds staffUserIds isDeleted';

/** Club Admin / SSE / SE must operate on assigned clubs; Main Institute Admin is campus-wide. */
function needsAssignedClubScope(req) {
  if (isMainInstituteAdminUser(req.user)) return false;
  const role = req.clubAccess?.cmsRole;
  return role === 'club_admin' || isFieldStaffCmsRole(role);
}

async function findClubLeanForManage(clubId) {
  if (!isValidObjectId(clubId)) return null;
  const club = await Club.findById(clubId).select(CLUB_MANAGE_SELECT).lean();
  if (!club || club.isDeleted) return null;
  return club;
}

/**
 * Campus + assigned-club gate for staff ops.
 * @returns {Promise<boolean>} true if response already sent
 */
async function denyStaffClubOpsByClubId(req, res, clubId, { required = false } = {}) {
  if (!isValidObjectId(clubId)) {
    if (required || needsAssignedClubScope(req)) {
      res.status(400).json({ status: false, message: 'Select a club you are assigned to.' });
      return true;
    }
    return false;
  }
  const club = await findClubLeanForManage(clubId);
  if (!club) {
    res.status(404).json({ status: false, message: 'Club not found' });
    return true;
  }
  if (denyCampus(req, res, club.collegeId)) return true;
  if (denyClubStaffManage(req, res, club)) return true;
  return false;
}

function isSseOrSeCapableUser(user) {
  if (!user || user.isDeleted || user.status === false) return false;
  if (Number(user.role) !== 2 && Number(user.role) !== 5) return false;
  const custom = user?.permissions?.custom_permissions || {};
  return Boolean(custom.can_be_club_sse || custom.can_be_club_se);
}

/** Main Institute Admin or SSE may assign/reassign club owner. Club Admin cannot. */
function canAssignClubOwner(req) {
  if (isMainInstituteAdminUser(req.user)) return true;
  return req.clubAccess?.cmsRole === 'senior_sales_engineer';
}

/** Dedicated Club Admin only — Main Institute Admin is NOT a Club Admin owner. */
function isClubAdminCapableUser(user) {
  if (!user || user.isDeleted || user.status === false) return false;
  if (Number(user.role) !== 2 && Number(user.role) !== 5) return false;
  const custom = user?.permissions?.custom_permissions || {};
  return Boolean(custom.can_be_club_admin);
}

async function userOnCampus(userId, collegeId) {
  if (!isValidObjectId(userId) || !isValidObjectId(collegeId)) return false;
  // College._concernPerson is [{ _id, defaultAdmin }] — never query `{ _concernPerson: userId }`
  // (Mongoose tries to cast the string into an EmbeddedDocument and throws ObjectParameterError).
  const college = await College.findOne({
    _id: collegeId,
    isDeleted: { $ne: true },
    _concernPerson: { $elemMatch: { _id: userId } },
  })
    .select('_id')
    .lean();
  return Boolean(college);
}

async function resolveClubOwnerUserId(req, collegeId, requestedOwnerId) {
  // Club Admin creating a club: owner is always themselves.
  if (!canAssignClubOwner(req)) {
    if (!isClubAdminCapableUser(req.user)) {
      return { error: 'Only a Club Admin can own a club. Ask Institute Admin to assign a Club Admin.' };
    }
    return { ownerId: req.user._id };
  }

  // Institute Admin / SSE: must pick a dedicated Club Admin — not themselves.
  if (!isValidObjectId(requestedOwnerId)) {
    return {
      error: 'Select a Club Admin as owner. Institute Admin cannot be the club owner.',
    };
  }
  if (String(requestedOwnerId) === String(req.user._id) && isMainInstituteAdminUser(req.user)) {
    return {
      error: 'Institute Admin cannot be Club Admin/owner. Assign a user with Club Admin role.',
    };
  }

  const owner = await User.findById(requestedOwnerId)
    .select('_id name role permissions status isDeleted')
    .lean();
  if (!isClubAdminCapableUser(owner)) {
    return {
      error: 'Owner must be a Club Admin on this campus (Institute Admin / SSE are not Club Admins).',
    };
  }
  const onCampus = await userOnCampus(owner._id, collegeId);
  if (!onCampus) {
    return { error: 'Selected Club Admin is not assigned to this campus.' };
  }
  return { ownerId: owner._id };
}

async function canAccessClubPost(req, post) {
  if (!post) return false;
  if (req.clubAccess?.cmsRole === 'student') {
    if (String(post.authorUserId) === String(req.user?._id)) return true;
    return isStudentClubMember(req, post.clubId);
  }
  if (!campusAllowed(req, post.collegeId)) return false;
  if (!needsAssignedClubScope(req)) return true;
  if (!isValidObjectId(post.clubId)) return !isFieldStaffCmsRole(req.clubAccess?.cmsRole);
  const club = await findClubLeanForManage(post.clubId);
  if (!club) return false;
  if (isFieldStaffCmsRole(req.clubAccess?.cmsRole)) return isClubLinkedFieldStaff(req.user, club);
  if (req.clubAccess?.cmsRole === 'club_admin') {
    if (!club.createdByUserId && !String(club.coordinatorId || '').trim()) return true;
    return isClubOwnerOrCoordinator(req.user, club);
  }
  return true;
}

function rejectBadMediaUrl(res, mediaUrl) {
  if (!isAllowedClubMediaUrl(mediaUrl)) {
    res.status(400).json({
      status: false,
      message: 'Media URL is not allowed. Upload via the app or use an approved storage link.',
    });
    return true;
  }
  return false;
}

function accessIdList(values) {
  return (values || []).map((id) => String(id)).filter((id) => isValidObjectId(id));
}

function placementAccessScope(req) {
  const role = req.clubAccess?.cmsRole;
  const restrict = role === 'senior_sales_engineer' || role === 'sales_engineer';
  if (!restrict) return { verticalIds: null, projectIds: null };
  const verticalIds = accessIdList(req.user?.verticals_access);
  const projectIds = accessIdList(req.user?.b2c_projects_access);
  return {
    verticalIds: verticalIds.length ? verticalIds : null,
    projectIds: projectIds.length ? projectIds : null,
  };
}

function placementCollegeIds(req) {
  return (req.clubAccess?.campuses || []).map((campus) => String(campus._id)).filter(Boolean);
}

async function resolveClubPlacement(req, body = {}) {
  if (!isValidObjectId(body.centerId)) {
    return { error: 'Select a centre.' };
  }
  const center = await Center.findById(body.centerId).lean();
  if (!center || center.status === false) {
    return { error: 'Centre not found or inactive.' };
  }
  const collegeId = center.college ? String(center.college) : '';
  if (!collegeId || !campusAllowed(req, collegeId)) {
    return { error: 'This centre is not in your assigned campus.' };
  }

  let projectId = isValidObjectId(body.projectId) ? String(body.projectId) : '';
  const centerProjectIds = (center.projects || []).map((id) => String(id));
  if (projectId && !centerProjectIds.includes(projectId)) {
    return { error: 'This centre does not belong to the selected project.' };
  }
  if (!projectId) projectId = centerProjectIds[0] || '';
  if (!projectId) {
    return { error: 'Select a project.' };
  }

  const project = await Project.findById(projectId).select('vertical college status').lean();
  if (!project) return { error: 'Project not found.' };
  if (project.college && String(project.college) !== collegeId) {
    return { error: 'This project does not belong to the selected campus.' };
  }

  let verticalId = isValidObjectId(body.verticalId || body.departmentId)
    ? String(body.verticalId || body.departmentId)
    : '';
  if (verticalId && project.vertical && String(project.vertical) !== verticalId) {
    return { error: 'This project does not belong to the selected department.' };
  }
  if (!verticalId && project.vertical) verticalId = String(project.vertical);

  const scope = placementAccessScope(req);
  if (scope.verticalIds && verticalId && !scope.verticalIds.includes(String(verticalId))) {
    return { error: 'You do not have access to this department.' };
  }
  if (scope.projectIds && projectId && !scope.projectIds.includes(String(projectId))) {
    return { error: 'You do not have access to this project.' };
  }

  return { collegeId, centerId: String(center._id), projectId, verticalId: verticalId || null };
}

function dedupeById(rows) {
  const seen = new Set();
  return (rows || []).filter((row) => {
    const id = String(row?._id || '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function dedupeBadges(rows, collapseByCode) {
  const unique = dedupeById(rows);
  if (!collapseByCode) return unique;
  const seen = new Set();
  return unique.filter((row) => {
    const code = String(row.code || row._id || '').toLowerCase();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

function attachCampusNames(rows, campusList) {
  const names = new Map((campusList || []).map((campus) => [String(campus._id), campus.name || '']));
  return (rows || []).map((row) => ({
    ...row,
    collegeName: names.get(String(row.collegeId)) || row.collegeName || '',
  }));
}

function assignedCampusFilter(req) {
  const ids = (req.clubAccess?.campuses || [])
    .map((campus) => campus?._id)
    .filter((id) => isValidObjectId(id));
  if (!ids.length) return { collegeId: null };
  return { collegeId: { $in: ids } };
}

function loginCollegeIdOf(user, queryCollegeId) {
  if (isValidObjectId(queryCollegeId)) return String(queryCollegeId);
  if (isValidObjectId(user?.collegeId)) return String(user.collegeId);
  if (isValidObjectId(user?._college)) return String(user._college);
  if (isValidObjectId(user?.college?._id)) return String(user.college._id);
  return null;
}

function scopeToLoginCampus(campuses, loginCollegeId) {
  if (!loginCollegeId || !Array.isArray(campuses) || !campuses.length) return campuses || [];
  const scoped = campuses.filter((campus) => String(campus._id) === String(loginCollegeId));
  return scoped.length ? scoped : campuses;
}

async function resolveStudentCollegeId(req, fallbackCollegeId) {
  if (isValidObjectId(fallbackCollegeId) && campusAllowed(req, fallbackCollegeId)) {
    return String(fallbackCollegeId);
  }
  if (isValidObjectId(req.clubAccess?.activeCampusId)) return String(req.clubAccess.activeCampusId);
  const bodyId = req.body?.collegeId || req.body?.institutionId;
  if (isValidObjectId(bodyId) && campusAllowed(req, bodyId)) return String(bodyId);
  const first = req.clubAccess?.campuses?.[0]?._id;
  return first ? String(first) : null;
}

function identityMatchOr(user) {
  const or = [];
  if (user?._id) or.push({ _id: user._id });
  const mobiles = mobileLookupValues(user?.mobile);
  if (mobiles.length) or.push({ mobile: { $in: mobiles } });
  if (user?.email) or.push({ email: String(user.email).toLowerCase().trim() });
  return or;
}

async function findStudentColleges(user) {
  const or = identityMatchOr(user);
  const collegeIds = new Set();

  const profile = or.length
    ? await CandidateProfile.findOne({
        isDeleted: { $ne: true },
        $or: or,
      })
        .select('_id college')
        .lean()
    : null;

  if (profile?.college) collegeIds.add(String(profile.college));

  const candidateIds = [profile?._id, user?._id].filter(Boolean);
  if (candidateIds.length) {
    const [courseApps, jobApps] = await Promise.all([
      AppliedCourses.find({ _candidate: { $in: candidateIds } }).select('_course').lean(),
      AppliedJobs.find({ _candidate: { $in: candidateIds }, college: { $ne: null } }).select('college').lean(),
    ]);
    jobApps.forEach((job) => {
      if (job.college) collegeIds.add(String(job.college));
    });
    const courseIds = courseApps.map((app) => app._course).filter(Boolean);
    if (courseIds.length) {
      const courses = await Courses.find({ _id: { $in: courseIds }, college: { $ne: null } })
        .select('college')
        .lean();
      courses.forEach((course) => {
        if (course.college) collegeIds.add(String(course.college));
      });
    }
  }

  const mobiles = mobileLookupValues(user?.mobile).map((value) => String(value));
  const uploadOr = [];
  if (mobiles.length) uploadOr.push({ contactNumber: { $in: mobiles } });
  if (user?.email) uploadOr.push({ email: String(user.email).toLowerCase().trim() });
  if (uploadOr.length) {
    const uploaded = await UploadCandidates.find({ $or: uploadOr, college: { $ne: null } })
      .select('college')
      .limit(20)
      .lean();
    uploaded.forEach((row) => {
      if (row.college) collegeIds.add(String(row.college));
    });
  }

  const ids = [...collegeIds].filter(isValidObjectId);
  if (!ids.length) return [];
  return College.find({ _id: { $in: ids }, isDeleted: { $ne: true } })
    .select(COLLEGE_SELECT)
    .lean();
}

async function resolveUserCampusesAndRole(user, queryCollegeId) {
  const roleNum = Number(user.role);
  let cmsRole = 'student';
  let permissions = null;
  let campuses = [];
  const managesAllCampuses = false;
  const loginCollegeId = loginCollegeIdOf(user, queryCollegeId);

  if (roleNum === 0) {
    cmsRole = 'club_admin';
    campuses = loginCollegeId
      ? await College.find({ _id: loginCollegeId, isDeleted: { $ne: true } })
          .select(COLLEGE_SELECT)
          .lean()
      : await loadAllClubCampuses();
  } else if (roleNum === 2 || roleNum === 5) {
    const permType = user?.permissions?.permission_type;
    const customPerms = user?.permissions?.custom_permissions || {};

    if (roleNum === 5 || permType === 'Admin' || customPerms.can_be_club_admin) {
      cmsRole = 'club_admin';
    } else if (customPerms.can_be_club_sse) {
      cmsRole = 'senior_sales_engineer';
    } else if (customPerms.can_be_club_se) {
      cmsRole = 'sales_engineer';
    } else {
      cmsRole = 'institute';
    }

    const clubStaffCmsRole = cmsRoleFromFlags(customPerms);
    if (permType === 'Custom' && clubStaffCmsRole) {
      permissions = mergeClubPermissions(customPerms.club_permissions, clubStaffCmsRole);
    } else if (permType === 'Custom' && cmsRole === 'institute') {
      const memberAccess = Boolean(
        customPerms.can_manage_club_members || customPerms.can_be_club_sse || customPerms.can_be_club_se
      );
      const viewClubs = Boolean(
        customPerms.can_view_clubs ||
          customPerms.can_create_clubs ||
          customPerms.can_edit_clubs ||
          customPerms.can_be_club_sse ||
          customPerms.can_be_club_se ||
          customPerms.can_manage_club_members ||
          customPerms.can_manage_club_positions ||
          customPerms.can_manage_club_budgets ||
          customPerms.can_manage_club_activities
      );
      permissions = {
        'analytics.view': viewClubs,
        'clubs.view': viewClubs,
        'clubs.create': Boolean(customPerms.can_create_clubs || customPerms.can_be_club_sse),
        'clubs.edit': Boolean(customPerms.can_edit_clubs || customPerms.can_be_club_sse),
        'members.view': memberAccess,
        'members.add': memberAccess,
        'members.approve': memberAccess,
        'members.reject': memberAccess,
        'members.block': memberAccess,
        'positions.view': Boolean(customPerms.can_manage_club_positions || customPerms.can_be_club_sse || customPerms.can_be_club_se || viewClubs),
        'positions.create': Boolean(customPerms.can_manage_club_positions),
        'positions.assign': Boolean(
          customPerms.can_manage_club_positions || customPerms.can_be_club_sse || customPerms.can_be_club_se
        ),
        'positions.recommend': Boolean(customPerms.can_manage_club_positions || customPerms.can_be_club_sse),
        'activities.view': Boolean(customPerms.can_manage_club_activities || viewClubs),
        'activities.create': Boolean(customPerms.can_manage_club_activities),
        'activities.edit': Boolean(customPerms.can_manage_club_activities),
        'registrations.view': Boolean(customPerms.can_manage_club_activities),
        'registrations.approve': Boolean(customPerms.can_manage_club_activities),
        'budgets.view': Boolean(customPerms.can_manage_club_budgets),
        'budgets.create': Boolean(customPerms.can_manage_club_budgets),
        'budgets.request': Boolean(customPerms.can_manage_club_budgets),
        'budgets.recommend': Boolean(customPerms.can_manage_club_budgets),
        'budgets.approve': Boolean(customPerms.can_manage_club_budgets),
        'results.view': viewClubs,
        'results.declare': false,
        'certificates.view': viewClubs,
        'certificates.generate': false,
        'rewards.view': viewClubs,
        'rewards.manage': false,
        'posts.view': viewClubs,
        'announcements.view': viewClubs,
        'announcements.create': false,
        'chat.use': viewClubs,
        'faq.view': viewClubs,
        'faq.manage': false,
        'settings.manage': false,
        'staff.assign': false,
      };
    }

    const allConcernCampuses = await College.find({
      isDeleted: { $ne: true },
      _concernPerson: { $elemMatch: { _id: user._id } },
    })
      .select(COLLEGE_SELECT)
      .lean();
    // Dedicated Club Admins may manage clubs on more than one campus (Add Admin).
    // Do not collapse them to a single login campus or those clubs disappear from the dashboard.
    const isDedicatedClubAdmin =
      Boolean(customPerms.can_be_club_admin) && permType !== 'Admin' && roleNum !== 5;
    campuses = isDedicatedClubAdmin
      ? allConcernCampuses
      : scopeToLoginCampus(allConcernCampuses, loginCollegeId);
  } else if (roleNum === 1) {
    const assignments = await ClubStaffAssignment.find({ userId: user._id }).lean();
    if (assignments.length > 0) {
      const chosen =
        (queryCollegeId && assignments.find((a) => String(a.collegeId) === String(queryCollegeId))) ||
        assignments[0];
      cmsRole = chosen.staffRole === 'sse' ? 'senior_sales_engineer' : 'sales_engineer';
      permissions = chosen.permissions || null;
      const collegeIds = assignments.map((a) => a.collegeId);
      campuses = scopeToLoginCampus(
        await College.find({ _id: { $in: collegeIds }, isDeleted: { $ne: true } })
          .select(COLLEGE_SELECT)
          .lean(),
        loginCollegeId
      );
    } else {
      cmsRole = 'sales_engineer';
      campuses = [];
    }
  } else {
    cmsRole = 'student';
    campuses = await findStudentColleges(user);
  }

  const activeCampusId =
    (isValidObjectId(queryCollegeId) &&
      campuses.some((c) => String(c._id) === String(queryCollegeId)) &&
      String(queryCollegeId)) ||
    (campuses[0] ? String(campuses[0]._id) : null);

  return { cmsRole, permissions, campuses, activeCampusId, managesAllCampuses };
}

function instituteHasClubAccess(user) {
  if (Number(user?.role) !== 2) return true;
  const type = user?.permissions?.permission_type;
  const custom = user?.permissions?.custom_permissions || {};
  return (
    type === 'Admin' ||
    Boolean(custom.can_be_club_admin || custom.can_be_club_sse || custom.can_be_club_se)
  );
}

const requireClubUser = async (req, res, next) => {
  try {
    const token = req.header('x-auth') || req.session?.user?.token;
    if (!token) {
      return res.status(401).json({ status: false, message: 'Authentication token required' });
    }
    const decoded = jwt.verify(token, process.env.MIPIE_JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({ status: false, message: 'User not found' });
    }
    if (user.status === false) {
      return res.status(403).json({ status: false, message: 'This account is inactive.' });
    }
    if (!instituteHasClubAccess(user)) {
      return res.status(403).json({ status: false, message: 'Club access is not enabled for this account.' });
    }
    req.user = user;
    const queryCollegeId =
      req.query.collegeId || req.body?.collegeId || req.params?.collegeId || req.body?.institutionId;
    req.clubAccess = await resolveUserCampusesAndRole(user, queryCollegeId);
    return next();
  } catch (err) {
    return res.status(401).json({ status: false, message: 'Invalid or expired token' });
  }
};

const JOIN_POINTS = 50;
const ATTEND_POINTS = 40;
const BADGE_FIRST_CLUB = 'first-club';
const BADGE_FIRST_EVENT = 'first-event';

async function creditStudentPoints(studentUserId, points, label) {
  const amount = Number(points);
  if (!studentUserId || !amount) return null;
  return ClubStudentState.findOneAndUpdate(
    { studentUserId },
    {
      $inc: { points: amount },
      $push: {
        pointsLedger: {
          $each: [{ label, points: amount, at: todayStr() }],
          $position: 0,
        },
      },
    },
    { upsert: true, new: true }
  );
}

async function awardStudentBadge(studentUserId, code) {
  if (!studentUserId || !code) return;
  await ClubStudentState.findOneAndUpdate(
    { studentUserId },
    { $addToSet: { badgesEarned: code } },
    { upsert: true }
  );
}

async function awardJoinPoints(studentUserId, label = 'Joined a club') {
  if (!studentUserId) return;
  await creditStudentPoints(studentUserId, JOIN_POINTS, label);
  await awardStudentBadge(studentUserId, BADGE_FIRST_CLUB);
}

async function pendingRedemptionCost(studentUserId) {
  if (!studentUserId) return 0;
  const rows = await ClubRedemption.aggregate([
    { $match: { studentUserId, status: 'Pending' } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]);
  return Number(rows[0]?.total) || 0;
}

async function isJoinedClubMember(clubId, userId) {
  const member = await ClubMember.findOne({
    clubId,
    studentUserId: userId,
    status: { $in: APPROVED_MEMBER_STATUSES },
  }).lean();
  return Boolean(member);
}

async function ensureStudentState(user) {
  let stu = await ClubStudentState.findOne({ studentUserId: user._id });
  if (!stu) {
    stu = await ClubStudentState.create({
      studentUserId: user._id,
      name: user.name || 'Student',
      department: 'Campus Student',
      year: 'Active',
      bio: '',
      points: 0,
      badgesEarned: [],
      savedActivityIds: [],
      selectedInterests: [],
      pointsLedger: [],
    });
  }
  return stu;
}

function collectContactKeys(profiles) {
  const mobiles = [...new Set(profiles.flatMap((p) => {
    if (p.mobile == null || p.mobile === '') return [];
    const values = [p.mobile, String(p.mobile)];
    const asNumber = Number(p.mobile);
    if (!Number.isNaN(asNumber)) values.push(asNumber);
    return values;
  }))];
  const emails = profiles.map((p) => String(p.email || '').toLowerCase()).filter(Boolean);
  return { mobiles, emails };
}

function initialsFromName(name) {
  return (
    (name || 'FC')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'FC'
  );
}

function instituteClubRoleLabel(user) {
  const permType = user?.permissions?.permission_type;
  const customPerms = user?.permissions?.custom_permissions || {};
  // Keep roles distinct in UI labels.
  if (permType === 'Admin') return 'Institute Admin';
  if (customPerms.can_be_club_admin) return 'Club Administrator';
  if (customPerms.can_be_club_sse) return 'Senior Sales Engineer';
  if (customPerms.can_be_club_se) return 'Sales Engineer';
  return 'Institution user';
}

function concernPersonUserId(row) {
  if (!row) return null;
  if (typeof row === 'object') {
    const id = row._id || row.id;
    return isValidObjectId(id) ? String(id) : null;
  }
  return isValidObjectId(row) ? String(row) : null;
}

function concernPersonRows(college) {
  if (!college?._concernPerson) return [];
  return Array.isArray(college._concernPerson) ? college._concernPerson : [college._concernPerson];
}

async function listCampusConcernUsers(collegeId, predicate, fallbackName) {
  if (!isValidObjectId(collegeId)) return [];
  const college = await College.findOne({ _id: collegeId, isDeleted: { $ne: true } })
    .select('_concernPerson')
    .lean();
  const ids = concernPersonRows(college)
    .map((row) => concernPersonUserId(row))
    .filter(Boolean);
  if (!ids.length) return [];
  const users = await User.find({
    _id: { $in: ids },
    isDeleted: { $ne: true },
    status: { $ne: false },
  })
    .select('_id name email designation permissions role')
    .lean();
  return users
    .filter((user) => predicate(user))
    .map((user) => ({
      _id: user._id,
      name: user.name || fallbackName,
      email: user.email || '',
      designation: user.designation || '',
      roleLabel: instituteClubRoleLabel(user),
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function listCampusClubAdmins(collegeId) {
  return listCampusConcernUsers(collegeId, isClubAdminCapableUser, 'Club Admin');
}

async function listCampusClubFieldStaff(collegeId) {
  return listCampusConcernUsers(collegeId, isSseOrSeCapableUser, 'Club staff');
}

function parseStaffUserIds(body = {}) {
  const raw = body.staffUserIds != null ? body.staffUserIds : body.staffUserId;
  if (Array.isArray(raw)) return raw.filter((id) => isValidObjectId(id)).map((id) => String(id));
  if (isValidObjectId(raw)) return [String(raw)];
  return [];
}

async function buildDirectoryPeople({
  campuses = [],
  members = [],
  clubs = [],
  currentUser,
  activeCampusId,
  cmsRole,
}) {
  const campusIds = (campuses || []).map((campus) => campus._id).filter(Boolean);
  const peopleById = new Map();
  const isStudent = cmsRole === 'student';

  const pushPerson = (person) => {
    const id = person?._id ? String(person._id) : '';
    if (!id) return;
    const existing = peopleById.get(id);
    if (existing) {
      if (!existing.clubId && person.clubId) {
        peopleById.set(id, { ...existing, clubId: person.clubId });
      }
      return;
    }
    peopleById.set(id, person);
  };

  if (!isStudent && campusIds.length) {
    const colleges = await College.find({ _id: { $in: campusIds }, isDeleted: { $ne: true } })
      .select('_id _concernPerson')
      .lean();
    const concernIds = [
      ...new Set(colleges.flatMap((college) => concernPersonRows(college).map(concernPersonUserId).filter(Boolean))),
    ];
    const concernUsers = concernIds.length
      ? await User.find({ _id: { $in: concernIds }, isDeleted: { $ne: true } })
          .select('name email designation permissions status')
          .lean()
      : [];
    const concernById = new Map(concernUsers.map((user) => [String(user._id), user]));

    colleges.forEach((college) => {
      concernPersonRows(college).forEach((row) => {
        const user = concernById.get(concernPersonUserId(row));
        if (!user || user.status === false) return;
        pushPerson({
          _id: user._id,
          name: user.name || 'Institute user',
          email: user.email || '',
          role: instituteClubRoleLabel(user),
          collegeId: college._id,
          clubId: undefined,
          avatarInitials: initialsFromName(user.name),
          department: user.designation || 'Institute',
          bio: '',
        });
      });
    });

    const staff = await ClubStaffAssignment.find({ collegeId: { $in: campusIds } })
      .populate('userId', 'name email designation permissions isDeleted status')
      .lean();
    staff.forEach((row) => {
      const user = row.userId;
      if (!user || user.isDeleted || user.status === false) return;
      pushPerson({
        _id: user._id,
        name: user.name || 'Staff',
        email: user.email || '',
        role: row.staffRole === 'sse' ? 'Senior Sales Engineer' : 'Sales Engineer',
        collegeId: row.collegeId,
        clubId: undefined,
        avatarInitials: initialsFromName(user.name),
        department: user.designation || 'Club staff',
        bio: '',
      });
    });
  }

  (members || [])
    .filter((member) => isApprovedMemberStatus(member.status) && member.studentUserId)
    .forEach((member) => {
      pushPerson({
        _id: member.studentUserId,
        name: member.studentName || 'Student',
        email: member.studentEmail || '',
        role: 'Student Member',
        collegeId: member.collegeId,
        clubId: member.clubId,
        avatarInitials: initialsFromName(member.studentName),
        department: member.department || 'Campus Student',
        bio: '',
      });
    });

  if (!isStudent && currentUser?._id && Number(currentUser.role) !== 3) {
    pushPerson({
      _id: currentUser._id,
      name: currentUser.name || 'Club Admin',
      email: currentUser.email || '',
      role: instituteClubRoleLabel(currentUser),
      collegeId: activeCampusId || campusIds[0],
      clubId: undefined,
      avatarInitials: initialsFromName(currentUser.name),
      department: currentUser.designation || 'Institute',
      bio: '',
    });
  }

  const coordinatorIds = [...new Set(
    (clubs || [])
      .map((club) => club.coordinatorId)
      .filter((id) => isValidObjectId(id))
      .map((id) => String(id))
  )];
  if (coordinatorIds.length) {
    const coordinators = await User.find({
      _id: { $in: coordinatorIds },
      isDeleted: { $ne: true },
    })
      .select('name email designation permissions status')
      .lean();
    const clubByCoordinator = new Map();
    (clubs || []).forEach((club) => {
      const id = isValidObjectId(club?.coordinatorId) ? String(club.coordinatorId) : '';
      if (id && !clubByCoordinator.has(id)) clubByCoordinator.set(id, club);
    });
    coordinators.forEach((user) => {
      if (user.status === false) return;
      const club = clubByCoordinator.get(String(user._id));
      pushPerson({
        _id: user._id,
        name: user.name || 'Coordinator',
        email: user.email || '',
        role: isStudent ? 'Coordinator' : instituteClubRoleLabel(user),
        collegeId: club?.collegeId,
        clubId: club?._id,
        avatarInitials: initialsFromName(user.name),
        department: user.designation || '',
        bio: '',
      });
    });
  }

  return [...peopleById.values()];
}

async function listCampusStudents(collegeId, search) {
  if (!isValidObjectId(collegeId)) return [];

  const [directProfiles, campusCourses, jobApps, uploaded] = await Promise.all([
    CandidateProfile.find({ college: collegeId, isDeleted: { $ne: true } })
      .select('_id name email mobile')
      .limit(300)
      .lean(),
    Courses.find({ college: collegeId }).select('_id').lean(),
    AppliedJobs.find({ college: collegeId }).select('_candidate').limit(500).lean(),
    UploadCandidates.find({ college: collegeId }).select('contactNumber email name').limit(300).lean(),
  ]);

  const courseIds = campusCourses.map((c) => c._id);
  const courseApps = courseIds.length
    ? await AppliedCourses.find({ _course: { $in: courseIds } }).select('_candidate').limit(500).lean()
    : [];

  const extraProfileIds = [
    ...courseApps.map((a) => a._candidate),
    ...jobApps.map((a) => a._candidate),
  ].filter(Boolean);

  const extraProfiles = extraProfileIds.length
    ? await CandidateProfile.find({ _id: { $in: extraProfileIds }, isDeleted: { $ne: true } })
        .select('_id name email mobile')
        .lean()
    : [];

  const byId = new Map();
  [...directProfiles, ...extraProfiles].forEach((p) => byId.set(String(p._id), p));
  const profiles = [...byId.values()];

  uploaded.forEach((row) => {
    if (row.email || row.contactNumber) {
      profiles.push({
        name: row.name,
        email: row.email,
        mobile: row.contactNumber,
      });
    }
  });

  const { mobiles, emails } = collectContactKeys(profiles);
  if (!mobiles.length && !emails.length) return [];

  const userFilter = { role: 3, isDeleted: { $ne: true }, $or: [] };
  if (mobiles.length) userFilter.$or.push({ mobile: { $in: mobiles } });
  if (emails.length) userFilter.$or.push({ email: { $in: emails } });

  let users = await User.find(userFilter).select('_id name email mobile').limit(100).lean();
  if (search) {
    const q = String(search).trim().toLowerCase();
    users = users.filter(
      (u) =>
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q)
    );
  }
  return dedupeByIdentity(users, (user) => {
    const mobile = normalizeClubMobile(user.mobile);
    const email = normalizeClubEmail(user.email);
    if (mobile) return `m:${mobile}`;
    if (email) return `e:${email}`;
    return `u:${user._id}`;
  });
}

const DEFAULT_CAMPUS_GOODIES = [];

const DEFAULT_CAMPUS_FAQS = [
  {
    question: 'How do I join a club that needs approval?',
    answer: 'Tap Join Club on the club card. You will see Waiting in My clubs until Club Admin approves.',
    sortOrder: 1,
  },
  {
    question: 'Is Save the same as Join event?',
    answer: 'No. Save remembers the event. Join event takes a seat. You can do either, or both.',
    sortOrder: 2,
  },
  {
    question: 'Who can approve a budget?',
    answer: 'Only a Club Administrator can Approve. Institutes and Sales Engineers can Request or Recommend.',
    sortOrder: 3,
  },
];

const DEFAULT_CAMPUS_BADGES = [
  { code: BADGE_FIRST_CLUB, name: 'First Club', description: 'Approved as a member of a club.', icon: 'crest' },
  { code: BADGE_FIRST_EVENT, name: 'First Event', description: 'Marked present at a club event.', icon: 'star' },
  { code: 'volunteer', name: 'Volunteer', description: 'Recognised for helping a club event.', icon: 'leaf' },
  { code: 'winner', name: 'Winner', description: 'Placed in a club competition.', icon: 'ribbon' },
  { code: 'leader', name: 'Club Leader', description: 'Led a club activity or team.', icon: 'torch' },
  { code: 'spark', name: 'Campus Spark', description: 'Stood out for campus spirit.', icon: 'spark' },
];

async function ensureCampusCatalog(collegeId) {
  if (!isValidObjectId(collegeId)) return;
  const [goodieCount, faqCount] = await Promise.all([
    ClubGoodie.countDocuments({ collegeId, isDeleted: { $ne: true } }),
    ClubFaq.countDocuments({ collegeId, isDeleted: { $ne: true } }),
  ]);
  if (goodieCount === 0 && DEFAULT_CAMPUS_GOODIES.length) {
    await ClubGoodie.insertMany(DEFAULT_CAMPUS_GOODIES.map((g) => ({ ...g, collegeId })));
  }
  if (faqCount === 0) {
    await ClubFaq.insertMany(DEFAULT_CAMPUS_FAQS.map((f) => ({ ...f, collegeId })));
  }
  await Promise.all(
    DEFAULT_CAMPUS_BADGES.map((badge) =>
      ClubBadge.updateOne(
        { collegeId, code: badge.code },
        {
          $setOnInsert: { collegeId, code: badge.code, isDeleted: false, audience: 'student' },
          $set: { name: badge.name, description: badge.description, icon: badge.icon },
        },
        { upsert: true }
      )
    )
  );
}

function emptyBootstrapPayload(req, cmsRole, permissions, campuses) {
  return {
    status: true,
    cmsRole,
    permissions,
    managesAllCampuses: Boolean(req.clubAccess?.managesAllCampuses),
    permissionMatrix: null,
    campuses,
    catalogCampuses: [],
    currentUser: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      role: req.user.role,
    },
    studentState: null,
    settings: { positionsFeatureEnabled: true },
    clubs: [],
    members: [],
    positions: [],
    positionRequests: [],
    activities: [],
    suggestions: [],
    posts: [],
    announcements: [],
    chatMessages: [],
    budgets: [],
    results: [],
    certificates: [],
    redemptions: [],
    people: [],
    clubWorkflows: [],
    notifications: [],
    students: [],
    goodies: [],
    faqs: [],
    badges: [],
    notificationTemplates: [],
    achievementCards: [],
    institutePoints: 0,
  };
}

// ============================================================================
// 1. BOOTSTRAP ENDPOINT
// ============================================================================

/** Fast student bootstrap — campus-only catalog (no cross-campus browse). */
async function bootstrapStudentCms(req, res) {
  try {
  const { cmsRole, permissions, campuses, activeCampusId } = req.clubAccess;
  const uid = req.user._id;
  const rosterFilter = await studentRosterFilter(req.user);
  const campusIds = (campuses || []).map((c) => c._id).filter((id) => isValidObjectId(id));
  const campusClubFilter = campusIds.length
    ? { isDeleted: { $ne: true }, collegeId: { $in: campusIds } }
    : { _id: null }; // no campus → empty catalog

  const myMemberships = await ClubMember.find(rosterFilter).sort({ createdAt: -1 }).limit(100).lean();
  // Keep memberships only for clubs on the student's campus(es).
  const membersMineRaw = await dedupeClubMembers(myMemberships);
  const membershipClubIds = [
    ...new Set(membersMineRaw.map((m) => String(m.clubId)).filter(isValidObjectId)),
  ];
  const membershipClubsOnCampus = membershipClubIds.length
    ? await Club.find({
        _id: { $in: membershipClubIds },
        isDeleted: { $ne: true },
        ...(campusIds.length ? { collegeId: { $in: campusIds } } : { _id: null }),
      })
        .select('_id')
        .lean()
    : [];
  const allowedMembershipClubIds = new Set(membershipClubsOnCampus.map((c) => String(c._id)));
  const membersMine = membersMineRaw.filter((m) => allowedMembershipClubIds.has(String(m.clubId)));
  const joinedClubIds = [
    ...new Set(
      membersMine
        .filter((m) => isApprovedMemberStatus(m.status))
        .map((m) => String(m.clubId))
        .filter(isValidObjectId)
    ),
  ];
  const pendingClubIds = [
    ...new Set(
      membersMine
        .filter((m) => String(m.status || '').toLowerCase() === 'pending')
        .map((m) => String(m.clubId))
        .filter(isValidObjectId)
    ),
  ];
  const relevantClubIds = [...new Set([...joinedClubIds, ...pendingClubIds])];

  // Positions to request: only clubs the student is already approved in.
  const positionQuery = joinedClubIds.length
    ? {
        isDeleted: { $ne: true },
        clubId: { $in: joinedClubIds },
        status: { $ne: 'Filled' },
        ...(campusIds.length ? { collegeId: { $in: campusIds } } : {}),
      }
    : { _id: null };

  const announcementOr = [{ submittedByUserId: uid }];
  if (joinedClubIds.length) {
    announcementOr.push({ clubId: { $in: joinedClubIds }, status: 'published' });
  }
  if (campusIds.length) {
    announcementOr.push({ status: 'published', collegeId: { $in: campusIds } });
  }

  const publishedActivityFilter = {
    ...(campusIds.length ? { collegeId: { $in: campusIds } } : { _id: null }),
    $or: [
      { scheduleStatus: { $exists: false } },
      { scheduleStatus: null },
      { scheduleStatus: 'scheduled' },
    ],
  };

  const notificationFilter = campusIds.length
    ? {
        $or: [
          { userId: uid },
          {
            collegeId: { $in: campusIds },
            $or: [{ role: 'student' }, { role: { $exists: false } }],
          },
        ],
      }
    : { userId: uid };

  const [
    campusSetting,
    clubs,
    positions,
    positionRequests,
    activities,
    suggestions,
    posts,
    announcements,
    budgets,
    certificates,
    redemptions,
    notifications,
    studentState,
    achievementCards,
  ] = await Promise.all([
    activeCampusId
      ? ClubCampusSetting.findOne({ collegeId: activeCampusId }).lean()
      : Promise.resolve(null),
    Club.find(campusClubFilter)
      .select(
        'name tagline description category clubType theme collegeId verticalId projectId centerId coordinatorId createdByUserId adminUserIds featured meetingSchedule location interests createdAt'
      )
      .populate('centerId', 'name')
      .populate('projectId', 'name')
      .populate('createdByUserId', 'name')
      .populate('adminUserIds', 'name')
      .sort({ createdAt: -1 })
      .limit(250)
      .lean(),
    ClubPosition.find(positionQuery).sort({ createdAt: -1 }).limit(150).lean(),
    ClubPositionRequest.find({ studentUserId: uid }).sort({ createdAt: -1 }).limit(50).lean(),
    ClubActivity.find(publishedActivityFilter).sort({ createdAt: -1 }).limit(80).lean(),
    ClubSuggestion.find({ studentUserId: uid }).sort({ createdAt: -1 }).limit(30).lean(),
    joinedClubIds.length
      ? ClubPost.find({ clubId: { $in: joinedClubIds } }).sort({ createdAt: -1 }).limit(60).lean()
      : Promise.resolve([]),
    ClubAnnouncement.find({ isDeleted: { $ne: true }, $or: announcementOr })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean(),
    ClubBudget.find({
      $or: [{ submittedByUserId: uid }, { requestedByUserId: uid }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    ClubCertificate.find({ studentUserId: uid }).sort({ createdAt: -1 }).limit(40).lean(),
    ClubRedemption.find({ studentUserId: uid }).sort({ createdAt: -1 }).limit(40).lean(),
    ClubNotification.find(notificationFilter).sort({ createdAt: -1 }).limit(20).lean(),
    ensureStudentState(req.user),
    ClubAchievementCard.find({
      $or: [
        { createdByUserId: uid },
        ...(joinedClubIds.length ? [{ clubId: { $in: joinedClubIds } }] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  let members = membersMine;
  if (joinedClubIds.length) {
    const joinedRoster = await ClubMember.find({
      clubId: { $in: joinedClubIds },
      status: { $in: APPROVED_MEMBER_STATUSES },
    })
      .sort({ createdAt: -1 })
      .limit(400)
      .lean();
    members = await dedupeClubMembers([...membersMine, ...joinedRoster]);
  }

  // Rewards catalog stays on the student's own campus only.
  const rewardCampusIds = campusIds.map((id) => String(id)).slice(0, 8);

  let goodies = [];
  let faqs = [];
  let badges = [];
  if (rewardCampusIds.length) {
    await Promise.all(rewardCampusIds.map((id) => ensureCampusCatalog(id)));
    [goodies, faqs, badges] = await Promise.all([
      ClubGoodie.find({ collegeId: { $in: rewardCampusIds }, isDeleted: { $ne: true } })
        .sort({ points: 1 })
        .limit(60)
        .lean(),
      ClubFaq.find({ collegeId: { $in: rewardCampusIds }, isDeleted: { $ne: true } })
        .sort({ sortOrder: 1, createdAt: 1 })
        .limit(40)
        .lean(),
      ClubBadge.find({ collegeId: { $in: rewardCampusIds }, isDeleted: { $ne: true } })
        .sort({ createdAt: 1 })
        .limit(40)
        .lean(),
    ]);
  }

  // Directory: members of joined clubs + coordinators only (skip full campus staff scan).
  let people = [];
  try {
    people = await buildDirectoryPeople({
      campuses: [],
      members: members.filter((m) => relevantClubIds.includes(String(m.clubId))),
      clubs: (clubs || []).filter((club) => relevantClubIds.includes(String(club._id))),
      currentUser: req.user,
      activeCampusId,
      cmsRole: 'student',
    });
  } catch (peopleErr) {
    console.error('buildDirectoryPeople (student) failed:', peopleErr.message);
    people = [];
  }

  const publishedAnnouncements = (announcements || []).filter(
    (item) => !item.status || item.status === 'published' || String(item.submittedByUserId) === String(uid)
  );

  return res.json({
    status: true,
    cmsRole,
    permissions,
    managesAllCampuses: false,
    permissionMatrix: campusSetting?.permissionMatrix || null,
    campuses,
    catalogCampuses: [],
    currentUser: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      isMainInstituteAdmin: false,
      role: req.user.role,
    },
    studentState,
    settings: {
      positionsFeatureEnabled:
        campusSetting?.positionsFeatureEnabled !== undefined
          ? campusSetting.positionsFeatureEnabled
          : true,
    },
    clubs,
    members,
    positions,
    positionRequests,
    activities,
    suggestions,
    posts,
    announcements: publishedAnnouncements,
    chatMessages: [],
    budgets,
    results: [],
    certificates,
    redemptions,
    people,
    clubWorkflows: [],
    notifications,
    students: [],
    goodies: attachCampusNames(dedupeById(goodies), campuses),
    faqs,
    badges: attachCampusNames(dedupeBadges(badges, true), campuses),
    notificationTemplates: [],
    achievementCards,
    institutePoints: campusSetting?.institutePoints || 0,
  });
  } catch (err) {
    console.error('Error in student club bootstrap:', err);
    return res.status(500).json({ status: false, message: err.message });
  }
}

router.get('/bootstrap', requireClubUser, async (req, res) => {
  try {
    let { cmsRole, permissions, campuses, activeCampusId } = req.clubAccess;
    const isStudent = cmsRole === 'student';
    const assignedFilter = assignedCampusFilter(req);

    if (isStudent) {
      return bootstrapStudentCms(req, res);
    }

    if (!activeCampusId || !campuses.length) {
      return res.json(emptyBootstrapPayload(req, cmsRole, permissions, campuses));
    }

    // Staff stay campus-scoped — Club Admins / SSE / SE only see clubs they are assigned to.
    const campusFilter = assignedFilter;
    const isDedicatedClubAdmin =
      cmsRole === 'club_admin' && !isMainInstituteAdminUser(req.user);
    const isAssignedFieldStaff = isFieldStaffCmsRole(cmsRole);
    // Institute Admin: campus-wide. Club Admin / SSE / SE: only clubs they are assigned to.
    let clubCatalogFilter = assignedFilter;
    if (isDedicatedClubAdmin) {
      clubCatalogFilter = {
        $or: [
          { createdByUserId: req.user._id },
          { adminUserIds: req.user._id },
          { coordinatorId: String(req.user._id) },
          // Legacy unowned clubs on assigned campuses stay manageable by campus Club Admins.
          {
            $and: [
              assignedFilter,
              {
                $or: [
                  { createdByUserId: { $exists: false } },
                  { createdByUserId: null },
                ],
              },
              {
                $or: [
                  { coordinatorId: { $exists: false } },
                  { coordinatorId: null },
                  { coordinatorId: '' },
                ],
              },
            ],
          },
        ],
      };
    } else if (isAssignedFieldStaff) {
      clubCatalogFilter = {
        $or: [
          { staffUserIds: req.user._id },
          { coordinatorId: String(req.user._id) },
        ],
      };
      // Keep field staff inside campuses they belong to (when campus list is known).
      const campusIds = (campuses || [])
        .map((campus) => campus?._id)
        .filter((id) => isValidObjectId(id));
      if (campusIds.length) {
        clubCatalogFilter = {
          $and: [{ collegeId: { $in: campusIds } }, clubCatalogFilter],
        };
      }
    }
    const rosterFilter = assignedFilter;
    const studentCampusOrGlobal = assignedFilter;

    await ensureCampusCatalog(activeCampusId);

    let [
      campusSetting,
      clubs,
      members,
      positions,
      positionRequests,
      activities,
      suggestions,
      posts,
      announcements,
      chatMessages,
      budgets,
      results,
      certificates,
      redemptions,
      people,
      clubWorkflows,
      notifications,
      studentState,
      candidateUsers,
      goodies,
      faqs,
      badges,
      notificationTemplates,
      achievementCards,
    ] = await Promise.all([
      ClubCampusSetting.findOne({ collegeId: activeCampusId }).lean(),
      Club.find({ ...clubCatalogFilter, isDeleted: { $ne: true } })
        .populate('centerId', 'name address')
        .populate('projectId', 'name')
        .populate('verticalId', 'name')
        .populate('createdByUserId', 'name email')
        .populate('adminUserIds', 'name email')
        .populate('staffUserIds', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      ClubMember.find(rosterFilter).sort({ createdAt: -1 }).lean(),
      ClubPosition.find({ ...campusFilter, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean(),
      ClubPositionRequest.find(campusFilter).sort({ createdAt: -1 }).lean(),
      ClubActivity.find(campusFilter).sort({ createdAt: -1 }).lean(),
      ClubSuggestion.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
      ClubPost.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
      ClubAnnouncement.find({ ...studentCampusOrGlobal, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean(),
      Promise.resolve([]),
      ClubBudget.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
      ClubResult.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
      ClubCertificate.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
      ClubRedemption.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
      Promise.resolve([]),
      ClubWorkflow.find(campusFilter).sort({ createdAt: -1 }).lean(),
      ClubNotification.find(studentCampusOrGlobal).sort({ createdAt: -1 }).limit(30).lean(),
      Promise.resolve(null),
      Promise.resolve([]),
      ClubGoodie.find({ ...studentCampusOrGlobal, isDeleted: { $ne: true } }).sort({ points: 1 }).lean(),
      ClubFaq.find({ ...studentCampusOrGlobal, isDeleted: { $ne: true } }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
      ClubBadge.find({ ...studentCampusOrGlobal, isDeleted: { $ne: true } }).sort({ createdAt: 1 }).lean(),
      ClubNotificationTemplate.find(campusFilter).sort({ createdAt: -1 }).lean(),
      ClubAchievementCard.find(studentCampusOrGlobal).sort({ createdAt: -1 }).lean(),
    ]);

    members = await dedupeClubMembers(members);

    // Club Admins / SSE / SE only see roster + ops for clubs they are assigned to.
    if (isDedicatedClubAdmin || isAssignedFieldStaff) {
      const managedClubIds = new Set(
        (clubs || [])
          .filter((club) => {
            if (isAssignedFieldStaff) return isClubLinkedFieldStaff(req.user, club);
            if (isClubOwnerOrCoordinator(req.user, club)) return true;
            return !club.createdByUserId && !String(club.coordinatorId || '').trim();
          })
          .map((club) => String(club._id))
      );
      const inManagedClub = (row) => {
        const clubId = String(row?.clubId?._id || row?.clubId || '');
        if (!clubId) return !isAssignedFieldStaff;
        return managedClubIds.has(clubId);
      };
      members = (members || []).filter((member) => managedClubIds.has(String(member.clubId)));
      positions = (positions || []).filter(inManagedClub);
      positionRequests = (positionRequests || []).filter(inManagedClub);
      activities = (activities || []).filter(inManagedClub);
      budgets = (budgets || []).filter(inManagedClub);
      results = (results || []).filter(inManagedClub);
      certificates = (certificates || []).filter(inManagedClub);
      announcements = (announcements || []).filter(inManagedClub);
      clubWorkflows = (clubWorkflows || []).filter(inManagedClub);
      posts = (posts || []).filter(inManagedClub);
      suggestions = (suggestions || []).filter(inManagedClub);
      redemptions = (redemptions || []).filter(inManagedClub);
      notifications = (notifications || []).filter(inManagedClub);
      achievementCards = (achievementCards || []).filter(inManagedClub);
      // Campus-level catalogs (goodies/faqs/badges/templates) stay visible on this campus.
    }

    const students = candidateUsers.map((u) => ({
      _id: u._id,
      studentUserId: u._id,
      studentName: u.name || 'Student',
      studentEmail: u.email || '',
      department: 'Campus Student',
    }));

    let catalogCampuses = [];
    if (cmsRole === 'club_admin') {
      const clubCollegeIds = [
        ...new Set(
          (clubs || [])
            .map((club) => club.collegeId)
            .filter((id) => isValidObjectId(id))
            .map((id) => String(id))
        ),
      ];
      if (clubCollegeIds.length) {
        const assignedIds = new Set((campuses || []).map((campus) => String(campus._id)));
        const extraIds = clubCollegeIds.filter((id) => !assignedIds.has(id));
        if (extraIds.length) {
          catalogCampuses = await College.find({
            _id: { $in: extraIds },
            isDeleted: { $ne: true },
          })
            .select(COLLEGE_SELECT)
            .lean();
        }
      }
    }

    try {
      people = await buildDirectoryPeople({
        campuses: [...(campuses || []), ...catalogCampuses],
        members,
        clubs,
        currentUser: req.user,
        activeCampusId,
        cmsRole,
      });
    } catch (peopleErr) {
      console.error('buildDirectoryPeople failed:', peopleErr.message);
      people = [];
    }

    return res.json({
      status: true,
      cmsRole,
      permissions,
      managesAllCampuses: Boolean(req.clubAccess?.managesAllCampuses),
      permissionMatrix: campusSetting?.permissionMatrix || null,
      campuses,
      catalogCampuses,
      currentUser: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobile: req.user.mobile,
        isMainInstituteAdmin: isMainInstituteAdminUser(req.user),
        role: req.user.role,
      },
      studentState,
      settings: {
        positionsFeatureEnabled:
          campusSetting?.positionsFeatureEnabled !== undefined
            ? campusSetting.positionsFeatureEnabled
            : true,
      },
      clubs,
      members,
      positions,
      positionRequests,
      activities,
      suggestions,
      posts,
      announcements,
      chatMessages,
      budgets,
      results,
      certificates,
      redemptions,
      people,
      clubWorkflows,
      notifications,
      students,
      goodies: attachCampusNames(dedupeById(goodies), campuses),
      faqs,
      badges: attachCampusNames(dedupeBadges(badges, isStudent), campuses),
      notificationTemplates,
      achievementCards,
      institutePoints: campusSetting?.institutePoints || 0,
    });
  } catch (err) {
    console.error('Error in GET /api/club-cms/bootstrap:', err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 2. INSTITUTIONS & CAMPUS SETTINGS
// ============================================================================
router.post('/institutions', requireClubUser, requirePermission('settings.manage'), async (_req, res) => {
  return res.status(403).json({
    status: false,
    message: 'Campuses cannot be created from Club. Add them from Institute Register or the College Add screen.',
  });
});

router.put('/institutions/:id', requireClubUser, requirePermission('settings.manage'), async (req, res) => {
  try {
    if (denyCampus(req, res, req.params.id)) return;
    const { name, type, city, contactEmail, status, description } = req.body;
    const update = {
      name: name?.trim(),
      place: city,
      address: city,
      description,
      status: status !== 'Onboarding',
    };
    if (['School', 'College', 'Computer Center', 'University', 'Private University'].includes(type)) {
      update.type = type;
    }
    if (contactEmail) {
      update.collegeRepresentatives = [{ name: 'Campus Contact', email: contactEmail }];
    }
    const college = await College.findByIdAndUpdate(req.params.id, update, { new: true });
    return res.json({ status: true, institution: college });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.get('/campuses/:collegeId/students', requireClubUser, requireStaff, async (req, res) => {
  try {
    if (denyCampus(req, res, req.params.collegeId)) return;
    const search = (req.query.search || '').trim();
    const users = await listCampusStudents(req.params.collegeId, search);
    const students = users.map((u) => ({
      _id: u._id,
      studentUserId: u._id,
      studentName: u.name || 'Student',
      studentEmail: u.email || '',
      department: 'Campus Student',
    }));
    return res.json({ status: true, students });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/campuses/:collegeId/settings/positions-feature', requireClubUser, requirePermission('positions.manageFeature'), async (req, res) => {
  try {
    if (denyCampus(req, res, req.params.collegeId)) return;
    const { collegeId } = req.params;
    const { enabled } = req.body;
    const setting = await ClubCampusSetting.findOneAndUpdate(
      { collegeId },
      { $set: { positionsFeatureEnabled: Boolean(enabled) } },
      { upsert: true, new: true }
    );
    return res.json({ status: true, setting });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/campuses/:collegeId/settings/permission-matrix', requireClubUser, requirePermission('staff.assign'), async (req, res) => {
  try {
    if (denyCampus(req, res, req.params.collegeId)) return;
    const { collegeId } = req.params;
    const { permissionMatrix } = req.body;
    const setting = await ClubCampusSetting.findOneAndUpdate(
      { collegeId },
      { $set: { permissionMatrix } },
      { upsert: true, new: true }
    );
    return res.json({ status: true, setting });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 3. CLUBS & WORKFLOWS
// ============================================================================
router.get('/placement/verticals', requireClubUser, requireStaff, async (req, res) => {
  try {
    const collegeIds = placementCollegeIds(req);
    if (!collegeIds.length) {
      return res.json({ status: true, data: [] });
    }
    const scope = placementAccessScope(req);
    const filter = { college: { $in: collegeIds }, status: { $ne: false } };
    if (scope.verticalIds) {
      filter._id = { $in: scope.verticalIds };
    } else if (scope.projectIds) {
      const projects = await Project.find({
        _id: { $in: scope.projectIds },
        college: { $in: collegeIds },
      })
        .select('vertical')
        .lean();
      filter._id = { $in: [...new Set(projects.map((row) => String(row.vertical)).filter(Boolean))] };
    }
    const verticals = await Vertical.find(filter).select('_id name college').sort({ name: 1 }).lean();
    return res.json({ status: true, data: verticals });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.get('/placement/projects', requireClubUser, requireStaff, async (req, res) => {
  try {
    const collegeIds = placementCollegeIds(req);
    const verticalId = req.query.verticalId;
    if (!collegeIds.length || !isValidObjectId(verticalId)) {
      return res.json({ status: true, data: [] });
    }
    const scope = placementAccessScope(req);
    if (scope.verticalIds && !scope.verticalIds.includes(String(verticalId))) {
      return res.json({ status: true, data: [] });
    }
    const filter = {
      college: { $in: collegeIds },
      vertical: verticalId,
      status: 'active',
    };
    if (scope.projectIds) filter._id = { $in: scope.projectIds };
    const projects = await Project.find(filter).select('_id name vertical college').sort({ name: 1 }).lean();
    return res.json({ status: true, data: projects });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.get('/placement/centers', requireClubUser, requireStaff, async (req, res) => {
  try {
    const collegeIds = placementCollegeIds(req);
    const projectId = req.query.projectId;
    if (!collegeIds.length || !isValidObjectId(projectId)) {
      return res.json({ status: true, data: [] });
    }
    const scope = placementAccessScope(req);
    if (scope.projectIds && !scope.projectIds.includes(String(projectId))) {
      return res.json({ status: true, data: [] });
    }
    const centers = await Center.find({
      college: { $in: collegeIds },
      projects: projectId,
      status: true,
    })
      .select('_id name address college projects')
      .sort({ name: 1 })
      .lean();
    return res.json({ status: true, data: centers });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.get('/campus-club-admins', requireClubUser, requireStaff, async (req, res) => {
  try {
    const collegeId = req.query.collegeId || req.clubAccess?.activeCampusId;
    if (!isValidObjectId(collegeId)) {
      return res.json({ status: true, data: [], canAssignOwner: canAssignClubOwner(req) });
    }
    if (denyCampus(req, res, collegeId)) return;
    const data = await listCampusClubAdmins(collegeId);
    return res.json({ status: true, data, canAssignOwner: canAssignClubOwner(req) });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.get('/campus-club-staff', requireClubUser, requireStaff, async (req, res) => {
  try {
    const collegeId = req.query.collegeId || req.clubAccess?.activeCampusId;
    if (!isValidObjectId(collegeId)) {
      return res.json({ status: true, data: [] });
    }
    if (denyCampus(req, res, collegeId)) return;
    const data = await listCampusClubFieldStaff(collegeId);
    return res.json({ status: true, data });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/clubs', requireClubUser, requirePermission('clubs.create'), async (req, res) => {
  try {
    const placement = await resolveClubPlacement(req, req.body);
    if (placement.error) {
      return res.status(400).json({ status: false, message: placement.error });
    }
    const ownerResult = await resolveClubOwnerUserId(
      req,
      placement.collegeId,
      req.body.ownerUserId || req.body.createdByUserId
    );
    if (ownerResult.error) {
      return res.status(400).json({ status: false, message: ownerResult.error });
    }
    const clubType = req.body.clubType || req.body.category || 'Creative';
    const requestedStaffIds = parseStaffUserIds(req.body);
    // Creating SSE/SE is automatically linked to the club they set up.
    if (isFieldStaffCmsRole(req.clubAccess?.cmsRole)) {
      requestedStaffIds.push(String(req.user._id));
    }
    const club = await Club.create({
      name: req.body.name,
      tagline: req.body.tagline || '',
      description: req.body.description || '',
      category: clubType,
      clubType,
      theme: req.body.theme || '',
      collegeId: placement.collegeId,
      verticalId: placement.verticalId,
      projectId: placement.projectId,
      centerId: placement.centerId,
      coordinatorId: req.body.coordinatorId || '',
      createdByUserId: ownerResult.ownerId,
      adminUserIds: withClubAdmins(ownerResult.ownerId),
      staffUserIds: withClubStaffIds(requestedStaffIds),
      createdByRole: req.clubAccess.cmsRole,
      eligibility: req.body.eligibility || '',
      joiningMethod: 'Approval Required',
      meetingSchedule: req.body.meetingSchedule || '',
      location: req.body.location || '',
      interests: Array.isArray(req.body.interests) ? req.body.interests : [],
      featured: Boolean(req.body.featured),
    });

    return res.json({ status: true, club });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/clubs/:clubId', requireClubUser, requirePermission('clubs.edit'), async (req, res) => {
  try {
    const { clubId } = req.params;
    const existing = await Club.findById(clubId);
    if (!existing) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, existing.collegeId)) return;
    if (denyClubStaffManage(req, res, existing)) return;
    const clubType = req.body.clubType || req.body.category;
    const placement = await resolveClubPlacement(req, req.body);
    if (placement.error) {
      return res.status(400).json({ status: false, message: placement.error });
    }
    const update = {
      name: req.body.name,
      description: req.body.description,
      category: clubType,
      clubType,
      theme: req.body.theme,
      collegeId: placement.collegeId,
      verticalId: placement.verticalId,
      projectId: placement.projectId,
      centerId: placement.centerId,
      coordinatorId: req.body.coordinatorId,
      joiningMethod: 'Approval Required',
      interests: req.body.interests,
      featured: Boolean(req.body.featured),
    };
    const canSetStaff =
      canAssignClubOwner(req) ||
      req.clubAccess?.cmsRole === 'club_admin' ||
      req.clubAccess?.cmsRole === 'institute';
    const shouldSetStaff =
      canSetStaff && (req.body.staffUserIds != null || req.body.staffUserId != null);
    const nextStaffIds = shouldSetStaff ? withClubStaffIds(parseStaffUserIds(req.body)) : null;
    // Add/keep Club Admins: Institute Admin / SSE can add another admin; earlier admins remain.
    let addAdminUserId = null;
    if (canAssignClubOwner(req) && (req.body.ownerUserId || req.body.createdByUserId)) {
      const ownerResult = await resolveClubOwnerUserId(
        req,
        placement.collegeId || existing.collegeId,
        req.body.ownerUserId || req.body.createdByUserId
      );
      if (ownerResult.error) {
        return res.status(400).json({ status: false, message: ownerResult.error });
      }
      // Keep original primary owner unless club had none; merge admins via $addToSet after update.
      if (!existing.createdByUserId) {
        update.createdByUserId = ownerResult.ownerId;
      }
      addAdminUserId = ownerResult.ownerId;
    }
    await Club.findByIdAndUpdate(clubId, update, { new: true });
    const clubObjectId = new mongoose.Types.ObjectId(String(clubId));
    const nativeOps = {};
    if (nextStaffIds) {
      // Native $set avoids DocumentArray cast issues (same pattern as adminUserIds).
      nativeOps.$set = { ...(nativeOps.$set || {}), staffUserIds: nextStaffIds };
    }
    if (addAdminUserId) {
      const toAdd = withClubAdmins(addAdminUserId, [
        ...clubAdminIdList(existing),
        existing.createdByUserId,
      ]);
      nativeOps.$addToSet = { adminUserIds: { $each: toAdd } };
    }
    if (Object.keys(nativeOps).length) {
      await Club.collection.updateOne({ _id: clubObjectId }, nativeOps);
    }
    const club = await Club.findById(clubId)
      .populate('staffUserIds', 'name email')
      .populate('adminUserIds', 'name email')
      .lean();
    return res.json({ status: true, club });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/clubs/:clubId/assign-owner', requireClubUser, requireStaff, async (req, res) => {
  try {
    if (!canAssignClubOwner(req)) {
      return res.status(403).json({
        status: false,
        message: 'Only Institute Admin or Senior Sales Engineer can add a Club Admin to this club.',
      });
    }
    const club = await Club.findById(req.params.clubId).lean();
    if (!club || club.isDeleted) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, club.collegeId)) return;
    if (denyClubStaffManage(req, res, club)) return;
    const ownerResult = await resolveClubOwnerUserId(req, club.collegeId, req.body.ownerUserId);
    if (ownerResult.error) {
      return res.status(400).json({ status: false, message: ownerResult.error });
    }
    // Add admin — earlier owners/admins remain ($addToSet via native driver to avoid
    // Mongoose DocumentArray cast: Parameter "obj" to Document() must be an object).
    const toAdd = withClubAdmins(ownerResult.ownerId, [
      ...clubAdminIdList(club),
      club.createdByUserId,
    ]);
    const clubObjectId = new mongoose.Types.ObjectId(String(club._id));
    const updateOps = {
      $addToSet: { adminUserIds: { $each: toAdd } },
    };
    if (!club.createdByUserId) {
      updateOps.$set = {
        createdByUserId: toAdd[0] || new mongoose.Types.ObjectId(String(ownerResult.ownerId)),
      };
    }
    await Club.collection.updateOne({ _id: clubObjectId }, updateOps);
    const saved = await Club.findById(clubObjectId).lean();
    return res.json({ status: true, club: saved });
  } catch (err) {
    console.error('assign-owner failed:', err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/clubs/:clubId', requireClubUser, requirePermission('clubs.edit'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.isDeleted) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, club.collegeId)) return;
    if (denyClubStaffManage(req, res, club)) return;
    club.isDeleted = true;
    await club.save();
    await ClubPosition.updateMany({ clubId: club._id }, { isDeleted: true });
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/clubs/:clubId/assign-staff', requireClubUser, requireStaff, async (req, res) => {
  try {
    if (
      !canAssignClubOwner(req) &&
      req.clubAccess?.cmsRole !== 'club_admin' &&
      req.clubAccess?.cmsRole !== 'institute'
    ) {
      return res.status(403).json({
        status: false,
        message: 'Only Institute Admin, Club Admin, or SSE can assign staff to a club.',
      });
    }
    const club = await Club.findById(req.params.clubId);
    if (!club || club.isDeleted) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, club.collegeId)) return;
    if (denyClubStaffManage(req, res, club)) return;
    const staffIds = parseStaffUserIds(req.body);
    if (!staffIds.length) {
      return res.status(400).json({ status: false, message: 'Select at least one SSE or SE.' });
    }
    const users = await User.find({ _id: { $in: staffIds } })
      .select('_id name role permissions status isDeleted')
      .lean();
    const validIds = users.filter((user) => isSseOrSeCapableUser(user)).map((user) => String(user._id));
    if (!validIds.length) {
      return res.status(400).json({
        status: false,
        message: 'Assign only users with Senior Sales Engineer or Sales Engineer role.',
      });
    }
    await Club.collection.updateOne(
      { _id: club._id },
      { $addToSet: { staffUserIds: { $each: withClubStaffIds(validIds) } } }
    );
    const saved = await Club.findById(club._id)
      .populate('staffUserIds', 'name email')
      .lean();
    return res.json({ status: true, club: saved });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/workflows', requireClubUser, requireStaff, async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    if (!activeCampusId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    if (await denyStaffClubOpsByClubId(req, res, req.body.clubId, { required: false })) return;
    const wf = await ClubWorkflow.create({
      clubId: isValidObjectId(req.body.clubId) ? req.body.clubId : undefined,
      collegeId: activeCampusId,
      action: req.body.action || 'request',
      actorRole: req.body.actorRole || '',
      actorName: req.body.actorName || req.user.name || 'Staff',
      note: req.body.note || '',
      status: req.body.action === 'recommend' ? 'Recommended' : 'Requested',
      createdAtDate: todayStr(),
    });
    return res.json({ status: true, workflow: wf });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 4. MEMBERSHIPS
// ============================================================================
router.post('/clubs/:clubId/members', requireClubUser, requirePermission('members.add'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, club.collegeId)) return;
    if (denyClubMembershipManage(req, res, club)) return;

    const studentUserId = req.body.studentUserId || req.body.studentId;
    const student = isValidObjectId(studentUserId)
      ? await User.findById(studentUserId).select('name email mobile').lean()
      : null;
    const studentEmail = normalizeClubEmail(req.body.studentEmail || student?.email);
    const studentMobile = normalizeClubMobile(req.body.studentMobile || student?.mobile);
    const existing = await findClubMemberByIdentity(club._id, {
      userId: studentUserId,
      email: studentEmail,
      mobile: studentMobile,
    });
    if (existing) {
      if (isApprovedMemberStatus(existing.status)) {
        return res.json({ status: false, message: 'Student is already an approved member of this club.' });
      }
      if (existing.status === 'blocked') {
        return res.json({ status: false, message: 'Unblock this student before adding them as a member.' });
      }
      const actor = actorSnapshot(req);
      existing.status = 'approved';
      existing.joinedAt = todayStr();
      existing.approvedAt = nowIso();
      existing.reviewedByUserId = actor.userId;
      existing.reviewedByName = actor.name;
      existing.reviewedByRole = actor.role;
      existing.reviewedAt = actor.at;
      await existing.save();
      return res.json({ status: true, member: existing });
    }

    const actor = actorSnapshot(req);
    const member = await ClubMember.create({
      clubId: club._id,
      collegeId: club.collegeId,
      studentUserId,
      studentName: req.body.studentName || student?.name || 'Student',
      studentEmail: studentEmail || req.body.studentEmail || '',
      studentMobile,
      department: req.body.department || 'Campus Student',
      status: 'approved',
      requestedAt: todayStr(),
      joinedAt: todayStr(),
      approvedAt: nowIso(),
      requestedByUserId: actor.userId,
      requestedByName: actor.name,
      requestedByRole: actor.role,
      reviewedByUserId: actor.userId,
      reviewedByName: actor.name,
      reviewedByRole: actor.role,
      reviewedAt: actor.at,
    });

    return res.json({ status: true, member });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/clubs/:clubId/members/requests', requireClubUser, requirePermission('members.request'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.isDeleted) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, club.collegeId)) return;

    const stuState = await ensureStudentState(req.user);
    const studentEmail = normalizeClubEmail(req.user.email);
    const studentMobile = normalizeClubMobile(req.user.mobile);
    let member = await findClubMemberByIdentity(club._id, {
      userId: req.user._id,
      email: studentEmail,
      mobile: studentMobile,
    });
    const actor = actorSnapshot(req);

    if (member) {
      if (member.status === 'blocked') {
        return res.status(403).json({ status: false, message: 'You cannot request to join this club while blocked.' });
      }
      if (isApprovedMemberStatus(member.status)) {
        return res.json({ status: true, member, alreadyMember: true });
      }
      if (member.status === 'pending') {
        return res.json({ status: true, member, duplicate: true, alreadyMember: true });
      }
      member.status = 'pending';
      member.requestedAt = todayStr();
      member.note = req.body.note || member.note;
      member.joinedAt = '';
      member.approvedAt = '';
      member.rejectedAt = '';
      member.requestedByUserId = actor.userId;
      member.requestedByName = actor.name;
      member.requestedByRole = actor.role;
      await member.save();
    } else {
      member = await ClubMember.create({
        clubId: club._id,
        collegeId: club.collegeId,
        studentUserId: req.user._id,
        studentName: stuState.name || req.user.name || 'Student',
        studentEmail: studentEmail || req.user.email || '',
        studentMobile,
        department: stuState.department || 'Campus Student',
        status: 'pending',
        requestedAt: todayStr(),
        joinedAt: '',
        note: req.body.note || '',
        requestedByUserId: actor.userId,
        requestedByName: actor.name,
        requestedByRole: actor.role,
      });
    }

    if (member.status === 'pending') {
      emitClubMembership(club.collegeId, {
        type: 'request',
        clubId: String(club._id),
        memberId: String(member._id),
        studentUserId: String(member.studentUserId || req.user._id || ''),
        status: member.status,
      });
    }

    return res.json({ status: true, member, duplicate: false });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/clubs/:clubId/members/leave', requireClubUser, async (req, res) => {
  try {
    const member = await findClubMemberByIdentity(req.params.clubId, {
      userId: req.user._id,
      email: req.user.email,
      mobile: req.user.mobile,
    });
    if (!member) return res.json({ status: true });
    if (member.status === 'blocked') {
      return res.status(403).json({ status: false, message: 'A blocked membership cannot be changed by the student.' });
    }
    const collegeId = member.collegeId;
    const clubId = member.clubId;
    await ClubMember.deleteOne({ _id: member._id });
    emitClubMembership(collegeId, {
      type: 'leave',
      clubId: String(clubId || ''),
      memberId: String(member._id),
      studentUserId: String(member.studentUserId || req.user._id || ''),
      status: 'cancelled',
    });
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/members/:memberId/review', requireClubUser, requirePermission('members.approve'), async (req, res) => {
  try {
    const { decision } = req.body;
    const member = await ClubMember.findById(req.params.memberId);
    if (!member) return res.status(404).json({ status: false, message: 'Member request not found' });
    if (denyCampus(req, res, member.collegeId)) return;
    const club = member.clubId
      ? await Club.findById(member.clubId)
          .select('collegeId createdByUserId coordinatorId adminUserIds staffUserIds')
          .lean()
      : null;
    if (!club) return res.status(404).json({ status: false, message: 'Club not found for this request' });
    if (denyClubMembershipManage(req, res, club)) return;

    const actor = actorSnapshot(req);
    member.reviewedByUserId = actor.userId;
    member.reviewedByName = actor.name;
    member.reviewedByRole = actor.role;
    member.reviewedAt = actor.at;
    if (decision === 'approve') {
      const alreadyJoined = isApprovedMemberStatus(member.status);
      member.status = 'approved';
      member.joinedAt = todayStr();
      member.approvedAt = nowIso();
      await member.save();
      if (!alreadyJoined) {
        await awardJoinPoints(member.studentUserId, 'Joined Campus Club');
      }
    } else {
      if (!canCms(req, 'members.reject')) {
        return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
      }
      member.status = 'rejected';
      member.rejectedAt = todayStr();
      await member.save();
    }

    emitClubMembership(member.collegeId, {
      type: 'review',
      clubId: String(member.clubId || ''),
      memberId: String(member._id),
      studentUserId: String(member.studentUserId || ''),
      status: member.status,
    });
    return res.json({ status: true, member });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/members/:memberId/status', requireClubUser, requirePermission('members.block'), async (req, res) => {
  try {
    const existingMember = await ClubMember.findById(req.params.memberId);
    if (!existingMember) return res.status(404).json({ status: false, message: 'Member not found' });
    if (denyCampus(req, res, existingMember.collegeId)) return;
    const club = existingMember.clubId
      ? await Club.findById(existingMember.clubId)
          .select('collegeId createdByUserId coordinatorId adminUserIds staffUserIds')
          .lean()
      : null;
    if (!club) return res.status(404).json({ status: false, message: 'Club not found for this member' });
    if (denyClubMembershipManage(req, res, club)) return;
    const { status } = req.body;
    const allowed = ['approved', 'joined', 'blocked', 'rejected', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: false, message: 'Invalid membership status.' });
    }
    const actor = actorSnapshot(req);
    const nextStatus = status === 'joined' ? 'approved' : status;
    const update = {
      status: nextStatus,
      reviewedByUserId: actor.userId,
      reviewedByName: actor.name,
      reviewedByRole: actor.role,
      reviewedAt: actor.at,
    };
    if (isApprovedMemberStatus(nextStatus)) {
      update.joinedAt = todayStr();
      update.approvedAt = nowIso();
    }
    if (nextStatus === 'blocked') {
      update.blockedAt = nowIso();
      update.blockedByUserId = actor.userId;
      update.blockedByName = actor.name;
      update.blockedByRole = actor.role;
    }
    const member = await ClubMember.findByIdAndUpdate(req.params.memberId, update, { new: true });
    emitClubMembership(member?.collegeId || existingMember.collegeId, {
      type: 'status',
      clubId: String(member?.clubId || existingMember.clubId || ''),
      memberId: String(member?._id || existingMember._id),
      studentUserId: String(member?.studentUserId || existingMember.studentUserId || ''),
      status: member?.status || nextStatus,
    });
    return res.json({ status: true, member });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 5. POSITIONS & ROLE REQUESTS
// ============================================================================

async function countAssignedSeats(positionId) {
  return ClubPositionRequest.countDocuments({
    positionId,
    status: 'assigned',
  });
}

/** Keep Open / Filled in sync with assigned seat count. */
async function syncPositionSeatStatus(positionId) {
  const position = await ClubPosition.findById(positionId);
  if (!position || position.isDeleted) return null;
  const filled = await countAssignedSeats(position._id);
  const seats = Math.max(1, Number(position.seats) || 1);
  const nextStatus = filled >= seats ? 'Filled' : 'Open';
  if (position.status !== nextStatus) {
    position.status = nextStatus;
    await position.save();
  }
  return { position, filled, seats };
}

function positionTermFields(body = {}) {
  return {
    termLabel: String(body.termLabel || '').trim(),
    termStart: String(body.termStart || '').trim(),
    termEnd: String(body.termEnd || '').trim(),
  };
}

router.post('/clubs/:clubId/positions', requireClubUser, requirePermission('positions.create'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ status: false, message: 'Club not found' });
    if (denyCampus(req, res, club.collegeId)) return;
    if (denyClubStaffManage(req, res, club)) return;

    const term = positionTermFields(req.body);
    const position = await ClubPosition.create({
      clubId: club._id,
      collegeId: club.collegeId,
      title: req.body.title,
      description: req.body.description || '',
      seats: Math.max(1, Number(req.body.seats) || 1),
      status: req.body.status || 'Open',
      ...term,
    });

    return res.json({ status: true, position });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/positions/:positionId', requireClubUser, requirePermission('positions.create'), async (req, res) => {
  try {
    const existingPosition = await ClubPosition.findById(req.params.positionId);
    if (!existingPosition) return res.status(404).json({ status: false, message: 'Position not found' });
    if (denyCampus(req, res, existingPosition.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, existingPosition.clubId, { required: true })) return;
    const term = positionTermFields(req.body);
    const seats = Math.max(1, Number(req.body.seats) || existingPosition.seats || 1);
    await ClubPosition.findByIdAndUpdate(req.params.positionId, {
      title: req.body.title,
      description: req.body.description,
      seats,
      ...(req.body.status ? { status: req.body.status } : {}),
      ...term,
    });
    // Prefer seat-driven Open/Filled over a stale manual status.
    const synced = await syncPositionSeatStatus(req.params.positionId);
    return res.json({ status: true, position: synced?.position || existingPosition });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/positions/:positionId', requireClubUser, requirePermission('positions.create'), async (req, res) => {
  try {
    const position = await ClubPosition.findById(req.params.positionId);
    if (!position || position.isDeleted) return res.status(404).json({ status: false, message: 'Position not found' });
    if (denyCampus(req, res, position.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, position.clubId, { required: true })) return;
    position.isDeleted = true;
    await position.save();
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/positions/:positionId/requests', requireClubUser, requirePermission('positions.request'), async (req, res) => {
  try {
    const position = await ClubPosition.findById(req.params.positionId);
    if (!position || position.isDeleted) {
      return res.status(404).json({ status: false, message: 'Position not found' });
    }
    if (denyCampus(req, res, position.collegeId)) return;

    const campusSetting = await ClubCampusSetting.findOne({ collegeId: position.collegeId }).lean();
    if (campusSetting && campusSetting.positionsFeatureEnabled === false) {
      return res.status(400).json({ status: false, message: 'Club positions are not open right now.' });
    }

    if (String(position.status || '') === 'Filled') {
      return res.status(400).json({ status: false, message: 'This position is already filled.' });
    }

    const isMember = await isStudentClubMember(req, position.clubId);
    if (!isMember) {
      return res.status(403).json({
        status: false,
        message: 'Join this club and get approved before requesting a position.',
      });
    }

    const filled = await countAssignedSeats(position._id);
    const seats = Math.max(1, Number(position.seats) || 1);
    if (filled >= seats) {
      await syncPositionSeatStatus(position._id);
      return res.status(400).json({ status: false, message: 'All seats for this position are filled.' });
    }

    const existingActive = await ClubPositionRequest.findOne({
      positionId: position._id,
      studentUserId: req.user._id,
      status: { $in: ['pending', 'recommended', 'assigned'] },
    });
    if (existingActive) {
      if (existingActive.status === 'assigned') {
        return res.status(400).json({ status: false, message: 'You already hold this position.' });
      }
      return res.json({ status: true, duplicate: true, request: existingActive });
    }

    // One open request per club at a time (campus-clean elections).
    const otherOpen = await ClubPositionRequest.findOne({
      clubId: position.clubId,
      studentUserId: req.user._id,
      status: { $in: ['pending', 'recommended'] },
    });
    if (otherOpen) {
      return res.status(400).json({
        status: false,
        message: 'You already have an open position request in this club. Wait for it to be decided.',
      });
    }

    const stuState = await ensureStudentState(req.user);
    const actor = actorSnapshot(req);
    const requestDoc = await ClubPositionRequest.create({
      positionId: position._id,
      clubId: position.clubId,
      collegeId: position.collegeId,
      studentUserId: req.user._id,
      studentName: stuState.name || req.user.name || 'Student',
      note: req.body.note || '',
      status: 'pending',
      requestedByUserId: actor.userId,
      requestedByName: actor.name,
      requestedAt: actor.at,
    });

    return res.json({ status: true, duplicate: false, request: requestDoc });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/position-requests/:requestId/review', requireClubUser, async (req, res) => {
  try {
    const { decision } = req.body;
    const requestDoc = await ClubPositionRequest.findById(req.params.requestId);
    if (!requestDoc) return res.status(404).json({ status: false, message: 'Position request not found' });
    if (denyCampus(req, res, requestDoc.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, requestDoc.clubId, { required: true })) return;

    const permKey =
      decision === 'recommend'
        ? 'positions.recommend'
        : decision === 'reject'
          ? 'positions.assign'
          : 'positions.assign';
    if (decision === 'recommend' && !canCms(req, 'positions.recommend') && !canCms(req, 'positions.assign')) {
      return res.status(403).json({ status: false, message: 'You do not have permission to recommend a position.' });
    }
    if ((decision === 'approve' || decision === 'assign' || decision === 'reject') && !canCms(req, permKey)) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    if (decision === 'approve' || decision === 'assign') {
      if (!canCms(req, 'positions.assign')) {
        return res.status(403).json({
          status: false,
          message: 'Recommendations do not assign a position. An authorized staff member must assign it.',
        });
      }
    }

    if (!['pending', 'recommended'].includes(String(requestDoc.status || ''))) {
      return res.status(400).json({
        status: false,
        message: `This request is already ${requestDoc.status}.`,
      });
    }

    const actor = actorSnapshot(req);
    const statusMap = {
      recommend: 'recommended',
      approve: 'assigned',
      assign: 'assigned',
      reject: 'rejected',
    };
    const nextStatus = statusMap[decision] || 'rejected';

    if (decision === 'recommend') {
      requestDoc.status = 'recommended';
      requestDoc.recommendedByUserId = actor.userId;
      requestDoc.recommendedByName = actor.name;
      requestDoc.recommendedAt = actor.at;
      requestDoc.reviewedByUserId = actor.userId;
      requestDoc.reviewedByName = actor.name;
      requestDoc.reviewedAt = actor.at;
      await requestDoc.save();
      return res.json({ status: true, request: requestDoc });
    }

    if (decision === 'approve' || decision === 'assign') {
      const seatCheck = await syncPositionSeatStatus(requestDoc.positionId);
      const seats = seatCheck?.seats || 1;
      const filled = seatCheck?.filled || 0;
      if (filled >= seats) {
        return res.status(400).json({ status: false, message: 'All seats for this position are filled.' });
      }
      // Student must still be an approved club member at assign time.
      const member = await findClubMemberByIdentity(requestDoc.clubId, {
        userId: requestDoc.studentUserId,
      });
      if (!member || !isApprovedMemberStatus(member.status)) {
        return res.status(400).json({
          status: false,
          message: 'Student must be an approved club member before they can be assigned a position.',
        });
      }
      requestDoc.status = 'assigned';
      requestDoc.assignedByUserId = actor.userId;
      requestDoc.assignedByName = actor.name;
      requestDoc.assignedAt = actor.at;
      requestDoc.reviewedByUserId = actor.userId;
      requestDoc.reviewedByName = actor.name;
      requestDoc.reviewedAt = actor.at;
      await requestDoc.save();
      await syncPositionSeatStatus(requestDoc.positionId);
      return res.json({ status: true, request: requestDoc });
    }

    requestDoc.status = nextStatus;
    requestDoc.reviewedByUserId = actor.userId;
    requestDoc.reviewedByName = actor.name;
    requestDoc.reviewedAt = actor.at;
    await requestDoc.save();
    return res.json({ status: true, request: requestDoc });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 6. ACTIVITIES & ATTENDANCE
// ============================================================================
router.post('/activities', requireClubUser, async (req, res) => {
  try {
    const club = isValidObjectId(req.body.clubId) ? await Club.findById(req.body.clubId) : null;
    if (club && denyCampus(req, res, club.collegeId)) return;
    const { activeCampusId, cmsRole } = req.clubAccess;
    const actor = actorSnapshot(req);
    const isRequestOnly = !canCms(req, 'activities.create');
    if (isRequestOnly && !canCms(req, 'activities.request')) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    if (cmsRole === 'student') {
      if (!club) return res.status(400).json({ status: false, message: 'Select a club for this activity request.' });
      if (!(await isClubCaptain(req.user._id, club._id))) {
        return res.status(403).json({
          status: false,
          message: 'Only a student assigned as Club Captain can request an activity.',
        });
      }
    } else if (cmsRole !== 'student') {
      if (await denyStaffClubOpsByClubId(req, res, req.body.clubId, { required: true })) return;
    }

    const startDate = req.body.startDate || req.body.date || '';
    const endDate = req.body.endDate || startDate;
    let scheduleStatus = 'draft';
    if (isRequestOnly) scheduleStatus = 'requested';

    const activity = await ClubActivity.create({
      clubId: club?._id,
      collegeId: club?.collegeId || activeCampusId,
      inChargeId: req.body.inChargeId || '',
      title: req.body.title,
      date: startDate,
      startDate,
      endDate,
      time: req.body.time || '',
      location: req.body.location || '',
      latitude: req.body.latitude != null && req.body.latitude !== '' ? Number(req.body.latitude) : null,
      longitude: req.body.longitude != null && req.body.longitude !== '' ? Number(req.body.longitude) : null,
      placeId: req.body.placeId || '',
      mode: req.body.mode || 'In-Person',
      summary: req.body.summary || '',
      description: req.body.description || req.body.summary || '',
      featured: Boolean(req.body.featured),
      capacity: Number(req.body.capacity) || 40,
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      certificateTemplateId: resolveCertificateTemplateId(req.body.certificateTemplateId),
      scheduleStatus,
      requestedByUserId: isRequestOnly ? actor.userId : undefined,
      requestedByName: isRequestOnly ? actor.name : '',
      requestedByRole: isRequestOnly ? actor.role : '',
      requestedAt: isRequestOnly ? actor.at : '',
      scheduledByUserId: scheduleStatus === 'scheduled' ? actor.userId : undefined,
      scheduledByName: scheduleStatus === 'scheduled' ? actor.name : '',
      scheduledAt: scheduleStatus === 'scheduled' ? actor.at : '',
      registrations: [],
    });

    return res.json({ status: true, activity });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/activities/:activityId', requireClubUser, requirePermission('activities.edit'), async (req, res) => {
  try {
    const existing = await ClubActivity.findById(req.params.activityId);
    if (!existing) return res.status(404).json({ status: false, message: 'Activity not found' });
    if (denyCampus(req, res, existing.collegeId)) return;
    const targetClubId = isValidObjectId(req.body.clubId) ? req.body.clubId : existing.clubId;
    if (await denyStaffClubOpsByClubId(req, res, targetClubId, { required: true })) return;
    const startDate = req.body.startDate || req.body.date || existing.startDate || existing.date;
    const activity = await ClubActivity.findByIdAndUpdate(
      req.params.activityId,
      {
        clubId: isValidObjectId(req.body.clubId) ? req.body.clubId : existing.clubId,
        inChargeId: req.body.inChargeId,
        title: req.body.title,
        date: startDate,
        startDate,
        endDate: req.body.endDate || existing.endDate || startDate,
        time: req.body.time,
        location: req.body.location,
        latitude: req.body.latitude != null && req.body.latitude !== '' ? Number(req.body.latitude) : existing.latitude,
        longitude: req.body.longitude != null && req.body.longitude !== '' ? Number(req.body.longitude) : existing.longitude,
        placeId: req.body.placeId != null ? req.body.placeId : existing.placeId,
        mode: req.body.mode,
        summary: req.body.summary,
        description: req.body.description,
        featured: Boolean(req.body.featured),
        capacity: Number(req.body.capacity) || 40,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        certificateTemplateId: resolveCertificateTemplateId(
          req.body.certificateTemplateId || existing.certificateTemplateId
        ),
      },
      { new: true }
    );
    return res.json({ status: true, activity });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/activities/:activityId/schedule-workflow', requireClubUser, async (req, res) => {
  try {
    const activity = await ClubActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ status: false, message: 'Activity not found' });
    if (denyCampus(req, res, activity.collegeId)) return;
    if (req.clubAccess?.cmsRole !== 'student') {
      if (await denyStaffClubOpsByClubId(req, res, activity.clubId, { required: true })) return;
    }
    const { action } = req.body;
    const permKey =
      action === 'schedule' || action === 'unpublish'
        ? (canCms(req, 'activities.schedule') ? 'activities.schedule' : 'activities.approveSchedule')
        : action === 'approve'
          ? 'activities.approveSchedule'
          : action === 'recommend'
            ? 'activities.recommend'
            : 'activities.request';
    if (!canCms(req, permKey)) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    const actor = actorSnapshot(req);
    if (action === 'request') {
      activity.scheduleStatus = 'requested';
      activity.requestedByUserId = actor.userId;
      activity.requestedByName = actor.name;
      activity.requestedByRole = actor.role;
      activity.requestedAt = actor.at;
    } else if (action === 'recommend') {
      activity.scheduleStatus = 'recommended';
      activity.recommendedByUserId = actor.userId;
      activity.recommendedByName = actor.name;
      activity.recommendedAt = actor.at;
    } else if (action === 'approve') {
      activity.scheduleStatus = 'approved';
      activity.approvedByUserId = actor.userId;
      activity.approvedByName = actor.name;
      activity.approvedAt = actor.at;
    } else if (action === 'schedule') {
      activity.scheduleStatus = 'scheduled';
      activity.scheduledByUserId = actor.userId;
      activity.scheduledByName = actor.name;
      activity.scheduledAt = actor.at;
      if (!activity.approvedAt) {
        activity.approvedByUserId = actor.userId;
        activity.approvedByName = actor.name;
        activity.approvedAt = actor.at;
      }
      if (req.body.startDate) activity.startDate = req.body.startDate;
      if (req.body.endDate) activity.endDate = req.body.endDate;
      if (req.body.time) activity.time = req.body.time;
      activity.date = activity.startDate || activity.date;
    } else if (action === 'unpublish') {
      if (!canCms(req, 'activities.schedule') && !canCms(req, 'activities.approveSchedule')) {
        return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
      }
      activity.scheduleStatus = 'draft';
    } else if (action === 'reject') {
      activity.scheduleStatus = 'rejected';
    } else {
      return res.status(400).json({ status: false, message: 'Unknown schedule action.' });
    }
    await activity.save();
    return res.json({ status: true, activity });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/activities/:activityId/register', requireClubUser, requirePermission('activities.register'), async (req, res) => {
  try {
    const activity = await ClubActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ status: false, message: 'Activity not found' });
    if (await denyActivityRegistrationAccess(req, res, activity)) return;
    if (!isPublishedSchedule(activity) && req.clubAccess.cmsRole === 'student') {
      return res.status(403).json({ status: false, message: 'This activity is not scheduled yet.' });
    }
    const already = activity.registrations.some(
      (r) => String(r.studentUserId) === String(req.user._id)
    );
    if (already) {
      return res.json({ status: true, duplicate: true, activity });
    }

    const capacity = Number(activity.capacity) || 0;
    if (capacity > 0) {
      const taken = (activity.registrations || []).filter(
        (row) => row.approvalStatus !== 'rejected' && row.attendance !== 'Cancelled'
      ).length;
      if (taken >= capacity) {
        return res.status(400).json({ status: false, message: 'This activity is full.' });
      }
    }

    const isStudent = req.clubAccess.cmsRole === 'student';
    const stuState = isStudent ? await ensureStudentState(req.user) : null;
    activity.registrations.push({
      studentUserId: req.user._id,
      studentName: stuState?.name || req.user.name || 'Participant',
      studentEmail: req.user.email || '',
      registrantRole: req.clubAccess.cmsRole,
      registeredAt: todayStr(),
      attendance: 'Pending',
      approvalStatus: 'pending',
    });
    await activity.save();

    return res.json({ status: true, duplicate: false, activity });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/activities/:activityId/cancel', requireClubUser, requirePermission('activities.register'), async (req, res) => {
  try {
    const activity = await ClubActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ status: false, message: 'Activity not found' });
    if (await denyActivityRegistrationAccess(req, res, activity)) return;

    const existing = activity.registrations.find(
      (r) => String(r.studentUserId) === String(req.user._id)
    );
    if (!existing) {
      return res.json({ status: true, activity });
    }

    activity.registrations = activity.registrations.filter(
      (r) => String(r.studentUserId) !== String(req.user._id)
    );
    await activity.save();

    return res.json({ status: true, activity });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/activities/:activityId/save', requireClubUser, async (req, res) => {
  try {
    const stuState = await ensureStudentState(req.user);
    const actId = String(req.params.activityId);
    const exists = stuState.savedActivityIds.includes(actId);
    stuState.savedActivityIds = exists
      ? stuState.savedActivityIds.filter((id) => id !== actId)
      : [...stuState.savedActivityIds, actId];
    await stuState.save();
    return res.json({ status: true, saved: !exists });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post(
  '/activities/:activityId/registrations/:registrationId/attendance',
  requireClubUser,
  requirePermission('registrations.approve'),
  async (req, res) => {
    try {
      const activity = await ClubActivity.findById(req.params.activityId);
      if (!activity) return res.status(404).json({ status: false, message: 'Activity not found' });
      if (denyCampus(req, res, activity.collegeId)) return;
      if (await denyStaffClubOpsByClubId(req, res, activity.clubId, { required: true })) return;

      const reg = activity.registrations.id(req.params.registrationId);
      if (reg) {
        const actor = actorSnapshot(req);
        if (req.body.approvalStatus) {
          reg.approvalStatus = req.body.approvalStatus;
          if (req.body.approvalStatus === 'approved') {
            reg.approvedByUserId = actor.userId;
            reg.approvedByName = actor.name;
            reg.approvedAt = actor.at;
            if (!req.body.attendance) reg.attendance = 'Confirmed';
          }
        }
        if (req.body.attendance) {
          reg.attendance = req.body.attendance;
        } else if (!req.body.approvalStatus) {
          reg.attendance = 'Present';
        }
        const present = /^(present|confirmed)$/i.test(String(reg.attendance || ''));
        const shouldAward = present && !reg.pointsAwarded && reg.studentUserId;
        if (shouldAward) reg.pointsAwarded = true;
        await activity.save();
        if (shouldAward) {
          await creditStudentPoints(reg.studentUserId, ATTEND_POINTS, `Attended — ${activity.title}`);
          await awardStudentBadge(reg.studentUserId, BADGE_FIRST_EVENT);
        }
      }
      return res.json({ status: true, activity });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  }
);

// ============================================================================
// 7. STUDENT PROFILE, INTERESTS & CLUB SUGGESTIONS
// ============================================================================
router.post('/student/interests', requireClubUser, async (req, res) => {
  try {
    const { interest } = req.body;
    const stuState = await ensureStudentState(req.user);
    const exists = stuState.selectedInterests.includes(interest);
    stuState.selectedInterests = exists
      ? stuState.selectedInterests.filter((i) => i !== interest)
      : [...stuState.selectedInterests, interest];
    await stuState.save();
    return res.json({ status: true, selectedInterests: stuState.selectedInterests });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/student/profile', requireClubUser, requirePermission('profile.edit'), async (req, res) => {
  try {
    if (req.clubAccess.cmsRole === 'student') {
      const stuState = await ensureStudentState(req.user);
      if (req.body.name !== undefined) stuState.name = req.body.name;
      if (req.body.department !== undefined) stuState.department = req.body.department;
      if (req.body.bio !== undefined) stuState.bio = req.body.bio;
      await stuState.save();
      return res.json({ status: true, studentState: stuState });
    }
    if (req.body.name !== undefined) req.user.name = req.body.name;
    if (req.body.email !== undefined) req.user.email = req.body.email;
    await req.user.save();
    return res.json({
      status: true,
      profile: { name: req.user.name, email: req.user.email, role: req.clubAccess.cmsRole },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/suggestions', requireClubUser, async (req, res) => {
  try {
    const collegeId = await resolveStudentCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({ status: false, message: 'No campus is available for this club idea yet.' });
    }
    const stuState = await ensureStudentState(req.user);
    const suggestion = await ClubSuggestion.create({
      collegeId,
      studentUserId: req.user._id,
      submittedBy: stuState.name || req.user.name || 'Student',
      name: req.body.name,
      category: req.body.category || 'Creative',
      description: req.body.description || '',
      whyNeeded: req.body.whyNeeded || '',
      expectedFormat: req.body.expectedFormat || '',
      status: 'Submitted',
      submittedAt: todayStr(),
    });
    return res.json({ status: true, suggestion });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/suggestions/:suggestionId', requireClubUser, async (req, res) => {
  try {
    const suggestion = await ClubSuggestion.findById(req.params.suggestionId);
    if (!suggestion) return res.status(404).json({ status: false, message: 'Suggestion not found' });
    const isOwner = String(suggestion.studentUserId) === String(req.user._id);
    if (!isOwner && !STAFF_CMS_ROLES.includes(req.clubAccess?.cmsRole)) {
      return res.status(403).json({ status: false, message: 'You can only withdraw your own club idea.' });
    }
    if (!isOwner && denyCampus(req, res, suggestion.collegeId)) return;
    await ClubSuggestion.findByIdAndDelete(req.params.suggestionId);
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/suggestions/:suggestionId/approve', requireClubUser, requirePermission('clubs.create'), async (req, res) => {
  try {
    const suggestion = await ClubSuggestion.findById(req.params.suggestionId);
    if (!suggestion) return res.status(404).json({ status: false, message: 'Suggestion not found' });
    if (denyCampus(req, res, suggestion.collegeId)) return;

    suggestion.status = 'Approved';
    await suggestion.save();

    const club = await Club.create({
      name: suggestion.name,
      tagline: suggestion.expectedFormat || 'Student-pitched community club',
      description: `${suggestion.description} (${suggestion.whyNeeded})`,
      category: suggestion.category || 'Creative',
      collegeId: suggestion.collegeId,
      joiningMethod: 'Approval Required',
      createdByUserId: req.user._id,
      createdByRole: req.clubAccess.cmsRole,
      location: 'Student Commons Room',
      interests: [suggestion.category || 'Community'],
      featured: false,
    });

    return res.json({ status: true, suggestion, club });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 8. COMMUNITY FEED (POSTS & COMMENTS)
// ============================================================================
router.post('/posts', requireClubUser, async (req, res) => {
  try {
    const club = isValidObjectId(req.body.clubId) ? await Club.findById(req.body.clubId) : null;
    if (!club || club.isDeleted) return res.status(404).json({ status: false, message: 'Club not found' });
    if (req.clubAccess.cmsRole === 'student') {
      if (!(await isStudentClubMember(req, club._id))) {
        return res.status(403).json({ status: false, message: 'Only members of this club can post here.' });
      }
    } else {
      if (!canCms(req, 'posts.create')) {
        return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
      }
      if (denyCampus(req, res, club.collegeId)) return;
      if (denyClubStaffManage(req, res, club)) return;
    }
    const { activeCampusId } = req.clubAccess;

    const text = String(req.body.body || '').trim();
    const mediaUrl = String(req.body.mediaUrl || '').trim();
    if (!text && !mediaUrl) {
      return res.status(400).json({ status: false, message: 'Write something or add a photo.' });
    }
    if (rejectBadMediaUrl(res, mediaUrl)) return;
    const post = await ClubPost.create({
      clubId: club?._id,
      collegeId: club?.collegeId || activeCampusId,
      authorUserId: req.user._id,
      author: req.body.author || req.user.name || 'Club Member',
      title: String(req.body.title || '').trim() || (text ? text.slice(0, 80) : 'Shared a photo'),
      body: text,
      mediaType: mediaUrl ? 'photo' : 'text',
      mediaUrl,
      likes: [],
      shares: [],
      reports: [],
      comments: [],
      createdAtDate: todayStr(),
    });
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/posts/:postId', requireClubUser, async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (!(await canAccessClubPost(req, post))) {
      return res.status(403).json({ status: false, message: 'You do not have access to this post.' });
    }
    const isAuthor = String(post.authorUserId) === String(req.user._id);
    if (!isAuthor && !canCms(req, 'posts.moderate')) {
      return res.status(403).json({ status: false, message: 'You can only delete your own posts.' });
    }
    await ClubPost.findByIdAndDelete(req.params.postId);
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/posts/:postId/like', requireClubUser, requirePermission('posts.interact'), async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (!(await canAccessClubPost(req, post))) {
      return res.status(403).json({ status: false, message: 'You do not have access to this post.' });
    }

    const uid = String(req.user._id);
    const liked = post.likes.includes(uid);
    post.likes = liked ? post.likes.filter((id) => id !== uid) : [...post.likes, uid];
    await post.save();
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/posts/:postId/comments', requireClubUser, requirePermission('posts.interact'), async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (!(await canAccessClubPost(req, post))) {
      return res.status(403).json({ status: false, message: 'You do not have access to this post.' });
    }

    post.comments.push({
      authorUserId: req.user._id,
      author: req.user.name || 'Member',
      body: req.body.body,
      createdAt: todayStr(),
    });
    await post.save();
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/posts/:postId/comments/:commentId', requireClubUser, async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (!(await canAccessClubPost(req, post))) {
      return res.status(403).json({ status: false, message: 'You do not have access to this post.' });
    }
    const comment = post.comments.find((c) => String(c._id) === String(req.params.commentId));
    const isAuthor = comment && String(comment.authorUserId) === String(req.user._id);
    if (!isAuthor && !canCms(req, 'posts.moderate')) {
      return res.status(403).json({ status: false, message: 'You can only delete your own comments.' });
    }

    post.comments = post.comments.filter((c) => String(c._id) !== String(req.params.commentId));
    await post.save();
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/posts/:postId/report', requireClubUser, requirePermission('posts.interact'), async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (!(await canAccessClubPost(req, post))) {
      return res.status(403).json({ status: false, message: 'You do not have access to this post.' });
    }

    const reporter = req.user.name || String(req.user._id);
    if (!post.reports.includes(reporter)) {
      post.reports.push(reporter);
      post.reportStatus = 'open';
      await post.save();
    }
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/posts/:postId/share', requireClubUser, requirePermission('posts.interact'), async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (!(await canAccessClubPost(req, post))) {
      return res.status(403).json({ status: false, message: 'You do not have access to this post.' });
    }
    const uid = String(req.user._id);
    if (!post.shares.includes(uid)) {
      post.shares = [...(post.shares || []), uid];
      await post.save();
    }
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/posts/:postId/resolve-report', requireClubUser, requirePermission('posts.moderate'), async (req, res) => {
  try {
    const post = await ClubPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ status: false, message: 'Post not found' });
    if (denyCampus(req, res, post.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, post.clubId, { required: true })) return;
    const actor = actorSnapshot(req);
    post.reportStatus = 'resolved';
    post.resolvedByUserId = actor.userId;
    post.resolvedByName = actor.name;
    post.resolvedAt = actor.at;
    await post.save();
    return res.json({ status: true, post });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 9. ANNOUNCEMENTS & CHAT
// ============================================================================
router.post('/announcements', requireClubUser, async (req, res) => {
  try {
    const canPublish = canCms(req, 'announcements.create');
    const canRequest = canCms(req, 'announcements.request');
    if (!canPublish && !canRequest) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    const { activeCampusId } = req.clubAccess;
    const collegeId = canPublish
      ? activeCampusId
      : await resolveStudentCollegeId(req, req.body.collegeId);
    if (!collegeId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    if (canPublish && denyCampus(req, res, collegeId)) return;
    if (canPublish && (await denyStaffClubOpsByClubId(req, res, req.body.clubId, { required: needsAssignedClubScope(req) }))) {
      return;
    }
    const actor = actorSnapshot(req);
    const announcement = await ClubAnnouncement.create({
      collegeId,
      clubId: isValidObjectId(req.body.clubId) ? req.body.clubId : undefined,
      title: req.body.title,
      body: req.body.body,
      audience: req.body.audience || 'All',
      status: canPublish ? 'published' : 'pending',
      submittedByUserId: actor.userId,
      submittedByName: actor.name,
      submittedByRole: actor.role,
      submittedAt: actor.at,
      createdAtDate: todayStr(),
    });
    return res.json({ status: true, announcement });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/announcements/:announcementId/review', requireClubUser, requirePermission('announcements.create'), async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findById(req.params.announcementId);
    if (!announcement || announcement.isDeleted) {
      return res.status(404).json({ status: false, message: 'Announcement not found' });
    }
    if (denyCampus(req, res, announcement.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, announcement.clubId, { required: Boolean(announcement.clubId) })) {
      return;
    }
    const actor = actorSnapshot(req);
    announcement.status = req.body.decision === 'reject' ? 'rejected' : 'published';
    announcement.reviewedByUserId = actor.userId;
    announcement.reviewedByName = actor.name;
    announcement.reviewedAt = actor.at;
    await announcement.save();
    return res.json({ status: true, announcement });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/announcements/:announcementId', requireClubUser, requirePermission('announcements.create'), async (req, res) => {
  try {
    const announcement = await ClubAnnouncement.findById(req.params.announcementId);
    if (!announcement || announcement.isDeleted) {
      return res.status(404).json({ status: false, message: 'Announcement not found' });
    }
    if (denyCampus(req, res, announcement.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, announcement.clubId, { required: Boolean(announcement.clubId) })) {
      return;
    }
    announcement.isDeleted = true;
    await announcement.save();
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/chat', requireClubUser, requirePermission('chat.use'), async (_req, res) => {
  return res.status(403).json({
    status: false,
    message: 'Intra-club chat is not enabled in this release.',
  });
});

// ============================================================================
// 10. BUDGETS, RESULTS, CERTIFICATES, PEOPLE & REWARDS
// ============================================================================
router.post('/budgets', requireClubUser, async (req, res) => {
  try {
    const canPrepare = canCms(req, 'budgets.create');
    const canRequest = canCms(req, 'budgets.request');
    if (!canPrepare && !canRequest) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    const club = isValidObjectId(req.body.clubId) ? await Club.findById(req.body.clubId) : null;
    if (club && denyCampus(req, res, club.collegeId)) return;
    if (canPrepare && (await denyStaffClubOpsByClubId(req, res, req.body.clubId, { required: true }))) return;
    const { activeCampusId } = req.clubAccess;
    const actor = actorSnapshot(req);
    const collegeId = club?.collegeId || activeCampusId || (await resolveStudentCollegeId(req));
    if (!collegeId) {
      return res.status(403).json({ status: false, message: 'No campus is available for this budget yet.' });
    }

    if (isValidObjectId(req.body.id)) {
      if (!canPrepare) {
        return res.status(403).json({ status: false, message: 'You cannot edit a prepared budget.' });
      }
      const existing = await ClubBudget.findById(req.body.id);
      if (!existing) return res.status(404).json({ status: false, message: 'Budget not found' });
      if (denyCampus(req, res, existing.collegeId)) return;
      if (await denyStaffClubOpsByClubId(req, res, existing.clubId || req.body.clubId, { required: true })) return;
      const budget = await ClubBudget.findByIdAndUpdate(
        req.body.id,
        {
          title: req.body.title,
          amount: Number(req.body.amount) || 0,
          purpose: req.body.purpose,
          clubId: club?._id,
        },
        { new: true }
      );
      return res.json({ status: true, budget });
    }

    const budget = await ClubBudget.create({
      clubId: club?._id,
      collegeId,
      title: req.body.title,
      amount: Number(req.body.amount) || 0,
      purpose: req.body.purpose || '',
      status: canPrepare ? 'Draft' : 'Requested',
      requestedBy: canRequest && !canPrepare ? actor.name : req.body.requestedBy || '',
      recommendedBy: req.body.recommendedBy || '',
      submittedByUserId: actor.userId,
      submittedByName: actor.name,
      submittedByRole: actor.role,
      submittedAt: actor.at,
      requestedByUserId: !canPrepare ? actor.userId : undefined,
      requestedAt: !canPrepare ? actor.at : '',
      createdAtDate: todayStr(),
    });
    return res.json({ status: true, budget });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/budgets/:budgetId/workflow', requireClubUser, requireStaff, async (req, res) => {
  try {
    const { action, actorName } = req.body;
    const permKey =
      action === 'approve' ? 'budgets.approve' : action === 'recommend' ? 'budgets.recommend' : 'budgets.request';
    if (!canCms(req, permKey)) {
      return res.status(403).json({ status: false, message: 'You do not have permission for this action.' });
    }
    const statusMap = {
      request: 'Requested',
      recommend: 'Recommended',
      approve: 'Approved',
    };
    const update = { status: statusMap[action] || 'Requested' };
    if (action === 'request') update.requestedBy = actorName || req.user.name;
    if (action === 'recommend') update.recommendedBy = actorName || req.user.name;

    const existingBudget = await ClubBudget.findById(req.params.budgetId);
    if (!existingBudget) return res.status(404).json({ status: false, message: 'Budget not found' });
    if (denyCampus(req, res, existingBudget.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, existingBudget.clubId, { required: true })) return;
    const actor = actorSnapshot(req);
    if (action === 'request') {
      update.requestedByUserId = actor.userId;
      update.requestedAt = actor.at;
    }
    if (action === 'recommend') {
      update.recommendedByUserId = actor.userId;
      update.recommendedAt = actor.at;
    }
    if (action === 'approve') {
      update.approvedByUserId = actor.userId;
      update.approvedByName = actor.name;
      update.approvedAt = actor.at;
    }

    const budget = await ClubBudget.findByIdAndUpdate(req.params.budgetId, update, { new: true });
    return res.json({ status: true, budget });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/results', requireClubUser, requirePermission('results.declare'), async (req, res) => {
  try {
    const club = isValidObjectId(req.body.clubId) ? await Club.findById(req.body.clubId) : null;
    if (club && denyCampus(req, res, club.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, req.body.clubId, { required: true })) return;
    const { activeCampusId } = req.clubAccess;

    const actor = actorSnapshot(req);
    const resultDoc = await ClubResult.create({
      clubId: club?._id,
      collegeId: club?.collegeId || activeCampusId,
      activityId: req.body.activityId || '',
      title: req.body.title,
      summary: req.body.summary || '',
      winners: req.body.winners || '',
      status: 'Published',
      declaredAt: todayStr(),
      declaredByUserId: actor.userId,
      declaredByName: actor.name,
      declaredByRole: actor.role,
    });
    return res.json({ status: true, result: resultDoc });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/certificates', requireClubUser, requirePermission('certificates.generate'), async (req, res) => {
  try {
    if (!String(req.body.title || '').trim()) {
      return res.status(400).json({ status: false, message: 'Certificate title is required.' });
    }
    if (!isValidObjectId(req.body.studentId)) {
      return res.status(400).json({ status: false, message: 'Select a campus student so the certificate appears in their Club page.' });
    }
    const club = isValidObjectId(req.body.clubId) ? await Club.findById(req.body.clubId) : null;
    if (club && denyCampus(req, res, club.collegeId)) return;
    if (await denyStaffClubOpsByClubId(req, res, req.body.clubId, { required: true })) return;
    const { activeCampusId } = req.clubAccess;

    let activityDoc = null;
    if (isValidObjectId(req.body.activityId)) {
      activityDoc = await ClubActivity.findById(req.body.activityId).select('title certificateTemplateId').lean();
    }
    const templateId = resolveCertificateTemplateId(
      req.body.templateId || activityDoc?.certificateTemplateId
    );
    const cert = await ClubCertificate.create({
      clubId: club?._id,
      collegeId: club?.collegeId || activeCampusId,
      activityId: req.body.activityId || '',
      studentUserId: req.body.studentId,
      studentName: req.body.studentName || 'Student',
      title: String(req.body.title).trim(),
      templateId,
      status: 'Issued',
      issuedAt: todayStr(),
    });

    const activityName = req.body.activityTitle || activityDoc?.title || '';

    try {
      const pdf = await renderCertificatePdf({
        title: cert.title,
        studentName: cert.studentName,
        issuedAt: cert.issuedAt,
        clubName: club?.name,
        activityName,
        templateId,
        certificateId: cert._id,
        serial: certificateSerial(cert._id),
      });
      const fileKey = `club-certificates/${cert._id}.pdf`;
      const uploaded = await objectStorage.upload({
        Key: fileKey,
        Body: pdf,
        ContentType: 'application/pdf',
      }).promise();
      cert.fileKey = uploaded.Key || fileKey;
      cert.fileUrl = uploaded.Location || objectStorage.buildPublicUrl(fileKey);
      await cert.save();
    } catch (pdfErr) {
      console.error('Could not store club certificate PDF:', pdfErr.message);
    }

    return res.json({ status: true, certificate: cert });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.get('/certificates/:certificateId/file', requireClubUser, async (req, res) => {
  try {
    const cert = await ClubCertificate.findById(req.params.certificateId);
    if (!cert) return res.status(404).json({ status: false, message: 'Certificate not found' });
    if (req.clubAccess.cmsRole === 'student') {
      if (String(cert.studentUserId) !== String(req.user._id)) {
        return res.status(403).json({ status: false, message: 'You can only download your own certificates.' });
      }
    } else if (denyCampus(req, res, cert.collegeId)) {
      return;
    }

    const templateId = resolveCertificateTemplateId(req.query.templateId || cert.templateId);
    const useStoredFile = Boolean(cert.fileKey) && !req.query.templateId;

    let pdfBuffer = null;
    if (useStoredFile) {
      try {
        const stored = await objectStorage.getObject({ Key: cert.fileKey }).promise();
        pdfBuffer = stored?.Body;
      } catch (err) {
        console.error('Certificate file missing from storage:', err.message);
      }
    }
    if (!pdfBuffer) {
      const club = cert.clubId ? await Club.findById(cert.clubId).select('name').lean() : null;
      let activityName = '';
      if (isValidObjectId(cert.activityId)) {
        const activity = await ClubActivity.findById(cert.activityId).select('title').lean();
        activityName = activity?.title || '';
      }
      pdfBuffer = await renderCertificatePdf({
        title: cert.title,
        studentName: cert.studentName,
        issuedAt: cert.issuedAt,
        clubName: club?.name,
        activityName,
        templateId,
        certificateId: cert._id,
      });
    }

    const filename = `${String(cert.title || 'club-certificate').replace(/[^\w.-]+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/people', requireClubUser, requireStaff, async (_req, res) => {
  return res.status(403).json({
    status: false,
    message: 'People cannot be created from Club. Add Institute users in Access Management, and students join from Candidate Club.',
  });
});

router.post('/badges', requireClubUser, requirePermission('rewards.manage'), async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    if (!activeCampusId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    if (!String(req.body.name || '').trim()) {
      return res.status(400).json({ status: false, message: 'Badge name is required.' });
    }
    if (isValidObjectId(req.body.id)) {
      const existing = await ClubBadge.findById(req.body.id);
      if (!existing || existing.isDeleted) return res.status(404).json({ status: false, message: 'Badge not found' });
      if (denyCampus(req, res, existing.collegeId)) return;
      existing.name = req.body.name || existing.name;
      existing.description = req.body.description || existing.description;
      existing.icon = req.body.icon || existing.icon;
      if (req.body.logoUrl !== undefined) existing.logoUrl = req.body.logoUrl;
      existing.code = req.body.code || existing.code;
      if (req.body.audience) existing.audience = req.body.audience;
      await existing.save();
      return res.json({ status: true, badge: existing });
    }
    const badge = await ClubBadge.create({
      collegeId: activeCampusId,
      name: String(req.body.name).trim(),
      description: req.body.description || '',
      icon: req.body.icon || 'crest',
      logoUrl: req.body.logoUrl || '',
      code: req.body.code || String(req.body.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32),
      audience: ['student', 'institute', 'both'].includes(req.body.audience) ? req.body.audience : 'student',
    });
    return res.json({ status: true, badge });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/badges/:badgeId/award', requireClubUser, requirePermission('rewards.process'), async (req, res) => {
  try {
    const badge = await ClubBadge.findById(req.params.badgeId);
    if (!badge || badge.isDeleted) return res.status(404).json({ status: false, message: 'Badge not found' });
    if (denyCampus(req, res, badge.collegeId)) return;
    if (!isValidObjectId(req.body.studentId)) {
      return res.status(400).json({ status: false, message: 'Select a student to award this badge.' });
    }
    const student = await User.findById(req.body.studentId).select('_id name').lean();
    if (!student) return res.status(404).json({ status: false, message: 'Student not found' });
    const tokens = [badge.code, String(badge._id)].filter(Boolean);
    await ClubStudentState.findOneAndUpdate(
      { studentUserId: student._id },
      {
        $addToSet: { badgesEarned: { $each: tokens } },
        $setOnInsert: {
          name: student.name || 'Student',
          department: 'Campus Student',
          year: 'Active',
          points: 0,
        },
      },
      { upsert: true }
    );
    return res.json({ status: true, badge, studentId: String(student._id) });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/goodies', requireClubUser, requirePermission('rewards.manage'), async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    if (!activeCampusId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    if (!String(req.body.name || '').trim()) {
      return res.status(400).json({ status: false, message: 'Gift name is required.' });
    }
    if (isValidObjectId(req.body.id)) {
      const existing = await ClubGoodie.findById(req.body.id);
      if (!existing || existing.isDeleted) return res.status(404).json({ status: false, message: 'Gift not found' });
      if (denyCampus(req, res, existing.collegeId)) return;
      existing.name = req.body.name || existing.name;
      existing.points = Number(req.body.points) || existing.points;
      existing.stock = req.body.stock != null ? Number(req.body.stock) : existing.stock;
      existing.category = req.body.category || existing.category;
      if (req.body.audience) existing.audience = req.body.audience;
      await existing.save();
      return res.json({ status: true, goodie: existing });
    }
    const goodie = await ClubGoodie.create({
      collegeId: activeCampusId,
      name: String(req.body.name).trim(),
      points: Number(req.body.points) || 0,
      stock: Number(req.body.stock) || 0,
      category: req.body.category || 'Merch',
      audience: ['student', 'institute', 'both'].includes(req.body.audience) ? req.body.audience : 'student',
    });
    return res.json({ status: true, goodie });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/goodies/:goodieId', requireClubUser, requirePermission('rewards.manage'), async (req, res) => {
  try {
    const goodie = await ClubGoodie.findById(req.params.goodieId);
    if (!goodie) return res.status(404).json({ status: false, message: 'Gift not found' });
    if (denyCampus(req, res, goodie.collegeId)) return;
    goodie.isDeleted = true;
    await goodie.save();
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/faqs', requireClubUser, requirePermission('faq.manage'), async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    if (!activeCampusId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    if (!String(req.body.question || '').trim() || !String(req.body.answer || '').trim()) {
      return res.status(400).json({ status: false, message: 'FAQ question and answer are required.' });
    }
    if (isValidObjectId(req.body.id)) {
      const existing = await ClubFaq.findById(req.body.id);
      if (!existing || existing.isDeleted) return res.status(404).json({ status: false, message: 'FAQ not found' });
      if (denyCampus(req, res, existing.collegeId)) return;
      existing.question = req.body.question || existing.question;
      existing.answer = req.body.answer || existing.answer;
      if (req.body.sortOrder != null) existing.sortOrder = Number(req.body.sortOrder);
      await existing.save();
      return res.json({ status: true, faq: existing });
    }
    const faq = await ClubFaq.create({
      collegeId: activeCampusId,
      question: String(req.body.question).trim(),
      answer: String(req.body.answer).trim(),
      sortOrder: Number(req.body.sortOrder) || 0,
    });
    return res.json({ status: true, faq });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.delete('/faqs/:faqId', requireClubUser, requirePermission('faq.manage'), async (req, res) => {
  try {
    const faq = await ClubFaq.findById(req.params.faqId);
    if (!faq) return res.status(404).json({ status: false, message: 'FAQ not found' });
    if (denyCampus(req, res, faq.collegeId)) return;
    faq.isDeleted = true;
    await faq.save();
    return res.json({ status: true });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/redemptions', requireClubUser, requirePermission('rewards.redeem'), async (req, res) => {
  try {
    if (req.clubAccess.cmsRole !== 'student') {
      return res.status(403).json({ status: false, message: 'Only students can request a gift with Club points.' });
    }
    const goodieId = req.body.id || req.body.goodieId;
    const fallbackCollegeId = await resolveStudentCollegeId(req);
    const goodie = isValidObjectId(goodieId)
      ? await ClubGoodie.findById(goodieId)
      : await ClubGoodie.findOne({
          collegeId: fallbackCollegeId,
          name: req.body.name,
          isDeleted: { $ne: true },
        });
    if (!goodie || goodie.isDeleted) {
      return res.status(404).json({ status: false, message: 'Gift not found' });
    }
    if (denyCampus(req, res, goodie.collegeId)) return;
    if (goodie.audience && goodie.audience !== 'both' && goodie.audience !== 'student') {
      return res.status(403).json({ status: false, message: 'This gift is not available to students.' });
    }
    const collegeId = String(goodie.collegeId || fallbackCollegeId || '');
    if (!collegeId) {
      return res.status(403).json({ status: false, message: 'No campus is available for this reward yet.' });
    }
    if ((goodie.stock || 0) < 1) {
      return res.status(400).json({ status: false, message: `${goodie.name} is out of stock.` });
    }

    const cost = Number(goodie.points) || 0;
    const duplicate = await ClubRedemption.findOne({
      goodieId: String(goodie._id),
      studentUserId: req.user._id,
      status: 'Pending',
    });
    if (duplicate) {
      return res.json({ status: false, message: 'You already have a pending request for this gift.', redemption: duplicate });
    }

    const stuState = await ensureStudentState(req.user);
    const reserved = await pendingRedemptionCost(req.user._id);
    if ((stuState.points || 0) - reserved < cost) {
      return res.status(400).json({
        status: false,
        message: `You need ${cost} available points to request ${goodie.name}.`,
      });
    }

    const actor = actorSnapshot(req);
    const redemption = await ClubRedemption.create({
      collegeId,
      studentUserId: req.user._id,
      studentName: actor.name,
      goodieId: String(goodie._id),
      goodieName: goodie.name,
      points: cost,
      recipientType: 'student',
      status: 'Pending',
      requestedAt: todayStr(),
    });
    goodie.stock = Math.max(0, Number(goodie.stock) - 1);
    await goodie.save();

    return res.json({ status: true, redemption });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/redemptions/:redemptionId/review', requireClubUser, requirePermission('rewards.process'), async (req, res) => {
  try {
    const { decision } = req.body;
    const redemption = await ClubRedemption.findById(req.params.redemptionId);
    if (!redemption) return res.status(404).json({ status: false, message: 'Redemption not found' });
    if (denyCampus(req, res, redemption.collegeId)) return;
    if (redemption.status !== 'Pending') {
      return res.json({ status: true, redemption, duplicate: true });
    }

    const actor = actorSnapshot(req);
    const restoreStock = async () => {
      if (!isValidObjectId(redemption.goodieId)) return;
      await ClubGoodie.updateOne({ _id: redemption.goodieId, isDeleted: { $ne: true } }, { $inc: { stock: 1 } });
    };

    if (decision === 'approve') {
      const cost = Number(redemption.points) || 0;
      const stuState = redemption.studentUserId
        ? await ClubStudentState.findOne({ studentUserId: redemption.studentUserId })
        : null;
      if (!stuState || (stuState.points || 0) < cost) {
        return res.status(400).json({
          status: false,
          message: 'This student does not have enough points yet. Keep the request pending or reject it.',
        });
      }
      stuState.points -= cost;
      stuState.pointsLedger.unshift({
        label: `Redeemed ${redemption.goodieName}`,
        points: -cost,
        at: todayStr(),
      });
      await stuState.save();
      redemption.status = 'Approved';
    } else {
      await restoreStock();
      redemption.status = 'Rejected';
    }
    redemption.processedByUserId = actor.userId;
    redemption.processedByName = actor.name;
    redemption.processedAt = actor.at;
    await redemption.save();
    return res.json({ status: true, redemption });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.put('/campuses/:collegeId/settings/rewards', requireClubUser, requirePermission('rewards.manage'), async (req, res) => {
  try {
    if (denyCampus(req, res, req.params.collegeId)) return;
    const { collegeId } = req.params;
    const update = {};
    if (req.body.institutePoints != null) update.institutePoints = Number(req.body.institutePoints) || 0;
    if (req.body.rewardPointRules) update.rewardPointRules = req.body.rewardPointRules;
    const setting = await ClubCampusSetting.findOneAndUpdate(
      { collegeId },
      { $set: update },
      { upsert: true, new: true }
    );
    return res.json({ status: true, setting });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/notification-templates', requireClubUser, requirePermission('notifications.configure'), async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    if (!activeCampusId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    const actor = actorSnapshot(req);
    const template = await ClubNotificationTemplate.create({
      collegeId: activeCampusId,
      type: req.body.type === 'promotional' ? 'promotional' : 'participation',
      title: req.body.title,
      body: req.body.body || '',
      enabled: req.body.enabled !== false,
      createdByUserId: actor.userId,
      createdByName: actor.name,
    });
    return res.json({ status: true, template });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/notifications/send', requireClubUser, requirePermission('notifications.send'), async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    if (!activeCampusId) {
      return res.status(403).json({ status: false, message: 'No campus is assigned to you.' });
    }
    let title = req.body.title;
    let body = req.body.body || '';
    let type = req.body.type === 'promotional' ? 'promotional' : 'participation';
    if (isValidObjectId(req.body.templateId)) {
      const template = await ClubNotificationTemplate.findById(req.body.templateId);
      if (!template || !template.enabled) {
        return res.status(404).json({ status: false, message: 'Notification template not found or disabled.' });
      }
      if (denyCampus(req, res, template.collegeId)) return;
      title = template.title;
      body = template.body;
      type = template.type;
    }
    if (!title) {
      return res.status(400).json({ status: false, message: 'Notification title is required.' });
    }
    const actor = actorSnapshot(req);
    const recipientRoles = ['sales_engineer', 'institute', 'student'];
    const created = await ClubNotification.insertMany(
      recipientRoles.map((role) => ({
        collegeId: activeCampusId,
        role,
        type,
        title,
        body,
        createdByUserId: actor.userId,
        sentByUserId: actor.userId,
        sentByName: actor.name,
        createdAtDate: todayStr(),
      }))
    );
    return res.json({ status: true, notifications: created });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

router.post('/achievements', requireClubUser, requirePermission('achievements.share'), async (req, res) => {
  try {
    const { activeCampusId } = req.clubAccess;
    const result = isValidObjectId(req.body.resultId) ? await ClubResult.findById(req.body.resultId) : null;
    const certificate = isValidObjectId(req.body.certificateId)
      ? await ClubCertificate.findById(req.body.certificateId)
      : null;
    if (!result && !certificate) {
      return res.status(400).json({ status: false, message: 'Select a result or certificate you are authorized to share.' });
    }
    const collegeId = result?.collegeId || certificate?.collegeId || activeCampusId;
    if (denyCampus(req, res, collegeId)) return;
    if (req.clubAccess.cmsRole === 'student') {
      if (certificate && String(certificate.studentUserId) !== String(req.user._id)) {
        return res.status(403).json({ status: false, message: 'You can only share your own certificates.' });
      }
    }
    const actor = actorSnapshot(req);
    const card = await ClubAchievementCard.create({
      collegeId,
      clubId: result?.clubId || certificate?.clubId,
      resultId: result?._id,
      certificateId: certificate?._id,
      createdByUserId: actor.userId,
      createdByName: actor.name,
      createdByRole: actor.role,
      title: req.body.title || result?.title || certificate?.title || 'Achievement',
      summary: req.body.summary || result?.summary || '',
      sharedAt: todayStr(),
    });
    return res.json({ status: true, achievement: card });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// ============================================================================
// 11. CLUB ADMIN & COMPANY STAFF ASSIGNMENT ROUTES
// ============================================================================
const searchUsersHandler = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = { isDeleted: { $ne: true }, role: 1 };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .select('_id name email mobile role')
      .limit(25)
      .lean();
    return res.json({ status: true, users });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const listStaffHandler = async (req, res) => {
  try {
    const assignedIds = (req.clubAccess?.campuses || []).map((campus) => String(campus._id));
    if (req.query.collegeId) {
      if (denyCampus(req, res, req.query.collegeId)) return;
    }
    const filter = req.query.collegeId
      ? { collegeId: req.query.collegeId }
      : assignedIds.length
        ? { collegeId: { $in: assignedIds } }
        : { collegeId: null };
    const list = await ClubStaffAssignment.find(filter)
      .populate('userId', 'name email mobile role')
      .populate('collegeId', 'name')
      .lean();
    return res.json({ status: true, staff: list });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const assignStaffHandler = async (req, res) => {
  try {
    const { userId, collegeId, staffRole, permissions } = req.body;
    if (denyCampus(req, res, collegeId)) return;
    const companyUser = await User.findOne({ _id: userId, role: 1, isDeleted: { $ne: true } }).select('_id');
    if (!companyUser) {
      return res.status(400).json({ status: false, message: 'Assign only a company user to SSE / SE.' });
    }
    const doc = await ClubStaffAssignment.findOneAndUpdate(
      { userId, collegeId },
      { $set: { staffRole: staffRole || 'sse', permissions: permissions || {} } },
      { upsert: true, new: true }
    );
    return res.json({ status: true, assignment: doc });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const updatePermissionsHandler = async (req, res) => {
  try {
    const { userId, collegeId, permissions } = req.body;
    if (denyCampus(req, res, collegeId)) return;
    const doc = await ClubStaffAssignment.findOneAndUpdate(
      { userId, collegeId },
      { $set: { permissions: permissions || {} } },
      { new: true }
    );
    return res.json({ status: true, assignment: doc });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

clubAdminRouter.get('/company-users', requireClubUser, requirePermission('staff.assign'), searchUsersHandler);
clubAdminRouter.get('/staff', requireClubUser, requirePermission('staff.assign'), listStaffHandler);
clubAdminRouter.post('/staff', requireClubUser, requirePermission('staff.assign'), assignStaffHandler);
clubAdminRouter.post('/staff/permissions', requireClubUser, requirePermission('staff.assign'), updatePermissionsHandler);

companyClubStaffRouter.get('/colleges', requireClubUser, requireStaff, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const assignedIds = (req.clubAccess.campuses || []).map((c) => c._id);
    const filter = { _id: { $in: assignedIds }, isDeleted: { $ne: true } };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const colleges = await College.find(filter).select('_id name place').limit(30).lean();
    return res.json({ status: true, colleges });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});
companyClubStaffRouter.get('/users', requireClubUser, requireStaff, searchUsersHandler);
companyClubStaffRouter.get('/list', requireClubUser, requireStaff, listStaffHandler);
companyClubStaffRouter.post('/assign', requireClubUser, requirePermission('staff.assign'), assignStaffHandler);
companyClubStaffRouter.post('/permissions', requireClubUser, requirePermission('staff.assign'), updatePermissionsHandler);

module.exports = {
  clubCmsRoutes: router,
  clubAdminStaffRoutes: clubAdminRouter,
  companyClubStaffRoutes: companyClubStaffRouter,
};
