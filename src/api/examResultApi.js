import api from './axios';

export const examResultApi = {
  list: (params = {}) => api.get('/exam-results', { params }),
  sendBatch: (registrationIds, filters = {}) =>
    api.post('/exam-results/send-batch', { registration_ids: registrationIds, filters }),
  sendBatchEmail: (batch) => api.post(`/exam-results/send-batch-email/${encodeURIComponent(batch)}`),
  resendFailed: () => api.post('/exam-results/resend-failed'),
  emailStatus: () => api.get('/exam-results/email-status'),
  batchProgress: (batchId) => api.get(`/exam-results/batch-progress/${batchId}`),
  export: (params = {}) =>
    api.get('/exam-results/export', {
      params,
      responseType: 'blob',
    }),
};

/** Trigger a browser download for an exported CSV blob. */
export async function downloadExamResultsExport(params = {}) {
  try {
    const response = await examResultApi.export(params);
    const contentType = String(response.headers?.['content-type'] || '');
    if (contentType.includes('application/json')) {
      const text = await response.data.text?.() ?? '';
      const parsed = text ? JSON.parse(text) : {};
      throw new Error(parsed.message || 'Unable to export examination results.');
    }
    const disposition = response.headers?.['content-disposition'] || '';
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const filename = match?.[1] || `exam_results_${params.scope || 'all'}.csv`;
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        throw new Error(parsed.message || 'Unable to export examination results.');
      } catch (inner) {
        if (inner instanceof Error && inner.message !== 'Unable to export examination results.') {
          throw inner;
        }
      }
    }
    throw error instanceof Error ? error : new Error('Unable to export examination results.');
  }
}
