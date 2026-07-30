import api from './axios';

export const roomApi = {
  list: (scheduleId) => api.get(`/examination-schedules/${scheduleId}/rooms`),
  create: (scheduleId, payload) =>
    api.post(`/examination-schedules/${scheduleId}/rooms`, payload),
  seedDefaults: (scheduleId) =>
    api.post(`/examination-schedules/${scheduleId}/rooms/seed-defaults`),
  seedDefaultsAll: () => api.post('/examination-rooms/seed-defaults-all'),
  update: (roomId, payload) => api.patch(`/examination-rooms/${roomId}`, payload),
  remove: (roomId) => api.delete(`/examination-rooms/${roomId}`),
};
