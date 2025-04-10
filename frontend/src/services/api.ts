import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:8000', // Ensure port 8000 is included
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the complete URL being requested for debugging
    console.log(`API Request to: ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
