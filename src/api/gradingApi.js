import api from './axios';

export const gradingApi = {
  list: (params = {}) => api.get('/course-grading-settings', { params }),
  create: (payload) => api.post('/course-grading-settings', payload),
  update: (id, payload) => api.patch(`/course-grading-settings/${id}`, payload),
  remove: (id) => api.delete(`/course-grading-settings/${id}`),
};
