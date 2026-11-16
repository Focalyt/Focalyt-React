export const DEFAULT_EXTERNAL_NAV_LINKS = {
  coursesUrl: process.env.REACT_APP_FOCALYT_COURSES_URL || '/candidate/searchcourses',
  placementsUrl: process.env.REACT_APP_FOCALYT_PLACEMENTS_URL || '/candidate/searchjob',
};

export const STUDENT_NAV_ITEMS = [
  { label: 'Discover', slug: 'discover', path: '/club/discover' },
  { label: 'Explore Clubs', slug: 'clubs', path: '/club/clubs' },
  { label: 'Events', slug: 'whats-on', path: '/club/whats-on' },
  { label: 'My clubs', slug: 'my-space', path: '/club/my-space' },
];

export const ADMIN_NAV_ITEMS = [
  { label: 'Clubs', slug: 'clubs', path: '/club/admin/clubs', shortLabel: 'Clubs' },
  { label: 'Activities', slug: 'activities', path: '/club/admin/activities', shortLabel: 'Activities' },
];
