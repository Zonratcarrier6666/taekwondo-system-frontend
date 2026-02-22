/**
 * Interfaz para el desglose interno de un pago (Ejem: Parte en efectivo, parte transferencia)
 */
export interface DesglosePago {
  monto: number;
  metodo: string; // 'Efectivo', 'Transferencia', 'Tarjeta'
}

/**
 * Información del alumno vinculada al pago
 */
export interface AlumnoResumen {
  nombres: string;
  apellidopaterno: string;
  apellidomaterno: string;
}

/**
 * Interfaz principal de un Registro Financiero (Pago/Cargo)
 */
export interface Pago {
  idpago: number;
  idalumno: number;
  idescuela: number;
  monto: number;
  concepto: string;
  id_tipo_pago: number; // 1: Mensualidad, 2: Examen, 3: Equipo, etc.
  id_referencia_evento?: number | null;
  notas_adicionales?: string;
  folio_recibo?: string;
  estatus: number; // 0: Pendiente, 1: Pagado, 2: Cancelado
  metodo_pago?: string;
  fecha_pago?: string;
  fecharegistro: string;
  url_comprobante?: string;
  desglose_interno?: DesglosePago[] | null;
  alumno?: AlumnoResumen;
}

/**
 * DTO para registrar un cobro
 */
export interface CobroRequestDTO {
  desglose_pagos: DesglosePago[];
  notas: string;
}

/**
 * DTO para generación masiva de mensualidades
 */
export interface GenerarMensualidadDTO {
  mes: number;
  anio: number;
  monto_estandar: number;
  concepto_prefijo: string; // Ejem: "Mensualidad"
  dia_corte: number;
}