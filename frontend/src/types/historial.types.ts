// ============================================================
//  src/types/historial.types.ts
// ============================================================

export interface PagoHistorial {
  idpago:            number;
  idalumno:          number;
  idescuela:         number;
  concepto:          string;
  monto:             number;
  estatus:           0 | 1;          // 0=Pendiente 1=Pagado
  id_tipo_pago:      1 | 2 | 3 | 4; // 1=Mensualidad 2=Inscripcion 3=Otro 4=Torneo
  metodo_pago:       string | null;
  folio_recibo:      string | null;
  fecha_pago:        string | null;
  fecharegistro:     string;
  notas_adicionales: string | null;
  url_comprobante:   string | null;
  alumno?: {
    nombres:         string;
    apellidopaterno: string;
  };
}

export interface HistorialResponse {
  ok:               boolean;
  total:            number;
  total_monto:      number;
  total_pagados:    number;
  total_pendientes: number;
  pagina:           number;
  por_pagina:       number;
  paginas:          number;
  pagos:            PagoHistorial[];
}

export interface HistorialFiltros {
  estatus?:      '' | '0' | '1';
  id_tipo_pago?: '' | '1' | '2' | '3' | '4';
  metodo_pago?:  '' | 'Efectivo' | 'Transferencia' | 'Tarjeta';
  buscar?:       string;
  fecha_desde?:  string;
  fecha_hasta?:  string;
  pagina:        number;
}

export const TIPO_PAGO_LABEL: Record<number, string> = {
  1: 'Mensualidad',
  2: 'Inscripción',
  3: 'Otro',
  4: 'Torneo',
};

export const METODO_COLOR: Record<string, string> = {
  'Efectivo':      '#10b981',
  'Transferencia': '#3b82f6',
  'Tarjeta':       '#8b5cf6',
  'Otro':          '#6b7280',
};