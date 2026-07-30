import api from './axios';

export const examResultApi = {
  list: (params = {}) => api.get('/exam-results', { params }),
  sendBatch: (registrationIds, filters = {}) =>
    api.post('/exam-results/send-batch', { registration_ids: registrationIds, filters }),
  sendBatchEmail: (batch) => api.post(`/exam-results/send-batch-email/${encodeURIComponent(batch)}`),
  resendFailed: () => api.post('/exam-results/resend-failed'),
  emailStatus: () => api.get('/exam-results/email-status'),
  batchProgress: (batchId) => api.get(`/exam-results/batch-progress/${batchId}`),
};
