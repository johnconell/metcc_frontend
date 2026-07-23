import api from './axios';

export const scheduleApi = {
  list: (params = {}) => api.get('/examination-schedules', { params }),
  get: (id) => api.get(`/examination-schedules/${id}`),
  reschedule: (registrationId, payload) =>
    api.post(`/examination-registrations/${registrationId}/reschedule`, payload),
};
