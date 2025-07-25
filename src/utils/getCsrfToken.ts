// utils/csrf.ts - Create this new file
import axios from 'axios';

let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await axios.get('http://localhost:5000/api/csrf-token', {
      withCredentials: true,
    });
    
    csrfToken = response.data.csrfToken;
    console.log('CSRF token fetched:', csrfToken?.substring(0, 20) + '...');
    if (!csrfToken) {
      throw new Error('CSRF token is null');
    }
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw new Error('Unable to get CSRF token');
  }
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

// Axios interceptor to automatically include CSRF token
export function setupAxiosInterceptors() {
  // Request interceptor to add CSRF token
  axios.interceptors.request.use(
    async (config) => {
      // Only add CSRF token for state-changing methods and backend calls
      if (
        config.method && 
        ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase()) &&
        config.url?.includes('localhost:5000')
      ) {
        try {
          const token = await getCsrfToken();
          config.headers['X-CSRF-Token'] = token;
          console.log('Added CSRF token to request:', config.url);
        } catch (error) {
          console.error('Failed to add CSRF token:', error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle CSRF errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
        console.log('CSRF token invalid, clearing and retrying...');
        clearCsrfToken();
      }
      return Promise.reject(error);
    }
  );
}