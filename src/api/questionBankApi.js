import api from './axios';

export const questionBankApi = {
  listBanks: () => api.get('/question-banks'),
  createBank: (payload) => api.post('/question-banks', payload),
  getBank: (id) => api.get(`/question-banks/${id}`),
  updateBank: (id, payload) => api.patch(`/question-banks/${id}`, payload),
  activateBank: (id) => api.post(`/question-banks/${id}/activate`),
  importQuestions: (id, formData) =>
    api.post(`/question-banks/${id}/import-questions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteBank: (id) => api.delete(`/question-banks/${id}`),
  examPreview: (bankId) => api.get(`/question-banks/${bankId}/exam-preview`),

  createSubject: (bankId, payload) => api.post(`/question-banks/${bankId}/subjects`, payload),
  getSubject: (id) => api.get(`/subjects/${id}`),
  updateSubject: (id, payload) => api.patch(`/subjects/${id}`, payload),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),

  createQuestion: (subjectId, payload) => api.post(`/subjects/${subjectId}/questions`, payload),
  updateQuestion: (questionId, payload) => api.patch(`/exam-questions/${questionId}`, payload),
  toggleSelection: (questionId) => api.post(`/exam-questions/${questionId}/toggle-selection`),
  deleteQuestion: (questionId) => api.delete(`/exam-questions/${questionId}`),

  reviewQuestions: (params = {}) => api.get('/exam-questions/review', { params }),
  bulkQuestions: (payload) => api.post('/exam-questions/bulk', payload),
};

/** @deprecated Use questionBankApi */
export const subjectApi = questionBankApi;
