import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import config from '@/config';
import { getFirebaseAuth } from '@/lib/firebase';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      
      if (user) {
        const token = await user.getIdToken();
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    return requestConfig;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          console.error('Unauthorized access');
          window.location.href = '/login';
          break;
          
        case 403:
          // Forbidden
          console.error('Forbidden access');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found');
          break;
          
        case 500:
          // Server error
          console.error('Server error');
          break;
          
        default:
          console.error('API error:', data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
