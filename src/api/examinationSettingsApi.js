import api from './axios';

export const examinationSettingsApi = {
  get: () => api.get('/examination-settings'),
  update: (payload) => api.put('/examination-settings', payload),
};
