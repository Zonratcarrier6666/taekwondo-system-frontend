import api from '../api/axios';

/**
 * --- INTERFACES INTEGRADAS ---
 * Definidas aquí para asegurar que el componente GestionProfesores 
 * pueda importarlas sin errores de resolución de módulos.
 */

export interface Profesor {
  idprofesor: number;
  idusuario: number;
  idescuela: number;
  nombrecompleto: string;
  email: string | null;
  telefono: string | null;
  idgradodan: number;
  foto_url: string | null;
  estatus: number;
  fecharegistro: string | null;
}

export interface RegistroProfesorDTO {
  username: string;
  password:  string;
  rol: 'Profesor';
  nombre_completo: string;
  idgradodan: number;
}

export interface ActualizarProfesorDTO {
  nombrecompleto?: string;
  email?: string;
  telefono?: string;
  idgradodan?: number;
  estatus?: number;
  foto_url?: string;
}

/**
 * SERVICIO: profesorService
 * Orquestador de peticiones para la gestión del cuerpo técnico.
 */
export const profesorService = {
  /**
   * Obtiene la lista de profesores de la escuela vinculada al token actual.
   * Endpoint: GET /profesores/
   */
  listarProfesores: async (): Promise<Profesor[]> => {
    const response = await api.get('/profesores/');
    return response.data;
  },

  /**
   * Registra un nuevo usuario de acceso y su perfil de instructor.
   * Endpoint: POST /usuarios/registrar-profesor
   */
  registrarProfesor: async (data: RegistroProfesorDTO): Promise<any> => {
    const response = await api.post('/usuarios/registrar-profesor', data);
    return response.data;
  },

  /**
   * Actualiza la información técnica o de contacto de un profesor.
   * Endpoint: PUT /profesores/{idprofesor}
   */
  actualizarProfesor: async (id: number, data: ActualizarProfesorDTO): Promise<Profesor> => {
    const response = await api.put(`/profesores/${id}`, data);
    return response.data;
  },

  /**
   * Sube o actualiza la fotografía oficial mediante el ID del profesor.
   * Endpoint: POST /profesores/{idprofesor}/upload-foto
   */
  subirFoto: async (id: number, file: File): Promise<Profesor> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/profesores/${id}/upload-foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};