import { API_URL } from '../config/env';

export async function checkApiHealth() {
  try {
    const base = API_URL.replace(/\/api\/?$/, '');
    const response = await fetch(`${base}/up`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
