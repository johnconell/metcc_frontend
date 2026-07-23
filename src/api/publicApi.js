import api from './axios';

/**
 * Public schedule search.
 * @param {{ q: string, type?: 'auto'|'name'|'applicant_id'|'reference' }} params
 */
export const publicApi = {
  searchSchedule: ({ q, type = 'auto' }) =>
    api.get('/public/schedule-search', { params: { q, type } }),
};
