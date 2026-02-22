/**
 * ARCHIVO: src/services/profesor.service.ts
 * Servicio modular para la gestión del cuerpo técnico (Maestros/Instructores).
 */
import api from '../api/axios';
import { 
  Profesor, 
  RegistroProfesorDTO, 
  ActualizarProfesorDTO 
} from '../types/profesor.types';

export const profesorService = {
  /**
   * Obtiene la lista de profesores vinculados a la escuela del usuario autenticado.
   * Endpoint: GET /profesores/
   */
  listarProfesores: async (): Promise<Profesor[]> => {
    const response = await api.get('/profesores/');
    return response.data;
  },

  /**
   * Registra un nuevo usuario de acceso y su perfil de instructor Dan.
   * ROL REQUERIDO: Escuela
   * Endpoint: POST /usuarios/registrar-profesor
   */
  registrarProfesor: async (data: RegistroProfesorDTO): Promise<any> => {
    const response = await api.post('/usuarios/registrar-profesor', data);
    return response.data;
  },

  /**
   * Actualiza la información técnica, de contacto o estatus de un profesor.
   * Endpoint: PUT /profesores/{idprofesor}
   */
  actualizarProfesor: async (id: number, data: ActualizarProfesorDTO): Promise<Profesor> => {
    const response = await api.put(`/profesores/${id}`, data);
    return response.data;
  },

  /**
   * Sube o actualiza la fotografía oficial del profesor al almacenamiento.
   * Endpoint: POST /profesores/{idprofesor}/upload-foto
   */
  subirFoto: async (id: number, file: File): Promise<Profesor> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/profesores/${id}/upload-foto`, formData, {
      headers: {
        // Al enviar FormData, no definimos Content-Type manualmente
        // para permitir que Axios inserte el boundary correspondiente.
        'Accept': 'application/json'
      }
    });
    return response.data;
  },

  /**
   * Obtiene el perfil del profesor que ha iniciado sesión.
   * Endpoint: GET /profesores/mi-perfil
   */
  getMiPerfil: async (): Promise<Profesor> => {
    const response = await api.get('/profesores/mi-perfil');
    return response.data;
  }
};