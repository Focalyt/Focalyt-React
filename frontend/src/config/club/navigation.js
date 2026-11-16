import { ROLES } from './roles';

export const STUDENT_NAV = [
  { label: 'Home', slug: 'discover', permission: 'clubs.view' },
  { label: 'Clubs', slug: 'clubs', permission: 'clubs.view' },
  { label: 'Events', slug: 'whats-on', permission: 'activities.view' },
  { label: 'My clubs', slug: 'my-space', permission: 'profile.view' },
  { label: 'Rewards', slug: 'rewards', permission: 'rewards.view' },
];

export const STUDENT_MORE_NAV = [
  { label: 'My dashboard', slug: 'overview', permission: 'profile.view' },
  { label: 'Ask for a role', slug: 'positions', permission: 'positions.request' },
  { label: 'Budgets', slug: 'budgets', permission: 'budgets.request' },
  { label: 'Certificates', slug: 'certificates', permission: 'certificates.view' },
  { label: 'Community posts', slug: 'community', permission: 'posts.view' },
  { label: 'Notices', slug: 'announcements', permission: 'announcements.view' },
  { label: 'My profile', slug: 'profile', permission: 'profile.edit' },
];

export const STAFF_NAV = [
  { label: 'Dashboard', slug: 'dashboard', permission: 'analytics.view' },
  { label: 'Clubs', slug: 'clubs', permission: 'clubs.view' },
  { label: 'Members & requests', slug: 'members', permission: 'members.view' },
  { label: 'Positions', slug: 'positions', permission: 'positions.view' },
  { label: 'Activities', slug: 'activities', permission: 'activities.view' },
  { label: 'Registrations', slug: 'registrations', permission: 'registrations.view' },
  { label: 'Budgets', slug: 'budgets', permission: 'budgets.view' },
  { label: 'Results', slug: 'results', permission: 'results.view' },
  { label: 'Certificates', slug: 'certificates', permission: 'certificates.view' },
  { label: 'Rewards', slug: 'rewards', permission: 'rewards.view' },
  { label: 'Posts', slug: 'posts', permission: 'posts.view' },
  { label: 'Announcements', slug: 'announcements', permission: 'announcements.view' },
  { label: 'Profile', slug: 'profile', permission: 'profile.edit' },
  { label: 'Settings', slug: 'settings', permission: 'settings.manage' },
];

export const DEFAULT_HOME_SLUG = {
  [ROLES.STUDENT]: 'discover',
  [ROLES.CLUB_ADMIN]: 'dashboard',
  [ROLES.INSTITUTE]: 'dashboard',
  [ROLES.SENIOR_SALES_ENGINEER]: 'clubs',
  [ROLES.SALES_ENGINEER]: 'clubs',
};
