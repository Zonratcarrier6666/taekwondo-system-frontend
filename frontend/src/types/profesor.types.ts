/**
 * ARCHIVO: src/types/profesor.types.ts
 */

export interface Profesor {
  idprofesor:     number;
  idusuario:      number;
  idescuela:      number;
  nombrecompleto: string;
  email:          string | null;
  telefono:       string | null;
  especialidad:   string | null;
  idgradodan:     number;
  foto_url:       string | null;
  estatus:        number;
  fecharegistro:  string | null;
  // Campos extra que devuelve el backend en algunos endpoints
  _password_temporal?: string;
  _advertencia?:       string;
}

// POST /profesores/ — crear profesor
export interface CrearProfesorDTO {
  username:       string;
  nombrecompleto: string;
  especialidad?:  string;
  telefono?:      string;
  idgradodan:     number;
}

// PUT /profesores/:id — actualizar profesor
export interface ActualizarProfesorDTO {
  nombrecompleto?: string;
  email?:          string;
  telefono?:       string;
  especialidad?:   string;
  idgradodan?:     number;
  estatus?:        number;
}

// PATCH /profesores/:id/estatus
export interface CambiarEstatusResponse extends Profesor {
  _advertencia?: string;
}

// POST /profesores/:id/reset-password
export interface ResetPasswordResponse {
  ok:                boolean;
  idprofesor:        number;
  password_temporal: string;
  mensaje:           string;
}

// POST /profesores/:id/reasignar-alumnos
export interface ReasignarAlumnosResponse {
  reasignados: number;
  mensaje:     string;
}