import axios from 'axios';

// Centralized API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

// Request interceptor to add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;