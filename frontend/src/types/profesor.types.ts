/**
 * ARCHIVO: src/types/profesor.types.ts
 * Definiciones de interfaces para la gestión de profesores.
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

/**
 * Interfaz para actualizaciones parciales.
 * Asegúrate de que esta exportación esté presente en tu archivo local.
 */
export interface ActualizarProfesorDTO {
  nombrecompleto?: string;
  email?: string;
  telefono?: string;
  idgradodan?: number;
  estatus?: number;
  foto_url?: string;
}