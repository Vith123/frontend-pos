import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to get image URL
export const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/80';
  // If it's already a full URL (Cloudinary), return as is
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  // Otherwise, it's a local file
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}/uploads/${image}`;
};

export default api;
