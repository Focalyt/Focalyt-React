import axios from 'axios';
import { getClubAuthToken } from '../../config/club/clubAuthSession';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

export function clubAuthHeaders() {
  const token = getClubAuthToken();
  return token ? { 'x-auth': token } : {};
}

const request = (method, path, data, params) =>
  axios({
    method,
    url: `${backendUrl}/api/club-cms${path}`,
    data,
    params,
    headers: clubAuthHeaders(),
  }).then((res) => res.data);

export const clubCmsApi = {
  bootstrap: (collegeId) => request('get', '/bootstrap', undefined, collegeId ? { collegeId } : undefined),
  listPlacementVerticals: () => request('get', '/placement/verticals'),
  listPlacementProjects: (verticalId) =>
    request('get', '/placement/projects', undefined, verticalId ? { verticalId } : undefined),
  listPlacementCenters: (projectId) =>
    request('get', '/placement/centers', undefined, projectId ? { projectId } : undefined),
  createClub: (payload) => request('post', '/clubs', payload),
  updateClub: (clubId, payload) => request('put', `/clubs/${clubId}`, payload),
  deleteClub: (clubId) => request('delete', `/clubs/${clubId}`),
  addMember: (clubId, payload) => request('post', `/clubs/${clubId}/members`, payload),
  requestMembership: (clubId, note) => request('post', `/clubs/${clubId}/members/requests`, { note }),
  leaveMembership: (clubId) => request('post', `/clubs/${clubId}/members/leave`),
  reviewMember: (memberId, decision) => request('post', `/members/${memberId}/review`, { decision }),
  setMemberStatus: (memberId, status) => request('post', `/members/${memberId}/status`, { status }),
  createPosition: (clubId, payload) => request('post', `/clubs/${clubId}/positions`, payload),
  updatePosition: (positionId, payload) => request('put', `/positions/${positionId}`, payload),
  deletePosition: (positionId) => request('delete', `/positions/${positionId}`),
  listStudents: (collegeId, search) =>
    request('get', `/campuses/${collegeId}/students`, undefined, search ? { search } : undefined),
  setPositionsFeature: (collegeId, enabled) =>
    request('put', `/campuses/${collegeId}/settings/positions-feature`, { enabled }),
  setPermissionMatrix: (collegeId, permissionMatrix) =>
    request('put', `/campuses/${collegeId}/settings/permission-matrix`, { permissionMatrix }),
  requestPosition: (positionId, note) => request('post', `/positions/${positionId}/requests`, { note }),
  reviewPosition: (requestId, decision) =>
    request('post', `/position-requests/${requestId}/review`, { decision }),
  createActivity: (payload) => request('post', '/activities', payload),
  updateActivity: (activityId, payload) => request('put', `/activities/${activityId}`, payload),
  registerActivity: (activityId) => request('post', `/activities/${activityId}/register`),
  cancelActivityRegistration: (activityId) => request('post', `/activities/${activityId}/cancel`),
  toggleSaveActivity: (activityId) => request('post', `/activities/${activityId}/save`),
  markAttendance: (activityId, registrationId, attendance, extra = {}) =>
    request('post', `/activities/${activityId}/registrations/${registrationId}/attendance`, {
      attendance,
      ...extra,
    }),
  toggleStudentInterest: (interest) => request('post', '/student/interests', { interest }),
  updateStudentProfile: (payload) => request('put', '/student/profile', payload),
  createSuggestion: (payload) => request('post', '/suggestions', payload),
  deleteSuggestion: (suggestionId) => request('delete', `/suggestions/${suggestionId}`),
  approveSuggestion: (suggestionId) => request('post', `/suggestions/${suggestionId}/approve`),
  createPost: (payload) => request('post', '/posts', payload),
  deletePost: (postId) => request('delete', `/posts/${postId}`),
  deletePostComment: (postId, commentId) =>
    request('delete', `/posts/${postId}/comments/${commentId}`),
  togglePostLike: (postId) => request('post', `/posts/${postId}/like`),
  addPostComment: (postId, body) => request('post', `/posts/${postId}/comments`, { body }),
  reportPost: (postId) => request('post', `/posts/${postId}/report`),
  createAnnouncement: (payload) => request('post', '/announcements', payload),
  deleteAnnouncement: (announcementId) => request('delete', `/announcements/${announcementId}`),
  sendChatMessage: (payload) => request('post', '/chat', payload),
  downloadCertificateFile: (certificateId, templateId) =>
    axios({
      method: 'get',
      url: `${backendUrl}/api/club-cms/certificates/${certificateId}/file`,
      headers: clubAuthHeaders(),
      params: templateId ? { templateId } : undefined,
      responseType: 'blob',
    }).then((res) => res.data),
  requestRedemption: (payload) => request('post', '/redemptions', payload),
  reviewRedemption: (redemptionId, decision) =>
    request('post', `/redemptions/${redemptionId}/review`, { decision }),
  upsertBudget: (payload) => request('post', '/budgets', payload),
  workflowBudget: (budgetId, action, actorName) =>
    request('post', `/budgets/${budgetId}/workflow`, { action, actorName }),
  declareResult: (payload) => request('post', '/results', payload),
  generateCertificate: (payload) => request('post', '/certificates', payload),
  upsertGoodie: (payload) => request('post', '/goodies', payload),
  upsertBadge: (payload) => request('post', '/badges', payload),
  awardBadge: (badgeId, studentId) => request('post', `/badges/${badgeId}/award`, { studentId }),
  deleteGoodie: (goodieId) => request('delete', `/goodies/${goodieId}`),
  upsertFaq: (payload) => request('post', '/faqs', payload),
  deleteFaq: (faqId) => request('delete', `/faqs/${faqId}`),
  upsertPerson: (payload) => request('post', '/people', payload),
  createWorkflow: (payload) => request('post', '/workflows', payload),
  workflowActivity: (activityId, action, extra = {}) =>
    request('post', `/activities/${activityId}/schedule-workflow`, { action, ...extra }),
  sharePost: (postId) => request('post', `/posts/${postId}/share`),
  resolvePostReport: (postId) => request('post', `/posts/${postId}/resolve-report`),
  reviewAnnouncement: (announcementId, decision) =>
    request('post', `/announcements/${announcementId}/review`, { decision }),
  configureRewards: (collegeId, payload) =>
    request('put', `/campuses/${collegeId}/settings/rewards`, payload),
  createNotificationTemplate: (payload) => request('post', '/notification-templates', payload),
  sendNotification: (payload) => request('post', '/notifications/send', payload),
  shareAchievement: (payload) => request('post', '/achievements', payload),
  upsertInstitution: (payload) =>
    payload?.id
      ? request('put', `/institutions/${payload.id}`, payload)
      : request('post', '/institutions', payload),
};
