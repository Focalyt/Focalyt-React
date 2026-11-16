import axios from 'axios';
import { clubAuthHeaders } from './clubCmsApi';

const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

const request = (method, path, data, params) =>
  axios({
    method,
    url: `${backendUrl}/club-admin${path}`,
    data,
    params,
    headers: clubAuthHeaders(),
  }).then((res) => res.data);

export const clubAdminStaffApi = {
  searchCompanyUsers: (search) => request('get', '/company-users', undefined, { search }),
  listStaff: (collegeId) => request('get', '/staff', undefined, { collegeId }),
  assignStaff: (payload) => request('post', '/staff', payload),
  updatePermissions: (payload) => request('post', '/staff/permissions', payload),
};
