export const APPROVED_MEMBER_STATUSES = ['joined', 'approved'];

export const MEMBERSHIP_LABELS = {
  none: 'Not Joined',
  pending: 'Pending',
  approved: 'Approved',
  joined: 'Approved',
  rejected: 'Rejected',
  blocked: 'Blocked',
};

export function isApprovedMemberStatus(status) {
  return APPROVED_MEMBER_STATUSES.includes(String(status || '').toLowerCase());
}

export function normalizeMembershipStatus(status) {
  if (!status || status === 'none') return 'none';
  if (isApprovedMemberStatus(status)) return 'approved';
  return String(status).toLowerCase();
}

export function membershipLabel(status) {
  const key = normalizeMembershipStatus(status);
  return MEMBERSHIP_LABELS[key] || MEMBERSHIP_LABELS.none;
}

const last10Digits = (value) => String(value || '').replace(/\D/g, '').slice(-10);

export function memberBelongsToStudent(member, student = {}) {
  if (!member || !student) return false;
  const memberUserId = String(member.studentId || member.studentUserId || '');
  const studentId = String(student.id || student.studentId || '');
  if (memberUserId && studentId && memberUserId === studentId) return true;
  const memberEmail = String(member.studentEmail || '').trim().toLowerCase();
  const studentEmail = String(student.email || '').trim().toLowerCase();
  if (memberEmail && studentEmail && memberEmail === studentEmail) return true;
  const memberMobile = last10Digits(member.studentMobile);
  const studentMobile = last10Digits(student.mobile);
  return memberMobile.length === 10 && memberMobile === studentMobile;
}

export function findStudentMembership(club, student) {
  return (club?.members || []).find((member) => memberBelongsToStudent(member, student)) || null;
}

export function isApprovedClubMember(member, student) {
  if (!member) return false;
  if (student && typeof student === 'object') {
    if (!memberBelongsToStudent(member, student)) return false;
  } else if (student && String(member.studentId || member.studentUserId) !== String(student)) {
    return false;
  }
  return isApprovedMemberStatus(member.status);
}
