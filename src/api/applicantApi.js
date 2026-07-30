import api from './axios';

export const applicantApi = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  submitGmail: (id, gmail) => api.post(`/applicants/${id}/gmail`, { gmail }),
  importFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/students/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  /** @deprecated Use importFile */
  importCsv: (file) => applicantApi.importFile(file),
};
