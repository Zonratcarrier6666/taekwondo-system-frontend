/**
 * Definiciones de tipos globales para el sistema TKW.
 * Asegúrate de que este archivo contenga todos los exports necesarios.
 */

export type Role = 'SuperAdmin' | 'Escuela' | 'Profesor' | 'Juez';
export type ThemeName = 'default' | 'light' | 'dark' | 'rojo-dragon' | 'auto';

export interface User {
  username: string;
  rol: Role;
  tema: ThemeName;
}

/**
 * Interfaz Escuela: Asegúrate de que esté exportada así.
 */
export interface Escuela {
  idescuela: number;
  idusuario: number;
  nombreescuela: string;
  direccion?: string;
  lema?: string;
  logo_url?: string;
  correo_escuela?: string;
  telefono_oficina?: string;
  color_paleta: string;
}

export interface AuthContextType {
  user: User | null;
  login: (token: string, role: Role, username: string) => void;
  logout: () => void;
  isInitializing: boolean;
  setTheme: (theme: ThemeName) => void;
  currentTheme: ThemeName;
}

export interface Alumno {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  idgradoactual: number;
  fotoalumno?: string;
}