import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3011/api',  // Updated to match the actual server port
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Send cookies with cross-origin requests
});

// Request interceptor - removed manual token handling (cookies are automatic)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Unauthorized or forbidden (expired token) - clear local user data and redirect
      localStorage.removeItem('user');
      // No need to clear token from localStorage as it's in a cookie
      
      // Only redirect if not already on login page to prevent loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
