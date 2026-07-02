import api from './axios';

export const roleApi = {
  list: () => api.get('/roles'),
};
