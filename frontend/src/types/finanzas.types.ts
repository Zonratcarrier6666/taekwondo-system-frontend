// ============================================================
//  src/types/finanzas.types.ts
//  Sincronizado con app/schemas/pagos.py
// ============================================================

// ─── Enums (espejo de Python) ────────────────────────────────

export type TipoPago = 1 | 2 | 3 | 4 | 5;
// 1=MENSUALIDAD | 2=INSCRIPCION | 3=EXAMEN | 4=TORNEO | 5=OTRO

export type EstatusPago = 0 | 1 | 2 | 3;
// 0=PENDIENTE | 1=PAGADO | 2=CANCELADO | 3=VENCIDO

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro';

export type CicloSemestral = 'ENE-JUN' | 'JUL-DIC';

// ─── Alumno embebido en Pago ──────────────────────────────────

export interface AlumnoPago {
  idalumno:        number;
  nombres:         string;
  apellidopaterno: string;
  apellidomaterno?: string;
}

// ─── Pago principal ──────────────────────────────────────────

export interface Pago {
  idpago:              number;
  idalumno:            number;
  id_tipo_pago:        TipoPago;
  estatus:             EstatusPago;
  monto:               number;
  concepto:            string;
  mes_correspondiente?: string;   // "YYYY-MM" (mensualidades)
  ciclo?:              CicloSemestral;
  year?:               number;
  metodo_pago?:        MetodoPago;
  url_comprobante?:    string;
  notas?:              string;
  fecharegistro:       string;    // ISO string
  fecha_pago?:         string;    // ISO string cuando estatus=1
  alumno?:             AlumnoPago;
}

// ─── DTOs de cobro ───────────────────────────────────────────

/** Un ítem del desglose de pago dividido (local, UI only) */
export interface DesgloseItem {
  monto:  number;
  metodo: MetodoPago;
}

/** Lo que envía el frontend al confirmar cobro */
export interface CobroRequestDTO {
  desglose_pagos?: DesgloseItem[];  // solo para UI; se aplana antes de enviar
  notas?:          string;
}

/** Payload real que recibe POST /finanzas/pagos/cobrar  (RegistrarPago) */
export interface RegistrarPagoPayload {
  idpago:          number;
  metodo_pago:     MetodoPago;
  url_comprobante?: string;
  notas?:          string;
}

// ─── Generar mensualidades masivo ────────────────────────────

/** Espejo de GenerarPagosMasivosMensualidad */
export interface GenerarMensualidadDTO {
  idescuela:               number;
  mes_correspondiente:     string;   // "YYYY-MM"
  monto_default:           number;
  dia_cobro_default?:      number;   // 1-28, default 1
  sobrescribir_existentes?: boolean;
}

// ─── Recibo / ticket ─────────────────────────────────────────

export interface ReciboImpresion {
  idpago:          number;
  alumno?:         AlumnoPago;
  concepto?:       string;
  monto?:          number;
  metodo_pago?:    MetodoPago;
  fecha_pago?:     string;
  notas?:          string;
  escuela?:        { nombre: string; logo_url?: string };
}

// ─── Resumen alumno  (ResumenPagosAlumno) ────────────────────

export interface ResumenAlumno {
  idalumno:                 number;
  nombres:                  string;
  apellidopaterno:          string;
  mensualidades_pagadas:    number;
  mensualidades_pendientes: number;
  inscripcion_ciclo_actual?: string;
  formulario_status?:       string;
  total_adeudo:             number;
  dia_cobro:                number;
  monto_mensualidad:        number;
}