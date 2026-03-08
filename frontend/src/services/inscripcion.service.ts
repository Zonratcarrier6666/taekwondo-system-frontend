// ============================================================
//  src/services/inscripcion.service.ts
// ============================================================

import api from '../api/axios';
import type {
  TorneoResumen,
  AlumnosElegiblesResponse,
  InscribirConPesoDTO,
  InscribirLoteResponse,
} from '../types/inscripcion.types';

export const inscripcionService = {

  // ─────────────────────────────────────────────────────────
  //  TORNEOS  GET /torneos/lista
  // ─────────────────────────────────────────────────────────
  listarTorneos: async (): Promise<TorneoResumen[]> => {
    const res = await api.get<any>('/torneos/lista');
    const raw = res.data;
    if (Array.isArray(raw))          return raw;
    if (Array.isArray(raw?.torneos)) return raw.torneos;
    return [];
  },

  // ─────────────────────────────────────────────────────────
  //  ALUMNOS ELEGIBLES  GET /torneos/{id}/alumnos-elegibles
  // ─────────────────────────────────────────────────────────
  alumnosElegibles: async (idtorneo: number): Promise<AlumnosElegiblesResponse> => {
    const res = await api.get<AlumnosElegiblesResponse>(
      `/torneos/${idtorneo}/alumnos-elegibles`
    );
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  INSCRIBIR CON PESO INDIVIDUAL
  //  POST /torneos/{id}/inscribir/con-peso
  // ─────────────────────────────────────────────────────────
  inscribirConPeso: async (
    idtorneo: number,
    data: InscribirConPesoDTO,
  ): Promise<InscribirLoteResponse> => {
    const res = await api.post<InscribirLoteResponse>(
      `/torneos/${idtorneo}/inscribir/con-peso`,
      { idtorneo, ...data },   // el schema requiere idtorneo también en el body
    );
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  GENERAR QR  POST /torneos/{id}/generar-qr/{idalumno}
  //  (solo cuando el pago ya está confirmado)
  // ─────────────────────────────────────────────────────────
  generarQR: async (idtorneo: number, idalumno: number): Promise<any> => {
    const res = await api.post<any>(
      `/torneos/${idtorneo}/generar-qr/${idalumno}`
    );
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  DESCARGAR QR PDF  GET /torneos/{id}/descargar-qr/{idalumno}
  // ─────────────────────────────────────────────────────────
  descargarQRUrl: (idtorneo: number, idalumno: number): string =>
    `/torneos/${idtorneo}/descargar-qr/${idalumno}`,

  // ─────────────────────────────────────────────────────────
  //  INSCRIPCIONES DEL TORNEO  GET /torneos/{id}/inscripciones
  // ─────────────────────────────────────────────────────────
  listarInscritos: async (idtorneo: number): Promise<any[]> => {
    const res = await api.get<any>(`/torneos/${idtorneo}/inscripciones`);
    const raw = res.data;
    if (Array.isArray(raw))             return raw;
    if (Array.isArray(raw?.inscritos))  return raw.inscritos;
    return [];
  },
};