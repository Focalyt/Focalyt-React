const CMS_ROLE_BY_FLAG = {
  can_be_club_admin: 'club_admin',
  can_be_club_sse: 'senior_sales_engineer',
  can_be_club_se: 'sales_engineer',
};

const CLUB_ROLE_FLAGS = Object.keys(CMS_ROLE_BY_FLAG);

const CLUB_ASSIGNABLE_KEYS = [
  'analytics.view',
  'clubs.view',
  'clubs.create',
  'clubs.edit',
  'clubs.request',
  'clubs.recommend',
  'members.view',
  'members.add',
  'members.approve',
  'members.reject',
  'members.block',
  'positions.view',
  'positions.create',
  'positions.assign',
  'positions.recommend',
  'positions.manageFeature',
  'activities.view',
  'activities.create',
  'activities.edit',
  'activities.request',
  'activities.recommend',
  'activities.schedule',
  'activities.approveSchedule',
  'activities.register',
  'registrations.view',
  'registrations.approve',
  'budgets.view',
  'budgets.create',
  'budgets.request',
  'budgets.recommend',
  'budgets.approve',
  'results.view',
  'results.declare',
  'certificates.view',
  'certificates.generate',
  'certificates.download',
  'achievements.share',
  'rewards.view',
  'rewards.manage',
  'rewards.redeem',
  'rewards.process',
  'posts.view',
  'posts.create',
  'posts.moderate',
  'posts.interact',
  'announcements.view',
  'announcements.create',
  'notifications.view',
  'notifications.configure',
  'notifications.send',
  'profile.view',
  'profile.edit',
  'faq.view',
  'faq.manage',
  'settings.manage',
  'staff.assign',
];

const CMS_PERMISSIONS = {
  'analytics.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'clubs.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'clubs.create': ['club_admin', 'senior_sales_engineer'],
  'clubs.edit': ['club_admin', 'senior_sales_engineer'],
  'clubs.request': ['sales_engineer', 'institute'],
  'clubs.recommend': ['senior_sales_engineer', 'institute'],
  'members.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'members.add': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'members.approve': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'members.reject': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'members.block': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'positions.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'positions.create': ['club_admin'],
  'positions.assign': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'positions.recommend': ['institute'],
  'positions.manageFeature': ['club_admin'],
  'activities.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'activities.create': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'activities.edit': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'activities.request': ['institute', 'student'],
  'activities.recommend': ['club_admin', 'sales_engineer'],
  'activities.schedule': ['club_admin', 'senior_sales_engineer'],
  'activities.approveSchedule': ['club_admin', 'senior_sales_engineer'],
  'activities.register': ['club_admin', 'senior_sales_engineer', 'student'],
  'registrations.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'registrations.approve': ['club_admin', 'senior_sales_engineer'],
  'budgets.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'budgets.create': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'budgets.request': ['institute', 'student'],
  'budgets.recommend': ['institute'],
  'budgets.approve': ['club_admin', 'senior_sales_engineer'],
  'results.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'results.declare': ['club_admin', 'senior_sales_engineer', 'sales_engineer'],
  'certificates.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'certificates.generate': ['club_admin', 'senior_sales_engineer'],
  'certificates.download': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'achievements.share': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'rewards.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'rewards.manage': ['club_admin'],
  'rewards.redeem': ['student', 'institute'],
  'rewards.process': ['club_admin', 'senior_sales_engineer'],
  'posts.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'posts.create': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'posts.moderate': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'posts.interact': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'announcements.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'announcements.create': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute'],
  'notifications.view': ['club_admin', 'senior_sales_engineer'],
  'notifications.configure': ['club_admin'],
  'notifications.send': ['senior_sales_engineer'],
  'profile.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'profile.edit': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'faq.view': ['club_admin', 'senior_sales_engineer', 'sales_engineer', 'institute', 'student'],
  'faq.manage': ['club_admin'],
  'settings.manage': ['club_admin'],
  'staff.assign': ['club_admin'],
};

function cmsRoleFromFlags(custom = {}) {
  if (custom.can_be_club_admin) return 'club_admin';
  if (custom.can_be_club_sse) return 'senior_sales_engineer';
  if (custom.can_be_club_se) return 'sales_engineer';
  return null;
}

function clubPermissionsToMap(saved) {
  const map = {};
  if (Array.isArray(saved)) {
    saved.forEach((row) => {
      if (row && row.key) map[row.key] = Boolean(row.allowed);
    });
    return map;
  }
  if (saved && typeof saved === 'object') {
    Object.keys(saved).forEach((key) => {
      map[key] = Boolean(saved[key]);
    });
  }
  return map;
}

function defaultsForCmsRole(cmsRole) {
  const defaults = {};
  CLUB_ASSIGNABLE_KEYS.forEach((key) => {
    const allowed = CMS_PERMISSIONS[key] || [];
    defaults[key] = Array.isArray(allowed) && allowed.includes(cmsRole);
  });
  return defaults;
}

function mergeClubPermissions(saved, cmsRole) {
  if (!cmsRole) return {};
  const defaults = defaultsForCmsRole(cmsRole);
  const incoming = clubPermissionsToMap(saved);
  const next = { ...defaults };
  CLUB_ASSIGNABLE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) {
      next[key] = Boolean(incoming[key]);
    }
  });
  return next;
}

function toStoredClubPermissions(map) {
  return CLUB_ASSIGNABLE_KEYS.map((key) => ({
    key,
    allowed: Boolean(map && map[key]),
  }));
}

function cloneStoredClubPermissions(saved) {
  const map = clubPermissionsToMap(saved);
  if (!Object.keys(map).length) return [];
  return toStoredClubPermissions(map);
}

function sanitizeSavedClubPermissions(incoming, cmsRole) {
  if (!cmsRole) return [];
  return toStoredClubPermissions(mergeClubPermissions(incoming, cmsRole));
}

function clubAccessWouldChange(incoming = {}, previous = {}) {
  const flagsChanged = CLUB_ROLE_FLAGS.some(
    (flag) => Boolean(incoming[flag]) !== Boolean(previous[flag])
  );
  if (flagsChanged) return true;
  if (incoming.club_permissions == null) return false;
  const nextMap = mergeClubPermissions(incoming.club_permissions, cmsRoleFromFlags(incoming) || cmsRoleFromFlags(previous));
  const prevMap = mergeClubPermissions(previous.club_permissions, cmsRoleFromFlags(previous));
  return CLUB_ASSIGNABLE_KEYS.some((key) => Boolean(nextMap[key]) !== Boolean(prevMap[key]));
}

function presentClubPermissions(custom = {}) {
  const raw = custom && typeof custom.toObject === 'function' ? custom.toObject() : { ...(custom || {}) };
  if (raw.club_permissions != null) {
    raw.club_permissions = clubPermissionsToMap(raw.club_permissions);
  }
  return raw;
}

module.exports = {
  CMS_ROLE_BY_FLAG,
  CLUB_ROLE_FLAGS,
  CLUB_ASSIGNABLE_KEYS,
  CMS_PERMISSIONS,
  cmsRoleFromFlags,
  clubPermissionsToMap,
  defaultsForCmsRole,
  mergeClubPermissions,
  toStoredClubPermissions,
  cloneStoredClubPermissions,
  sanitizeSavedClubPermissions,
  clubAccessWouldChange,
  presentClubPermissions,
};
