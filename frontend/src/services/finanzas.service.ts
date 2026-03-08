// ============================================================
//  src/services/finanzas.service.ts
//  Rutas reales según pagos.py (prefix /finanzas en main.py)
// ============================================================

import api from '../api/axios';
import type {
  Pago,
  CobroRequestDTO,
  GenerarMensualidadDTO,
  ReciboImpresion,
} from '../types/finanzas.types';

export const finanzasService = {

  // ─────────────────────────────────────────────────────────
  //  LISTAR PAGOS
  //  tab 0 = Pendientes  → GET /finanzas/escuela/{id}/pendientes
  //  tab 1 = Historial   → mismo endpoint (solo hay pendientes por escuela)
  //  idescuela se obtiene en el componente desde /escuelas/mi-escuela
  // ─────────────────────────────────────────────────────────
  listarPagos: async (estatus: number = 0, idescuela?: number | null): Promise<Pago[]> => {
    if (!idescuela) return [];
    const res = await api.get<any>(`/finanzas/pagos/escuela/${idescuela}/pendientes`);
    const pagos: Pago[] = res.data?.pagos ?? [];

    // Tab 0 = pendientes (estatus 0), Tab 1 = ya pagados (estatus 1)
    // El endpoint solo devuelve pendientes, así que tab 1 queda vacío
    // hasta que el backend tenga endpoint de historial
    return estatus === 0
      ? pagos.filter((p: any) => (p.estatus ?? 0) === 0 || p.estatus === undefined)
      : pagos.filter((p: any) => p.estatus === 1);
  },

  // ─────────────────────────────────────────────────────────
  //  REGISTRAR COBRO  POST /finanzas/cobrar
  //  body: { idpago, metodo_pago, notas }
  // ─────────────────────────────────────────────────────────
  registrarCobro: async (idpago: number, data: CobroRequestDTO): Promise<any> => {
    const metodoRaw = data.desglose_pagos?.[0]?.metodo ?? 'Efectivo';
    // Mapear a los valores del enum del backend
    const metodoMap: Record<string, string> = {
      'Efectivo':      'Efectivo',
      'Transferencia': 'Transferencia',
      'Tarjeta':       'Tarjeta',
    };
    const payload = {
      idpago,
      metodo_pago: metodoMap[metodoRaw] ?? 'Efectivo',
      notas:       data.notas ?? '',
    };
    const res = await api.post<any>('/finanzas/pagos/cobrar', payload);
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  RECIBO/TICKET
  //  No hay endpoint dedicado — construimos datos del pago local
  // ─────────────────────────────────────────────────────────
  obtenerReciboImpresion: async (idpago: number): Promise<ReciboImpresion> => {
    // Intentar endpoint de resumen si existe, si no retornar vacío
    try {
      const res = await api.get<any>(`/finanzas/pagos/recibo/${idpago}`);
      return res.data as ReciboImpresion;
    } catch {
      // Fallback: retornar estructura mínima para no romper el modal
      return { idpago } as unknown as ReciboImpresion;
    }
  },

  // ─────────────────────────────────────────────────────────
  //  SUBIR COMPROBANTE
  //  Flujo: upload directo a Supabase Storage → URL pública → POST al backend
  //  El endpoint /finanzas/pagos/formulario/firma/subir espera JSON:
  //    { idpago, firma_url, notas }
  // ─────────────────────────────────────────────────────────
  subirComprobante: async (idpago: number, idalumno: number, file: File, notas = ''): Promise<any> => {

    // Estrategia A: Supabase Storage (si hay ANON KEY configurada)
    const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
    const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    let firma_url: string;

    if (SUPABASE_URL && SUPABASE_ANON) {
      // Subir binario a Supabase Storage
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
      // Estrategia B: convertir imagen a base64 data URL
      // Solo se aceptan imágenes — el backend guarda el string en url_comprobante
      firma_url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Llamar al endpoint con la URL (Supabase Storage URL o data URL)
    const res = await api.post<any>('/finanzas/pagos/formulario/firma/subir', {
      idpago,
      idalumno,
      firma_url,
      notas,
    });
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  GENERAR MENSUALIDADES MASIVO  POST /finanzas/mensualidad/masivo
  // ─────────────────────────────────────────────────────────
  generarMensualidadesMes: async (data: GenerarMensualidadDTO): Promise<void> => {
    await api.post('/finanzas/pagos/mensualidad/masivo', data);
  },

  // ─────────────────────────────────────────────────────────
  //  RESUMEN ALUMNO  GET /finanzas/alumno/{idalumno}/resumen
  // ─────────────────────────────────────────────────────────
  resumenAlumno: async (idalumno: number): Promise<any> => {
    const res = await api.get<any>(`/finanzas/pagos/alumno/${idalumno}/resumen`);
    return res.data;
  },
};