import { PERMISSION_MATRIX } from './permissions';
import { ROLES } from './roles';

export const CLUB_ROLE_OPTIONS = [
  { flag: 'can_be_club_admin', cmsRole: 'club_admin', matrixRole: ROLES.CLUB_ADMIN, label: 'Club Administrator' },
  { flag: 'can_be_club_sse', cmsRole: 'senior_sales_engineer', matrixRole: ROLES.SENIOR_SALES_ENGINEER, label: 'Senior Sales Engineer (SSE)' },
  { flag: 'can_be_club_se', cmsRole: 'sales_engineer', matrixRole: ROLES.SALES_ENGINEER, label: 'Sales Engineer (SE)' },
];

export const CLUB_ASSIGNABLE_PERMISSIONS = [
  { key: 'analytics.view', label: 'View dashboard' },
  { key: 'clubs.view', label: 'View clubs' },
  { key: 'clubs.create', label: 'Create club' },
  { key: 'clubs.edit', label: 'Edit club' },
  { key: 'clubs.request', label: 'Request club' },
  { key: 'clubs.recommend', label: 'Recommend club' },
  { key: 'members.view', label: 'View members & requests' },
  { key: 'members.add', label: 'Add member' },
  { key: 'members.approve', label: 'Approve join' },
  { key: 'members.reject', label: 'Reject join' },
  { key: 'members.block', label: 'Block member' },
  { key: 'positions.view', label: 'View positions' },
  { key: 'positions.create', label: 'Create position' },
  { key: 'positions.assign', label: 'Assign position' },
  { key: 'positions.recommend', label: 'Recommend position' },
  { key: 'positions.manageFeature', label: 'Manage positions' },
  { key: 'activities.view', label: 'View activities' },
  { key: 'activities.create', label: 'Create activity' },
  { key: 'activities.edit', label: 'Edit activity' },
  { key: 'activities.request', label: 'Request activity' },
  { key: 'activities.recommend', label: 'Recommend activity' },
  { key: 'activities.schedule', label: 'Schedule activity' },
  { key: 'activities.approveSchedule', label: 'Approve activity schedule' },
  { key: 'activities.register', label: 'Register for activity' },
  { key: 'registrations.view', label: 'View registrations' },
  { key: 'registrations.approve', label: 'Approve registration' },
  { key: 'budgets.view', label: 'View budgets' },
  { key: 'budgets.create', label: 'Create budget' },
  { key: 'budgets.request', label: 'Request budget' },
  { key: 'budgets.recommend', label: 'Recommend budget' },
  { key: 'budgets.approve', label: 'Approve budget' },
  { key: 'results.view', label: 'View results' },
  { key: 'results.declare', label: 'Declare result' },
  { key: 'certificates.view', label: 'View certificates' },
  { key: 'certificates.generate', label: 'Generate certificate' },
  { key: 'certificates.download', label: 'Download certificate' },
  { key: 'achievements.share', label: 'Share achievement' },
  { key: 'rewards.view', label: 'View rewards' },
  { key: 'rewards.manage', label: 'Manage rewards catalog' },
  { key: 'rewards.redeem', label: 'Redeem rewards' },
  { key: 'rewards.process', label: 'Process reward requests' },
  { key: 'posts.view', label: 'View posts' },
  { key: 'posts.create', label: 'Create post' },
  { key: 'posts.moderate', label: 'Moderate posts' },
  { key: 'posts.interact', label: 'Interact with posts' },
  { key: 'announcements.view', label: 'View announcements' },
  { key: 'announcements.create', label: 'Create announcement' },
  { key: 'notifications.view', label: 'View notifications' },
  { key: 'notifications.configure', label: 'Configure notifications' },
  { key: 'notifications.send', label: 'Send notifications' },
  { key: 'profile.view', label: 'View profile' },
  { key: 'profile.edit', label: 'Edit profile' },
  { key: 'faq.view', label: 'View FAQ' },
  { key: 'faq.manage', label: 'Manage FAQ' },
  { key: 'settings.manage', label: 'Manage club settings' },
  { key: 'staff.assign', label: 'Assign club staff' },
];

export const CLUB_PERMISSION_GROUPS = [
  { id: 'dashboard', title: 'Dashboard', keys: ['analytics.view'] },
  { id: 'clubs', title: 'Clubs', keys: ['clubs.view', 'clubs.create', 'clubs.edit', 'clubs.request', 'clubs.recommend'] },
  { id: 'members', title: 'Members', keys: ['members.view', 'members.add', 'members.approve', 'members.reject', 'members.block'] },
  { id: 'positions', title: 'Positions', keys: ['positions.view', 'positions.create', 'positions.assign', 'positions.recommend', 'positions.manageFeature'] },
  { id: 'activities', title: 'Activities', keys: ['activities.view', 'activities.create', 'activities.edit', 'activities.request', 'activities.recommend', 'activities.schedule', 'activities.approveSchedule', 'activities.register'] },
  { id: 'registrations', title: 'Registrations', keys: ['registrations.view', 'registrations.approve'] },
  { id: 'budgets', title: 'Budgets', keys: ['budgets.view', 'budgets.create', 'budgets.request', 'budgets.recommend', 'budgets.approve'] },
  { id: 'results', title: 'Results', keys: ['results.view', 'results.declare'] },
  { id: 'certificates', title: 'Certificates', keys: ['certificates.view', 'certificates.generate', 'certificates.download', 'achievements.share'] },
  { id: 'rewards', title: 'Rewards', keys: ['rewards.view', 'rewards.manage', 'rewards.redeem', 'rewards.process'] },
  { id: 'posts', title: 'Posts', keys: ['posts.view', 'posts.create', 'posts.moderate', 'posts.interact'] },
  { id: 'announcements', title: 'Announcements', keys: ['announcements.view', 'announcements.create'] },
  { id: 'notifications', title: 'Notifications', keys: ['notifications.view', 'notifications.configure', 'notifications.send'] },
  { id: 'profile', title: 'Profile', keys: ['profile.view', 'profile.edit'] },
  { id: 'faq', title: 'FAQ', keys: ['faq.view', 'faq.manage'] },
  { id: 'settings', title: 'Settings', keys: ['settings.manage', 'staff.assign'] },
];

export const CLUB_ASSIGNABLE_KEYS = CLUB_ASSIGNABLE_PERMISSIONS.map((item) => item.key);

export const CLUB_NAV_PERMISSION = {
  dashboard: 'analytics.view',
  clubs: 'clubs.view',
  members: 'members.view',
  positions: 'positions.view',
  activities: 'activities.view',
  registrations: 'registrations.view',
  budgets: 'budgets.view',
  results: 'results.view',
  certificates: 'certificates.view',
  rewards: 'rewards.view',
  posts: 'posts.view',
  announcements: 'announcements.view',
  settings: 'settings.manage',
  profile: 'profile.edit',
};

export function clubPermissionsToMap(saved) {
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

export function cmsRoleFromFlags(custom = {}) {
  if (custom.can_be_club_admin) return 'club_admin';
  if (custom.can_be_club_sse) return 'senior_sales_engineer';
  if (custom.can_be_club_se) return 'sales_engineer';
  return null;
}

export function defaultsForCmsRole(cmsRole) {
  const option = CLUB_ROLE_OPTIONS.find((item) => item.cmsRole === cmsRole);
  const matrixRole = option?.matrixRole;
  const defaults = {};
  CLUB_ASSIGNABLE_PERMISSIONS.forEach((item) => {
    const allowed = PERMISSION_MATRIX[item.key] || [];
    defaults[item.key] = Boolean(matrixRole && allowed.includes(matrixRole));
  });
  return defaults;
}

export function mergeClubPermissions(saved, cmsRole) {
  const defaults = cmsRole ? defaultsForCmsRole(cmsRole) : {};
  const incoming = clubPermissionsToMap(saved);
  const next = { ...defaults };
  CLUB_ASSIGNABLE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) {
      next[key] = Boolean(incoming[key]);
    }
  });
  return next;
}

export function selectedClubPermissionCount(saved, cmsRole) {
  const merged = mergeClubPermissions(saved, cmsRole);
  return CLUB_ASSIGNABLE_KEYS.filter((key) => merged[key]).length;
}

export function canShowClubPageLink(permissions = {}, permissionKey) {
  if (permissions?.permission_type === 'Admin') return true;
  if (permissions?.permission_type && permissions.permission_type !== 'Custom') return false;
  const custom = permissions?.custom_permissions || {};
  const cmsRole = cmsRoleFromFlags(custom);
  if (!cmsRole) return false;
  if (!permissionKey) return true;
  const merged = mergeClubPermissions(custom.club_permissions, cmsRole);
  if (Object.prototype.hasOwnProperty.call(merged, permissionKey)) {
    return Boolean(merged[permissionKey]);
  }
  return false;
}
