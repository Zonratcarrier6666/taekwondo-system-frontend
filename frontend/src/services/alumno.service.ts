import axios from 'axios';
import { Alumno, AlumnoCreateDTO, AlumnoUpdateDTO } from '../types/alumno.types';

/**
 * SERVICIO DE ALUMNOS
 * Maneja la comunicación con el API de Render para la gestión de la matrícula.
 */
const api = axios.create({
  baseURL: 'https://almonacisystems.devsweett.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE SEGURIDAD
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const alumnoService = {

  /** Lista general de alumnos con resumen de deuda. */
  getAlumnos: async (): Promise<Alumno[]> => {
    const res = await api.get<Alumno[]>('/alumnos/');
    return res.data;
  },

  /** Perfil detallado con desglose de pagos pendientes. */
  getDetalle: async (id: number): Promise<Alumno> => {
    const res = await api.get<Alumno>(`/alumnos/${id}`);
    return res.data;
  },

  /**
   * Registro inicial de alumno.
   * Si el payload incluye `idprofesor`, el backend lo asigna en el mismo paso.
   */
  registrar: async (data: AlumnoCreateDTO): Promise<Alumno> => {
    const res = await api.post<Alumno>('/alumnos/', data);
    return res.data;
  },

  /** Actualización parcial del expediente. */
  actualizar: async (id: number, data: AlumnoUpdateDTO): Promise<Alumno> => {
    const res = await api.put<Alumno>(`/alumnos/${id}`, data);
    return res.data;
  },

  /** Carga de foto de perfil del alumno. */
  subirFoto: async (id: number, file: File): Promise<Alumno> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<Alumno>(`/alumnos/${id}/upload-foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  /**
   * Asigna (o reasigna) un profesor a un alumno existente.
   * Usa el mismo endpoint que GestionAlumnos: PUT /alumnos/{id}/asignar-profesor?idprofesor=X
   */
  asignarProfesor: async (idAlumno: number, idProfesor: number): Promise<Alumno> => {
    const res = await api.put<Alumno>(
      `/alumnos/${idAlumno}/asignar-profesor`,
      null,
      { params: { idprofesor: idProfesor } }
    );
    return res.data;
  },
};