import axios from 'axios';
import { Pago, CobroRequestDTO, GenerarMensualidadDTO } from '../types/finanzas.types';

const api = axios.create({
  baseURL: 'https://taekwondo-system-api.onrender.com',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor de seguridad (usando la clave access_token verificada en Storage)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const finanzasService = {
  /**
   * Obtiene la lista de pagos filtrada por estatus
   * @param estatus 0: Pendientes, 1: Pagados
   */
  listarPagos: async (estatus: number = 0): Promise<Pago[]> => {
    const res = await api.get<Pago[]>(`/finanzas/?estatus=${estatus}`);
    return res.data;
  },

  /**
   * Obtiene el detalle de un pago específico
   */
  obtenerDetalle: async (idpago: number): Promise<Pago> => {
    const res = await api.get<Pago>(`/finanzas/${idpago}`);
    return res.data;
  },

  /**
   * Registra el cobro completo de un cargo pendiente
   */
  registrarCobro: async (idpago: number, data: CobroRequestDTO): Promise<Pago> => {
    const res = await api.post<Pago>(`/finanzas/cobrar/${idpago}`, data);
    return res.data;
  },

  /**
   * Sube un comprobante de pago (Imagen/PDF)
   */
  subirComprobante: async (idpago: number, file: File): Promise<Pago> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<Pago>(`/finanzas/comprobante/${idpago}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  /**
   * Generación masiva de mensualidades para toda la escuela
   */
  generarMensualidadesMes: async (data: GenerarMensualidadDTO): Promise<any> => {
    const res = await api.post('/mensualidades/mensualidades/generar-mes', data);
    return res.data;
  }
};