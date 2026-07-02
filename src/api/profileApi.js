import api from './axios';

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile/update', data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removePhoto: () => api.delete('/profile/photo'),
};
