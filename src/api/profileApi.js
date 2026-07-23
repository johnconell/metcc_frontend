import api from './axios';

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile/update', data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/profile/photo', formData, {
      headers: { 'Content-Type': undefined },
      transformRequest: [(data, headers) => {
        // Let the browser set multipart boundary — required for file uploads.
        if (headers && typeof headers.set === 'function') {
          headers.set('Content-Type', undefined);
        } else if (headers) {
          delete headers['Content-Type'];
        }
        return data;
      }],
    });
  },
  removePhoto: () => api.delete('/profile/photo'),
};
