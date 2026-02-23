// ============================================================
//  src/types/finanzas.types.ts
// ============================================================

export interface AlumnoPago {
  nombres: string;
  apellidopaterno: string;
  nombre_completo?: string;
  id_interno?: number;
}

export interface DesgloseItem {
  monto: number;
  metodo: 'Efectivo' | 'Transferencia' | 'Tarjeta';
}

export interface Pago {
  idpago: number;
  idalumno: number;
  concepto: string;
  monto: number;
  estatus: 0 | 1;           // 0: pendiente | 1: pagado
  id_tipo_pago: number;
  metodo_pago?: string;
  fecharegistro: string;
  url_comprobante?: string;
  alumno?: AlumnoPago;
  desglose?: DesgloseItem[];
}

// ---- DTOs de request ----

export interface CobroRequestDTO {
  desglose_pagos: DesgloseItem[];
  notas: string;
}

export interface GenerarMensualidadDTO {
  mes: number;
  anio: number;
  monto_estandar: number;
  concepto_prefijo: string;
  dia_corte: number;
}

// ---- Recibo / Ticket ----

export interface EscuelaTicket {
  nombre: string;
  logo_url?: string;
}

export interface AlumnoTicket {
  nombre_completo: string;
  id_interno: number;
}

export interface PagoTicket {
  concepto: string;
  monto: number;
  desglose?: DesgloseItem[];
}

export interface MetadataTicket {
  folio: string;
  status_texto: 'PENDIENTE' | 'PAGADO';
  fecha_impresion: string;
}

export interface ReciboImpresion {
  escuela: EscuelaTicket;
  alumno: AlumnoTicket;
  pago: PagoTicket;
  metadata: MetadataTicket;
}