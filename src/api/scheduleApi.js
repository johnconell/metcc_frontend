import api from './axios';

export const scheduleApi = {
  list: (params = {}) => api.get('/examination-schedules', { params }),
  get: (id) => api.get(`/examination-schedules/${id}`),
  reschedule: (registrationId, payload) =>
    api.post(`/examination-registrations/${registrationId}/reschedule`, payload),
  generatePasskeys: (scheduleId) =>
    api.post(`/examination-schedules/${scheduleId}/passkeys/generate`),
  sendPasskeys: (scheduleId) =>
    api.post(`/examination-schedules/${scheduleId}/passkeys/send`),
  listPasskeys: (scheduleId, params = {}) =>
    api.get(`/examination-schedules/${scheduleId}/passkeys`, { params }),
  generatePasskeysByDate: (examDate) =>
    api.post('/examination-schedules/passkeys/generate-by-date', { exam_date: examDate }),
  sendPasskeysByDate: (examDate) =>
    api.post('/examination-schedules/passkeys/send-by-date', { exam_date: examDate }),
  listPasskeysByDate: (examDate, params = {}) =>
    api.get('/examination-schedules/passkeys/by-date', { params: { exam_date: examDate, ...params } }),
  resendPasskey: (registrationId) =>
    api.post(`/examination-registrations/${registrationId}/passkeys/resend`),
};

/** Fired after student import so Examination/Schedules refreshes immediately. */
export const SCHEDULES_CHANGED_EVENT = 'metcc:schedules-changed';

export function notifySchedulesChanged(detail = {}) {
  try {
    localStorage.setItem('metcc.schedules.changed_at', new Date().toISOString());
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(SCHEDULES_CHANGED_EVENT, { detail }));
}
