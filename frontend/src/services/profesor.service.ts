/**
 * ARCHIVO: src/services/profesor.service.ts
 */
import api from '../api/axios';
import type {
  Profesor,
  CrearProfesorDTO,
  ActualizarProfesorDTO,
  ResetPasswordResponse,
  ReasignarAlumnosResponse,
} from '../types/profesor.types';

export const profesorService = {

  // GET /profesores/
  listarProfesores: async (): Promise<Profesor[]> => {
    const { data } = await api.get<Profesor[]>('/profesores/');
    return data;
  },

  // GET /profesores/mi-perfil
  getMiPerfil: async (): Promise<Profesor> => {
    const { data } = await api.get<Profesor>('/profesores/mi-perfil');
    return data;
  },

  // GET /profesores/:id
  obtenerProfesor: async (id: number): Promise<Profesor> => {
    const { data } = await api.get<Profesor>(`/profesores/${id}`);
    return data;
  },

  // POST /profesores/ — crea usuario + perfil, devuelve perfil + _password_temporal
  crearProfesor: async (datos: CrearProfesorDTO): Promise<Profesor> => {
    const { data } = await api.post<Profesor>('/profesores/', datos);
    return data;
  },

  // PUT /profesores/:id
  actualizarProfesor: async (id: number, datos: ActualizarProfesorDTO): Promise<Profesor> => {
    const { data } = await api.put<Profesor>(`/profesores/${id}`, datos);
    return data;
  },

  // POST /profesores/:id/upload-foto
  subirFoto: async (id: number, file: File): Promise<Profesor> => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post<Profesor>(`/profesores/${id}/upload-foto`, fd);
    return data;
  },

  // POST /profesores/upload-foto (el propio profesor sube su foto)
  subirFotoPropia: async (file: File): Promise<Profesor> => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post<Profesor>('/profesores/upload-foto', fd);
    return data;
  },

  // PATCH /profesores/:id/estatus?estatus=0|1
  cambiarEstatus: async (id: number, estatus: 0 | 1): Promise<Profesor> => {
    const { data } = await api.patch<Profesor>(`/profesores/${id}/estatus`, null, {
      params: { estatus },
    });
    return data;
  },

  // DELETE /profesores/:id
  eliminarProfesor: async (id: number): Promise<void> => {
    await api.delete(`/profesores/${id}`);
  },

  // POST /profesores/:id/reset-password
  resetPassword: async (id: number): Promise<ResetPasswordResponse> => {
    const { data } = await api.post<ResetPasswordResponse>(`/profesores/${id}/reset-password`);
    return data;
  },

  // POST /profesores/:id/reasignar-alumnos?idprofesor_destino=X&solo_activos=true
  reasignarAlumnos: async (
    id: number,
    idprofesorDestino: number,
    soloActivos = true,
  ): Promise<ReasignarAlumnosResponse> => {
    const { data } = await api.post<ReasignarAlumnosResponse>(
      `/profesores/${id}/reasignar-alumnos`,
      null,
      { params: { idprofesor_destino: idprofesorDestino, solo_activos: soloActivos } },
    );
    return data;
  },
};