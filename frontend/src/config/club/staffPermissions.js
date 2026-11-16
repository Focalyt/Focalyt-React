import { ROLES } from './roles';
import { PERMISSION_MATRIX } from './permissions';

export const MATRIX_ROLE_COLUMNS = [
  { key: ROLES.CLUB_ADMIN, label: 'Club Administrator', editable: false },
  { key: ROLES.SENIOR_SALES_ENGINEER, label: 'Sr Sales Eng.', editable: true },
  { key: ROLES.SALES_ENGINEER, label: 'Sales Eng.', editable: true },
  { key: ROLES.INSTITUTE, label: 'Institute/College', editable: true },
  { key: ROLES.STUDENT, label: 'Student', editable: false },
];

export const MATRIX_PERMISSION_ROWS = [
  { key: 'clubs.create', label: 'Create Club (Name, Type, Theme)' },
  { key: 'clubs.edit', label: 'Edit Club' },
  { key: 'members.approve', label: 'Approve Join' },
  { key: 'members.reject', label: 'Reject Join' },
  { key: 'members.block', label: 'Block Member' },
  { key: 'members.request', label: 'Request to Join' },
  { key: 'positions.create', label: 'Create Position' },
  { key: 'positions.assign', label: 'Assign Position' },
  { key: 'positions.recommend', label: 'Recommend Position' },
  { key: 'positions.request', label: 'Request Position' },
];

export const STAFF_PERMISSION_COLUMNS = MATRIX_PERMISSION_ROWS.map((row) => ({
  key: row.key,
  label: row.label,
}));

export const STAFF_PERMISSION_KEYS = MATRIX_PERMISSION_ROWS.map((row) => row.key);

export const defaultRoleMatrix = () => {
  const matrix = {};
  MATRIX_PERMISSION_ROWS.forEach((row) => {
    matrix[row.key] = {};
    MATRIX_ROLE_COLUMNS.forEach((column) => {
      const allowed = PERMISSION_MATRIX[row.key] || [];
      matrix[row.key][column.key] = allowed.includes(column.key);
    });
  });
  return matrix;
};

export const STAFF_PERMISSION_PRESETS = {
  sse: {
    'clubs.create': true,
    'clubs.edit': true,
    'members.add': true,
    'members.approve': true,
    'members.reject': true,
    'members.block': true,
    'positions.assign': true,
  },
  se: {
    'clubs.create': false,
    'clubs.edit': false,
    'members.add': true,
    'members.approve': true,
    'members.reject': true,
    'members.block': true,
    'positions.assign': true,
  },
};

export const emptyStaffPermissions = () =>
  STAFF_PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});

export const permissionsFromPreset = (staffRole) => {
  const preset = staffRole === 'sse' || staffRole === 'senior_sales_engineer'
    ? STAFF_PERMISSION_PRESETS.sse
    : STAFF_PERMISSION_PRESETS.se;
  return { ...emptyStaffPermissions(), ...preset };
};

export const withStaffPermissions = (permissions, staffRole) => ({
  ...permissionsFromPreset(staffRole),
  ...(permissions || {}),
});
