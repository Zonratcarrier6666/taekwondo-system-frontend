import api from '../api/axios';
import { Escuela } from '../types/escuela.types';

export const escuelaService = {
  getAlumnos: async () => (await api.get('/alumnos/')).data,
  
  /**
   * Obtiene la información de la escuela del usuario actual
   */
  getMiEscuela: async (): Promise<Escuela> => {
    const response = await api.get('/escuelas/escuelas/mi-escuela');
    return response.data;
  },
  
  updatePerfil: async (data: Partial<Escuela>): Promise<Escuela> => {
    const response = await api.put('/escuelas/escuelas/mi-escuela', data);
    return response.data;
  },
  
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/escuelas/escuelas/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};