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
export interface EscuelaStats {
  total_alumnos: number;
  ingresos_semanales: number;           // nota: es "ingresos_semanales" no "ingresos_semanaLes"
  pagos_pendientes_count: number;
  alumnos_torneo_count: number;         // probablemente "alumnos_torneo_count"
  distribucion_cintas: Array<{
    color: string;
    count: number;
  }>;
  finanzas_semana: Array<{
    dia: string;
    monto: number;                      // o string si viene como "$1,200"
  }>;
  proximos_torneos: Array<any>;         // ajusta según lo que traiga
  // [key: string]: any;                // opcional para campos extras
}