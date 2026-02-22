import api from '../api/axios';
import { Alumno, AlumnoCreateDTO } from '../types/alumno.types'; // ← Quita AlumnoUpdateDTO

export const alumnoService = {
  getAlumnos: async (): Promise<Alumno[]> => {
    const response = await api.get('/alumnos/');
    return response.data;
  },

  getAlumnoById: async (id: number): Promise<Alumno> => {
    const response = await api.get(`/alumnos/${id}`);
    return response.data;
  },

  registrar: async (data: AlumnoCreateDTO): Promise<Alumno> => {
    const response = await api.post('/alumnos/', data);
    return response.data;
  },

  // ← Cambia AlumnoUpdateDTO por Partial<AlumnoCreateDTO>
  actualizar: async (id: number, data: Partial<AlumnoCreateDTO>): Promise<Alumno> => {
    const response = await api.put(`/alumnos/${id}`, data);
    return response.data;
  },

  subirFoto: async (id: number, file: File): Promise<Alumno> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/alumnos/${id}/upload-foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};