// ============================================================
//  src/services/finanzas.service.ts
// ============================================================

import api from '../api/axios';
import type {
  Pago,
  CobroRequestDTO,
  GenerarMensualidadDTO,
  ReciboImpresion,
} from '../types/finanzas.types';

// ─────────────────────────────────────────────────────────────
//  TIPOS — Precios y Notificaciones
// ─────────────────────────────────────────────────────────────

export interface ConfigPrecios {
  mensualidad_default:  number;
  inscripcion_default:  number;
  examen_default:       number;
  recargo_semanal:      number;
  dias_gracia:          number;
  actualizado_en?:      string;
  actualizado_por?:     string;
}

export interface HistorialPrecio {
  fecha:           string;
  actualizado_por: string;
  precios:         Omit<ConfigPrecios, 'actualizado_en' | 'actualizado_por'>;
}

export interface PreciosResponse {
  ok:               boolean;
  idescuela:        number;
  precios_actuales: ConfigPrecios;
  historial:        HistorialPrecio[];
}

export type TipoNotificacion =
  | 'pago_pendiente'
  | 'aviso_previo'
  | 'recargo_activo'
  | 'torneo'
  | 'examen'
  | 'formulario';

export interface NotificacionResult {
  idalumno: number;
  email_ok: boolean;
  error:    string | null;
}

export interface NotificacionLoteResult {
  ok:          boolean;
  total:       number;
  resultados:  NotificacionResult[];
  enviados:    number;
  fallidos:    number;
}

export const finanzasService = {

  // ─────────────────────────────────────────────────────────
  //  LISTAR PAGOS PENDIENTES
  // ─────────────────────────────────────────────────────────
  listarPagos: async (estatus: number = 0, idescuela?: number | null): Promise<Pago[]> => {
    if (!idescuela) return [];
    const res   = await api.get<any>(`/finanzas/pagos/escuela/${idescuela}/pendientes`);
    const pagos: Pago[] = res.data?.pagos ?? [];
    return estatus === 0
      ? pagos.filter((p: any) => (p.estatus ?? 0) === 0 || p.estatus === undefined)
      : pagos.filter((p: any) => p.estatus === 1);
  },

  // ─────────────────────────────────────────────────────────
  //  REGISTRAR COBRO
  // ─────────────────────────────────────────────────────────
  registrarCobro: async (idpago: number, data: CobroRequestDTO): Promise<any> => {
    const metodoRaw = data.desglose_pagos?.[0]?.metodo ?? 'Efectivo';
    const metodoMap: Record<string, string> = {
      'Efectivo':      'Efectivo',
      'Transferencia': 'Transferencia',
      'Tarjeta':       'Tarjeta',
    };
    const res = await api.post<any>('/finanzas/pagos/cobrar', {
      idpago,
      metodo_pago: metodoMap[metodoRaw] ?? 'Efectivo',
      notas:       data.notas ?? '',
    });
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  RECIBO / TICKET
  // ─────────────────────────────────────────────────────────
  obtenerReciboImpresion: async (idpago: number): Promise<ReciboImpresion> => {
    try {
      const res = await api.get<any>(`/finanzas/pagos/recibo/${idpago}`);
      return res.data as ReciboImpresion;
    } catch {
      return { idpago } as unknown as ReciboImpresion;
    }
  },

  // ─────────────────────────────────────────────────────────
  //  SUBIR COMPROBANTE
  // ─────────────────────────────────────────────────────────
  subirComprobante: async (idpago: number, idalumno: number, file: File, notas = ''): Promise<any> => {
    const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
    const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    let firma_url: string;

    if (SUPABASE_URL && SUPABASE_ANON) {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `pagos/${idpago}/${Date.now()}.${ext}`;
      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/comprobantes/${path}`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
            'apikey':        SUPABASE_ANON,
            'Content-Type':  file.type || 'application/octet-stream',
            'x-upsert':      'true',
          },
          body: file,
        }
      );
      if (!uploadRes.ok) throw new Error(`Storage error: ${await uploadRes.text()}`);
      firma_url = `${SUPABASE_URL}/storage/v1/object/public/comprobantes/${path}`;
    } else {
      firma_url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const res = await api.post<any>('/finanzas/pagos/formulario/firma/subir', {
      idpago, idalumno, firma_url, notas,
    });
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  GENERAR MENSUALIDADES MASIVO
  // ─────────────────────────────────────────────────────────
  generarMensualidadesMes: async (data: GenerarMensualidadDTO): Promise<void> => {
    await api.post('/finanzas/pagos/mensualidad/masivo', data);
  },

  // ─────────────────────────────────────────────────────────
  //  RESUMEN ALUMNO
  // ─────────────────────────────────────────────────────────
  resumenAlumno: async (idalumno: number): Promise<any> => {
    const res = await api.get<any>(`/finanzas/pagos/alumno/${idalumno}/resumen`);
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  PRECIOS — GET configuración vigente
  // ─────────────────────────────────────────────────────────
  obtenerPrecios: async (): Promise<PreciosResponse> => {
    const res = await api.get<PreciosResponse>('/escuelas/configuracion/precios');
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  PRECIOS — PUT actualizar (guarda snapshot en historial)
  // ─────────────────────────────────────────────────────────
  actualizarPrecios: async (precios: Omit<ConfigPrecios, 'actualizado_en' | 'actualizado_por'>): Promise<PreciosResponse> => {
    const res = await api.put<PreciosResponse>('/escuelas/configuracion/precios', precios);
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  PRECIOS — GET historial de cambios (auditoría)
  // ─────────────────────────────────────────────────────────
  historialPrecios: async (): Promise<{ historial: HistorialPrecio[]; total: number }> => {
    const res = await api.get<any>('/escuelas/configuracion/precios/historial');
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  NOTIFICACIÓN INDIVIDUAL
  //  POST /finanzas/pagos/notificar
  //  tipos: pago_pendiente | aviso_previo | recargo_activo | torneo | examen | formulario
  // ─────────────────────────────────────────────────────────
  notificarAlumno: async (
    idalumno:      number,
    tipo:          TipoNotificacion,
    idpago?:       number,
    mensajeExtra?: string,
  ): Promise<NotificacionResult> => {
    const res = await api.post<NotificacionResult>('/finanzas/pagos/notificar', {
      idalumno,
      tipo,
      ...(idpago       ? { idpago }        : {}),
      ...(mensajeExtra ? { mensaje_extra: mensajeExtra } : {}),
    });
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  PROFESOR — Pagos pendientes de sus alumnos
  // ─────────────────────────────────────────────────────────
  listarPagosProfesor: async (tipo?: number): Promise<Pago[]> => {
    const params = tipo ? { tipo } : {};
    const res = await api.get<any>('/finanzas/pagos/profesor/pendientes', { params });
    return res.data?.pagos ?? [];
  },

  // ─────────────────────────────────────────────────────────
  //  PROFESOR — Historial de pagos de sus alumnos
  // ─────────────────────────────────────────────────────────
  historialProfesor: async (params: {
    buscar?:       string;
    estatus?:      number;
    id_tipo_pago?: number;
    metodo_pago?:  string;
    fecha_desde?:  string;
    fecha_hasta?:  string;
    pagina?:       number;
    por_pagina?:   number;
  } = {}): Promise<any> => {
    const res = await api.get<any>('/finanzas/pagos/profesor/historial', { params });
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  NOTIFICACIÓN POR LOTE
  //  POST /finanzas/pagos/notificar/lote
  //  Envía a todos los alumnos con pagos pendientes del tipo indicado
  // ─────────────────────────────────────────────────────────
  notificarLote: async (
    idalumnos: number[],
    tipo:      TipoNotificacion,
  ): Promise<NotificacionLoteResult> => {
    const res = await api.post<any>('/finanzas/pagos/notificar/lote', {
      idalumnos,
      tipo,
      canal: 'email',
    });
    const resultados: NotificacionResult[] = res.data?.resultados ?? [];
    return {
      ok:         res.data?.ok ?? true,
      total:      res.data?.total ?? idalumnos.length,
      resultados,
      enviados:   resultados.filter(r => r.email_ok).length,
      fallidos:   resultados.filter(r => !r.email_ok).length,
    };
  },
};