import api from './axios';

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  disable: (id) => api.delete(`/users/${id}`),
  enable: (id) => api.patch(`/users/${id}/status`, { status: 'active' }),
};
