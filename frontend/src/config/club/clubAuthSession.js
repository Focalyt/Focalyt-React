export const USER_ROLES = {
  ADMIN: 0,
  COMPANY: 1,
  COLLEGE: 2,
  CANDIDATE: 3,
  TRAINER: 4,
  CLUB_ADMIN: 5,
};

export const CLUB_ADMIN_DASHBOARD = '/institute/club/dashboard';
export const COMPANY_DASHBOARD = '/cmp/dashboard';
export const COMPANY_CLUB_HOME = '/cmp/club/clubs';
export const LIVE_CLUB_MODES = ['club_admin', 'admin', 'student', 'company'];

export function isLiveClubMode(mode) {
  return LIVE_CLUB_MODES.includes(mode);
}

export function readClubSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function getClubAuthToken() {
  const sessionUser = readClubSessionUser();
  return sessionUser?.token || localStorage.getItem('token') || null;
}

export function isMainInstituteAdmin(user = readClubSessionUser()) {
  const type = String(user?.permissions?.permission_type || '').trim().toLowerCase();
  return type === 'admin' || Boolean(user?.isDefaultAdmin || user?.defaultAdmin);
}

export function hasInstituteClubStaffRole(permissions = {}) {
  if (permissions?.permission_type === 'Admin') return true;
  if (permissions?.permission_type && permissions.permission_type !== 'Custom') return false;
  const custom = permissions?.custom_permissions || {};
  return Boolean(custom.can_be_club_admin || custom.can_be_club_sse || custom.can_be_club_se);
}

export function canShowInstituteClubLink(permissions = {}, customPermission) {
  if (!hasInstituteClubStaffRole(permissions)) return false;
  if (permissions?.permission_type === 'Admin' || !customPermission) return true;
  const flags = Array.isArray(customPermission) ? customPermission : [customPermission];
  const custom = permissions?.custom_permissions || {};
  return flags.some((flag) => Boolean(custom[flag]));
}

export function canAccessInstituteClub(user = readClubSessionUser()) {
  return hasInstituteClubStaffRole(user?.permissions || {});
}

export function isStaffClubMode(mode) {
  return mode === 'admin' || mode === 'club_admin' || mode === 'company';
}

export function readAssignedCollegesFromSession() {
  const user = readClubSessionUser();
  if (Array.isArray(user.colleges) && user.colleges.length) {
    return user.colleges;
  }
  const collegeId = user.collegeId || user._college;
  if (collegeId) {
    return [{ _id: collegeId, name: user.collegeName || 'Institute', type: 'Campus' }];
  }
  return [];
}

export function getAuthSession() {
  try {
    const parsedUser = readClubSessionUser();
    const token = localStorage.getItem('token') || parsedUser?.token;
    const companyLabel = localStorage.getItem('company');
    if (!parsedUser?._id && !parsedUser?.role && !token && !companyLabel) {
      return { isLoggedIn: false, role: null };
    }
    if (Number(parsedUser?.role) === USER_ROLES.CLUB_ADMIN) {
      return { isLoggedIn: true, role: 'club_admin' };
    }
    if (Number(parsedUser?.role) === USER_ROLES.COLLEGE || parsedUser?.role === 'college') {
      return { isLoggedIn: true, role: 'admin' };
    }
    if (Number(parsedUser?.role) === USER_ROLES.COMPANY || (companyLabel && token)) {
      return { isLoggedIn: true, role: 'company' };
    }
    if (!parsedUser?.role && !token) {
      return { isLoggedIn: false, role: null };
    }
    return { isLoggedIn: true, role: 'student' };
  } catch {
    return { isLoggedIn: false, role: null };
  }
}

export function persistCompanyLoginSession(data) {
  const user = data?.user || {
    _id: data?._id,
    name: data?.name,
    role: USER_ROLES.COMPANY,
    email: data?.email,
    mobile: data?.mobile,
    colleges: data?.colleges || [],
    clubStaffRole: data?.clubStaffRole || null,
    token: data?.token,
  };
  const token = data?.token || user.token;
  if (data?.name || user.name) {
    localStorage.setItem('company', data?.name || user.name);
  }
  if (data?.email || user.email) {
    localStorage.setItem('registeredEmail', data?.email || user.email);
  }
  if (token) {
    localStorage.setItem('token', token);
  }
  sessionStorage.setItem('user', JSON.stringify({ ...user, token }));
  return { ...user, token };
}

export function sessionFromLoginCommon(payload) {
  const user = payload?.data?.user;
  const token = payload?.data?.token;
  if (!user || !token) return null;
  if (Number(user.role) === USER_ROLES.CLUB_ADMIN) {
    return { ...user, token };
  }
  if (Number(user.role) === USER_ROLES.COMPANY && Array.isArray(user.colleges) && user.colleges.length) {
    return { ...user, token };
  }
  return null;
}

export function clubAdminPathAfterLogin(returnUrl) {
  if (returnUrl) return decodeURIComponent(returnUrl);
  return CLUB_ADMIN_DASHBOARD;
}

export function companyPathAfterLogin() {
  return COMPANY_DASHBOARD;
}
