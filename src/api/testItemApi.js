import api from './axios';

export const testItemApi = {
  list: (params) => api.get('/test-items', { params }),
  get: (id) => api.get(`/test-items/${id}`),
  create: (data) => api.post('/test-items', data),
  update: (id, data) => api.put(`/test-items/${id}`, data),
  delete: (id) => api.delete(`/test-items/${id}`),
};
