import axios from 'axios';

const API_URL = "https://taekwondo-system-api.onrender.com";

const api = axios.create({ baseURL: API_URL });

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const escuelaService = {
  getAlumnos: async () => (await api.get('/alumnos/')).data,
  
  /**
   * RUTAS ACTUALIZADAS SEGÚN TUS CURLS (Prefijo duplicado /escuelas/escuelas/)
   */
  getMiEscuela: async () => (await api.get('/escuelas/escuelas/mi-escuela')).data,
  
  updatePerfil: async (data: any) => (await api.put('/escuelas/escuelas/mi-escuela', data)).data,
  
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/escuelas/escuelas/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data;
  }
};