// ============================================================
//  src/services/torneo.service.ts
//  Rutas exactas según torneos.py y brackets.py
// ============================================================

import api from '../api/axios';
import type {
  Torneo,
  CrearTorneoDTO,
  TorneoCategoria,
  BracketCategoria,
  BracketLive,
  CerrarCheckinResponse,
  ResultadoCombateResponse,
  AsignarJuezResponse,
  MisCombatesResponse,
} from '../types/torneo.types';

export const torneoService = {

  // ─────────────────────────────────────────────────────────
  //  TORNEOS
  // ─────────────────────────────────────────────────────────

  /** GET /torneos/lista */
  listar: async (): Promise<Torneo[]> => {
    const res = await api.get<any>('/torneos/lista');
    const raw = res.data;
    if (Array.isArray(raw))            return raw;
    if (Array.isArray(raw?.torneos))   return raw.torneos;
    if (Array.isArray(raw?.data))      return raw.data;
    return [];
  },

  /** GET /torneos/{idtorneo} */
  obtener: async (idtorneo: number): Promise<Torneo> => {
    const res = await api.get<any>(`/torneos/${idtorneo}`);
    // Respuesta: { ok: true, torneo: {...} }
    return res.data?.torneo ?? res.data;
  },

  /** POST /torneos/crear */
  crear: async (data: CrearTorneoDTO): Promise<Torneo> => {
    const res = await api.post<any>('/torneos/crear', data);
    return res.data?.torneo ?? res.data;
  },

  /** PUT /torneos/{idtorneo} */
  editar: async (idtorneo: number, data: Partial<CrearTorneoDTO>): Promise<Torneo> => {
    const res = await api.put<any>(`/torneos/${idtorneo}`, data);
    return res.data?.torneo ?? res.data;
  },

  /** GET /torneos/{idtorneo}/inscripciones — inscritos con estatus de pago */
  listarInscritos: async (idtorneo: number): Promise<any[]> => {
    const res = await api.get<any>(`/torneos/${idtorneo}/inscripciones`);
    const raw = res.data;
    if (Array.isArray(raw))              return raw;
    if (Array.isArray(raw?.inscritos))   return raw.inscritos;
    if (Array.isArray(raw?.data))        return raw.data;
    return [];
  },

  /** GET /torneos/{idtorneo}/asistencia — asistentes con QR validado */
  listarAsistencia: async (idtorneo: number): Promise<any[]> => {
    const res = await api.get<any>(`/torneos/${idtorneo}/asistencia`);
    const raw = res.data;
    if (Array.isArray(raw))              return raw;
    if (Array.isArray(raw?.asistentes))  return raw.asistentes;
    if (Array.isArray(raw?.data))        return raw.data;
    return [];
  },

  /** GET /torneos/{idtorneo}/matchmaking — categorías con sus emparejamientos */
  listarCategorias: async (idtorneo: number): Promise<TorneoCategoria[]> => {
    const res = await api.get<any>(`/torneos/${idtorneo}/matchmaking`);
    const raw = res.data;
    // El matchmaking devuelve categorías agrupadas
    if (Array.isArray(raw))                return raw;
    if (Array.isArray(raw?.categorias))    return raw.categorias;
    if (Array.isArray(raw?.data))          return raw.data;
    return [];
  },

  /** GET /torneos/{idtorneo}/alumnos-elegibles */
  alumnosElegibles: async (idtorneo: number): Promise<any[]> => {
    const res = await api.get<any>(`/torneos/${idtorneo}/alumnos-elegibles`);
    const raw = res.data;
    if (Array.isArray(raw))           return raw;
    if (Array.isArray(raw?.alumnos))  return raw.alumnos;
    if (Array.isArray(raw?.data))     return raw.data;
    return [];
  },

  // ─────────────────────────────────────────────────────────
  //  BRACKETS  (prefijo /brackets en main.py)
  // ─────────────────────────────────────────────────────────

  /** GET /brackets/torneos/{idtorneo}/bracket/live */
  bracketLive: async (idtorneo: number): Promise<BracketLive> => {
    const res = await api.get<BracketLive>(
      `/brackets/torneos/${idtorneo}/bracket/live`
    );
    return res.data;
  },

  /** GET /brackets/torneos/{idtorneo}/bracket/{idcategoria} */
  verBracket: async (idtorneo: number, idcategoria: number): Promise<BracketCategoria> => {
    const res = await api.get<BracketCategoria>(
      `/brackets/torneos/${idtorneo}/bracket/${idcategoria}`
    );
    return res.data;
  },

  /** POST /brackets/torneos/{idtorneo}/cerrar-checkin */
  cerrarCheckin: async (idtorneo: number): Promise<CerrarCheckinResponse> => {
    const res = await api.post<CerrarCheckinResponse>(
      `/brackets/torneos/${idtorneo}/cerrar-checkin`
    );
    return res.data;
  },

  /** POST /brackets/combates/{idcombate}/resultado?puntos_c1=x&puntos_c2=y */
  registrarResultado: async (
    idcombate: number,
    puntos_c1: number,
    puntos_c2: number,
  ): Promise<ResultadoCombateResponse> => {
    const res = await api.post<ResultadoCombateResponse>(
      `/brackets/combates/${idcombate}/resultado`,
      null,
      { params: { puntos_c1, puntos_c2 } }
    );
    return res.data;
  },

  /** GET /brackets/torneos/{idtorneo}/mis-combates */
  misCombates: async (idtorneo: number): Promise<MisCombatesResponse> => {
    const res = await api.get<MisCombatesResponse>(
      `/brackets/torneos/${idtorneo}/mis-combates`
    );
    return res.data;
  },

  /** POST /brackets/torneos/{idtorneo}/asignar-juez/{idusuario} */
  asignarJuez: async (idtorneo: number, idusuario: number): Promise<AsignarJuezResponse> => {
    const res = await api.post<AsignarJuezResponse>(
      `/brackets/torneos/${idtorneo}/asignar-juez/${idusuario}`
    );
    return res.data;
  },
};