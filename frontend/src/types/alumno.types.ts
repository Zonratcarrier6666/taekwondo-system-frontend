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