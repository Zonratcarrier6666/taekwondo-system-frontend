// ============================================================
//  src/types/usuario.types.ts
// ============================================================

// ─────────────────────────────────────────────────────────────
//  ROLES
// ─────────────────────────────────────────────────────────────
export type UserRole = 'SuperAdmin' | 'Escuela' | 'Profesor' | 'Juez' | 'Staff';

// ─────────────────────────────────────────────────────────────
//  USUARIO BASE
// ─────────────────────────────────────────────────────────────
export interface Usuario {
  idusuario:      number;
  username:       string;
  rol:            UserRole;
  fecha_creacion?: string;
}

export interface ListaUsuariosResponse {
  ok:       boolean;
  usuarios: Usuario[];
}

// ─────────────────────────────────────────────────────────────
//  DTOs DE REGISTRO — campos comunes
// ─────────────────────────────────────────────────────────────
interface RegistroBase {
  username: string;
  password: string;
  rol?:     UserRole;
}

export interface RegistroEscuelaDTO extends RegistroBase {
  nombre_escuela:   string;
  direccion?:       string;
  lema?:            string;
  telefono_oficina?: string;
}

export interface RegistroProfesorDTO extends RegistroBase {
  nombre_completo: string;
  idescuela:       number;        // requerido cuando lo crea SuperAdmin
  idgradodan?:     number;
}

export interface RegistroJuezDTO extends RegistroBase {
  nombre_completo: string;
}

export interface RegistroStaffDTO extends RegistroBase {
  nombre_completo: string;
  idescuela?:      number;
}

// Unión de todos los DTOs para el formulario genérico
export type RegistroUsuarioDTO =
  | RegistroEscuelaDTO
  | RegistroProfesorDTO
  | RegistroJuezDTO
  | RegistroStaffDTO;