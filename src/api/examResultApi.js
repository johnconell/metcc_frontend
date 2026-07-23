import api from './axios';

export const examResultApi = {
  list: (params = {}) => api.get('/exam-results', { params }),
};
