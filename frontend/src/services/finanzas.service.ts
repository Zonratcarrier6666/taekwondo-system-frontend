// ============================================================
//  src/service/finanzas.service.ts
// ============================================================

import api from '../api/axios';
import {
  Pago,
  CobroRequestDTO,
  GenerarMensualidadDTO,
  ReciboImpresion,
} from '../types/finanzas.types';

// Interceptor de seguridad — se aplica una sola vez al cliente axios compartido
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const finanzasService = {
  /**
   * Obtiene la lista de pagos filtrada por estatus.
   * @param estatus 0 = Pendientes | 1 = Pagados
   */
  listarPagos: async (estatus: number = 0): Promise<Pago[]> => {
    const res = await api.get<Pago[]>(`/finanzas/?estatus=${estatus}`);
    return res.data;
  },

  /**
   * Obtiene el detalle completo de un pago.
   */
  obtenerDetalle: async (idpago: number): Promise<Pago> => {
    const res = await api.get<Pago>(`/finanzas/${idpago}`);
    return res.data;
  },

  /**
   * Registra el cobro de un cargo pendiente con desglose de métodos de pago.
   */
  registrarCobro: async (idpago: number, data: CobroRequestDTO): Promise<Pago> => {
    const res = await api.post<Pago>(`/finanzas/cobrar/${idpago}`, data);
    return res.data;
  },

  /**
   * Obtiene los datos necesarios para imprimir el recibo/ticket de un pago.
   */
  obtenerReciboImpresion: async (idpago: number): Promise<ReciboImpresion> => {
    const res = await api.get<ReciboImpresion>(`/finanzas/${idpago}/recibo-impresion`);
    return res.data;
  },

  /**
   * Sube un comprobante de pago (imagen o PDF).
   */
  subirComprobante: async (idpago: number, file: File): Promise<Pago> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<Pago>(`/finanzas/comprobante/${idpago}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Genera cargos de mensualidad de forma masiva para todos los alumnos activos.
   */
  generarMensualidadesMes: async (data: GenerarMensualidadDTO): Promise<void> => {
    await api.post('/mensualidades/mensualidades/generar-mes', data);
  },
};