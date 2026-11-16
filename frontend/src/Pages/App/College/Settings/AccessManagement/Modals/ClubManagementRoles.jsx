import React from 'react';
import {
  CLUB_ASSIGNABLE_KEYS,
  cmsRoleFromFlags,
  mergeClubPermissions,
} from '../../../../../../config/club/clubAssignablePermissions';

const CLUB_ROLE_FLAGS = ['can_be_club_admin', 'can_be_club_sse', 'can_be_club_se'];

const CLUB_ROLES = {
  can_be_club_admin: 'Club Admin',
  can_be_club_sse: 'Senior Sales Engineer',
  can_be_club_se: 'Sales Engineer',
};

const VIEW_KEYS = [
  'analytics.view',
  'clubs.view',
  'members.view',
  'positions.view',
  'activities.view',
  'registrations.view',
  'budgets.view',
];

const CLUB_ACTIONS = [
  { id: 'create_club', label: 'Create Club', keys: ['clubs.create'] },
  { id: 'add_member', label: 'Add Member', keys: ['members.add'] },
  { id: 'manage_member', label: 'Block / Approve Member', keys: ['members.approve', 'members.block', 'members.reject'] },
  { id: 'add_position', label: 'Add Club Position', keys: ['positions.create'] },
  { id: 'assign_position', label: 'Assign Club Position', keys: ['positions.assign'] },
  { id: 'add_activity', label: 'Add Activities', keys: ['activities.create'] },
  { id: 'schedule_activity', label: 'Schedule Activities', keys: ['activities.schedule'] },
  { id: 'register_activity', label: 'Register For Activity', keys: ['activities.register'] },
  { id: 'prepare_budget', label: 'Prepare Activity Budget', keys: ['budgets.create'] },
  { id: 'approve_budget', label: 'Approve Activity Budget', keys: ['budgets.approve'] },
];

const emptyClubPermissions = () =>
  Object.fromEntries(CLUB_ASSIGNABLE_KEYS.map((key) => [key, false]));

const withViews = (actions) => ({
  ...emptyClubPermissions(),
  ...Object.fromEntries(VIEW_KEYS.map((key) => [key, true])),
  ...actions,
});

const ROLE_ACTION_DEFAULTS = {
  can_be_club_admin: Object.fromEntries(CLUB_ASSIGNABLE_KEYS.map((key) => [key, true])),
  can_be_club_sse: withViews({
    'clubs.create': true,
    'clubs.edit': true,
    'members.add': true,
    'members.approve': true,
    'members.block': true,
    'members.reject': true,
    'positions.create': false,
    'positions.assign': true,
    'activities.create': true,
    'activities.edit': true,
    'activities.schedule': true,
    'activities.approveSchedule': true,
    'activities.recommend': false,
    'activities.register': true,
    'registrations.approve': true,
    'budgets.create': true,
    'budgets.approve': true,
  }),
  can_be_club_se: withViews({
    'clubs.create': false,
    'members.add': true,
    'members.approve': true,
    'members.block': true,
    'members.reject': true,
    'positions.create': false,
    'positions.assign': true,
    'activities.create': true,
    'activities.edit': true,
    'activities.schedule': false,
    'activities.approveSchedule': false,
    'activities.recommend': true,
    'activities.register': false,
    'budgets.create': true,
    'budgets.approve': false,
  }),
};

const selectedClubRole = (permissions = {}) =>
  CLUB_ROLE_FLAGS.find((flag) => permissions[flag]) || '';

const actionKeys = (action, permissions = {}) => {
  if (action.id === 'schedule_activity' && permissions.can_be_club_se) {
    return ['activities.recommend'];
  }
  return action.keys;
};

const isActionChecked = (action, merged, permissions = {}) => {
  if (action.id === 'schedule_activity' && permissions.can_be_club_se) {
    return Boolean(merged['activities.recommend']);
  }
  return action.keys.every((key) => Boolean(merged[key]));
};

const roleAllowsAction = (action, roleFlag) => {
  const defaults = ROLE_ACTION_DEFAULTS[roleFlag] || {};
  return actionKeys(action, { [roleFlag]: true }).some((key) => Boolean(defaults[key]));
};

export const ClubManagementRoles = ({
  permissions = {},
  isMainAdmin = false,
  onRoleChange,
  onPermissionToggle,
  onPermissionsPatch,
}) => {
  const canEdit = Boolean(isMainAdmin);
  const roleFlag = selectedClubRole(permissions);
  const showPermissions = Boolean(permissions.can_be_club_sse || permissions.can_be_club_se);
  const visibleActions = showPermissions
    ? CLUB_ACTIONS.filter((action) => roleAllowsAction(action, roleFlag))
    : [];
  const cmsRole = cmsRoleFromFlags(permissions);
  const merged = cmsRole
    ? mergeClubPermissions(permissions.club_permissions, cmsRole)
    : emptyClubPermissions();

  const patchAction = (action, checked) => {
    if (!canEdit || !roleFlag) return;
    const keys = actionKeys(action, permissions);
    const patch = Object.fromEntries(keys.map((key) => [key, Boolean(checked)]));
    if (action.id === 'schedule_activity') {
      if (permissions.can_be_club_se) {
        patch['activities.schedule'] = false;
        patch['activities.recommend'] = Boolean(checked);
      } else {
        patch['activities.schedule'] = Boolean(checked);
        patch['activities.recommend'] = false;
      }
    }
    if (checked) {
      VIEW_KEYS.forEach((key) => {
        patch[key] = true;
      });
    }
    if (onPermissionsPatch) {
      onPermissionsPatch(patch);
      return;
    }
    keys.forEach((key) => onPermissionToggle(key, checked));
  };

  return (
    <div className="card mb-3">
      <div className="card-header text-white" style={{ backgroundColor: '#fc2b5a' }}>
        <h6 className="mb-0">Club Management</h6>
      </div>
      <div className="card-body">
        {!canEdit && (
          <div className="alert alert-warning py-2 mb-3">
            <small>Only the main Institute Admin can assign Club roles and permissions.</small>
          </div>
        )}

        <div className="fw-semibold small text-muted mb-2">Club Role</div>
        <div className="row g-2 mb-3">
          {Object.entries(CLUB_ROLES).map(([flag, label]) => (
            <div key={flag} className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={Boolean(permissions[flag])}
                  disabled={!canEdit}
                  onChange={(e) => onRoleChange(flag, e.target.checked)}
                  id={`perm_${flag}`}
                />
                <label className="form-check-label" htmlFor={`perm_${flag}`}>
                  {label}
                </label>
              </div>
            </div>
          ))}
        </div>

        {showPermissions && (
          <>
            <div className="fw-semibold small text-muted mb-2">Club Permissions</div>
            <div className="row g-2">
              {visibleActions.map((action) => (
                <div key={action.id} className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={isActionChecked(action, merged, permissions)}
                      disabled={!canEdit}
                      onChange={(e) => patchAction(action, e.target.checked)}
                      id={`club_action_${action.id}`}
                    />
                    <label className="form-check-label" htmlFor={`club_action_${action.id}`}>
                      {action.label}
                      {action.id === 'schedule_activity' && permissions.can_be_club_se
                        ? ' (Recommend only)'
                        : ''}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const applyClubRoleChange = (permissions, flag, checked) => {
  const next = {
    ...permissions,
    can_be_club_admin: false,
    can_be_club_sse: false,
    can_be_club_se: false,
    club_permissions: emptyClubPermissions(),
    can_view_clubs: false,
  };
  if (checked) {
    next[flag] = true;
    next.can_view_clubs = true;
    next.club_permissions = ROLE_ACTION_DEFAULTS[flag] || emptyClubPermissions();
  }
  return next;
};

export const applyClubPermissionToggle = (permissions, key, checked) => {
  if (!selectedClubRole(permissions) || !CLUB_ASSIGNABLE_KEYS.includes(key)) {
    return permissions;
  }
  const cmsRole = cmsRoleFromFlags(permissions);
  const merged = mergeClubPermissions(permissions.club_permissions, cmsRole);
  const club_permissions = {
    ...merged,
    [key]: Boolean(checked),
  };
  if (checked) {
    VIEW_KEYS.forEach((viewKey) => {
      club_permissions[viewKey] = true;
    });
  }
  return {
    ...permissions,
    can_view_clubs: true,
    club_permissions,
  };
};

export const applyClubPermissionsPatch = (permissions, patch = {}) => {
  if (!selectedClubRole(permissions)) return permissions;
  const cmsRole = cmsRoleFromFlags(permissions);
  const merged = mergeClubPermissions(permissions.club_permissions, cmsRole);
  const club_permissions = { ...merged };
  Object.entries(patch).forEach(([key, value]) => {
    if (CLUB_ASSIGNABLE_KEYS.includes(key)) {
      club_permissions[key] = Boolean(value);
    }
  });
  const hasAction = CLUB_ACTIONS.some((action) =>
    actionKeys(action, permissions).some((key) => club_permissions[key])
  );
  return {
    ...permissions,
    can_view_clubs: hasAction || Boolean(selectedClubRole(permissions)),
    club_permissions,
  };
};
