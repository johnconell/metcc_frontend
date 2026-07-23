import api from './axios';

export const questionBankApi = {
  listSubjects: () => api.get('/subjects'),
  createSubject: (payload) => api.post('/subjects', payload),
  getSubject: (id) => api.get(`/subjects/${id}`),
  createBank: (subjectId, payload) => api.post(`/subjects/${subjectId}/banks`, payload),
  getBank: (bankId) => api.get(`/question-banks/${bankId}`),
  createQuestion: (bankId, payload) => api.post(`/question-banks/${bankId}/questions`, payload),
  updateQuestion: (questionId, payload) => api.patch(`/exam-questions/${questionId}`, payload),
  toggleSelection: (questionId) => api.post(`/exam-questions/${questionId}/toggle-selection`),
  deleteQuestion: (questionId) => api.delete(`/exam-questions/${questionId}`),
};

/** @deprecated Use questionBankApi */
export const subjectApi = questionBankApi;
