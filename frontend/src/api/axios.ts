import axios from 'axios';

// URL de tu servidor en Render
const API_URL = "https://taekwondo-system-api.onrender.com";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar el token en cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;