/**
 * Estructura para el desglose de deudas en el detalle del alumno.
 */
export interface PagoPendienteDetalle {
  idpago: number;
  monto: number;
  concepto: string;
  fecharegistro: string;
  id_tipo_pago: number;
}

/**
 * Interfaz principal del Alumno integrada con lógica técnica y financiera.
 */
export interface Alumno {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  apellidomaterno: string;
  fechanacimiento: string;
  fotoalumno: string;
  idgradoactual: number;
  idprofesor: number | null;
  idescuela: number;
  tipo_sangre: string;
  alergias: string;
  nombretutor: string;
  telefonocontacto: string;
  // Campos financieros calculados en el backend
  total_deuda: number;
  conteo_pendientes: number;
  pagos_pendientes_detalle: PagoPendienteDetalle[];
}

/**
 * DTO para la creación de nuevos registros.
 */
export interface AlumnoCreateDTO {
  nombres: string;
  apellidopaterno: string;
  apellidomaterno: string;
  fechanacimiento: string;
  idgradoactual: number;
  idprofesor: number | null;
  nombretutor: string;
  telefonocontacto: string;
  direcciondomicilio: string;
  contacto_emergencia_nombre: string;
  contacto_emergencia_tel: string;
  tipo_sangre: string;
  alergias: string;
}

/**
 * DTO para actualizaciones parciales.
 */
export type AlumnoUpdateDTO = Partial<AlumnoCreateDTO>;

/**
 * Definición de Roles de Usuario
 */
export type Role = 'Admin' | 'Escuela' | 'Profesor' | 'Alumno' | 'Staff' | 'Juez';

/**
 * Nombres de temas disponibles
 */
export type ThemeName = 'light' | 'dark' | 'auto' | 'P-rojo' | 'P-azul' | 'P-oro';

/**
 * Estructura del Usuario que viene del Backend
 */
export interface User {
  username: string;
  role: Role;
  tema?: ThemeName;
  // Agrega estos campos para silenciar los errores de Dashboard
  nombre?: string;
  name?: string;
  idusuario?: number;
  id?: number;
}

/**
 * Definición del Contexto de Autenticación
 */
export interface AuthContextType {
  user: User | null;
  role: Role | null;
  isInitializing: boolean;
  currentTheme: ThemeName;
  login: (token: string, role: Role, username: string) => void;
  logout: () => void;
  setTheme: (theme: ThemeName) => void;
}
export interface Escuela {
  id: number;
  nombre: string;
  nombreescuela?: string;   // ← nombre que usa el backend
  direccion?: string;
  telefono?: string;
  logo_url?: string;
  color_paleta?: string; 
  lema?: string;
  telefono_oficina?: string;
  correo_escuela?: string;   // ← tema de color de la escuela
}