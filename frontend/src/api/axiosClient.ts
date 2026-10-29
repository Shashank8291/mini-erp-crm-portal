import axios from 'axios';
import { mockStore } from './mockAdapter';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses and fallback to MockStore when backend is unreachable or in static preview
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is unreachable (offline, CORS, 404 on static hosting, or timeout), use mock adapter
    const isNetworkOrNotFound =
      !error.response ||
      error.response.status === 404 ||
      error.response.status >= 500 ||
      error.code === 'ECONNABORTED';

    if (isNetworkOrNotFound && error.config) {
      const mockResult = mockStore.handle(error.config);
      if (mockResult) {
        if (mockResult.status >= 200 && mockResult.status < 300) {
          return Promise.resolve({
            data: mockResult.data,
            status: mockResult.status,
            statusText: 'OK',
            headers: {},
            config: error.config,
          });
        }
        return Promise.reject({
          response: {
            data: mockResult.data,
            status: mockResult.status,
            statusText: 'Mock Error',
          },
          config: error.config,
        });
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
