import axios from 'axios';
import { Alumno, AlumnoCreateDTO, AlumnoUpdateDTO } from '../types/alumno.types';

/**
 * SERVICIO DE ALUMNOS
 * Maneja la comunicación con el API de Render para la gestión de la matrícula.
 */
const api = axios.create({
  baseURL: 'https://taekwondo-system-api.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE SEGURIDAD
 * Corregido basándose en la inspección de Storage: Se extrae 'access_token' directamente.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const alumnoService = {
  /**
   * Lista general de alumnos con resumen de deuda.
   */
  getAlumnos: async (): Promise<Alumno[]> => {
    const res = await api.get<Alumno[]>('/alumnos/');
    return res.data;
  },

  /**
   * Perfil detallado con desglose de pagos pendientes.
   */
  getDetalle: async (id: number): Promise<Alumno> => {
    const res = await api.get<Alumno>(`/alumnos/${id}`);
    return res.data;
  },

  /**
   * Registro inicial de alumno (Paso 1).
   */
  registrar: async (data: AlumnoCreateDTO): Promise<Alumno> => {
    const res = await api.post<Alumno>('/alumnos/', data);
    return res.data;
  },

  /**
   * Actualización parcial del expediente.
   */
  actualizar: async (id: number, data: AlumnoUpdateDTO): Promise<Alumno> => {
    const res = await api.put<Alumno>(`/alumnos/${id}`, data);
    return res.data;
  },

  /**
   * Carga de archivos multimedia (Paso 2).
   */
  subirFoto: async (id: number, file: File): Promise<Alumno> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<Alumno>(`/alumnos/${id}/upload-foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};