export const ROLES = {
  STUDENT: 'student',
  INSTITUTE: 'institute',
  CLUB_ADMIN: 'club_admin',
  SENIOR_SALES_ENGINEER: 'senior_sales_engineer',
  SALES_ENGINEER: 'sales_engineer',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.INSTITUTE]: 'Institute / College',
  [ROLES.CLUB_ADMIN]: 'Club Administrator',
  [ROLES.SENIOR_SALES_ENGINEER]: 'Senior Sales Engineer',
  [ROLES.SALES_ENGINEER]: 'Sales Engineer', 
};

export const STAFF_ROLES = [
  ROLES.INSTITUTE,
  ROLES.CLUB_ADMIN,
  ROLES.SENIOR_SALES_ENGINEER,
  ROLES.SALES_ENGINEER,
];

export const DEMO_STAFF_ROLE_OPTIONS = STAFF_ROLES.map((id) => ({
  id,
  label: ROLE_LABELS[id],
}));
