import axios from 'axios';
import { clubAuthHeaders } from './clubCmsApi';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL || 'http://localhost:8080';

const request = (method, path, data, params) =>
  axios({
    method,
    url: `${backendUrl}/company${path}`,
    data,
    params,
    headers: clubAuthHeaders(),
  }).then((res) => res.data);

export const companyClubStaffApi = {
  searchColleges: (search) => request('get', '/club-staff/colleges', undefined, { search }),
  searchCompanyUsers: (search) => request('get', '/club-staff/users', undefined, { search }),
  listStaff: (collegeId) => request('get', '/club-staff/list', undefined, { collegeId }),
  assignStaff: (payload) => request('post', '/club-staff/assign', payload),
  updatePermissions: (payload) => request('post', '/club-staff/permissions', payload),
};
