// ============================================================
//  src/services/torneo_areas.service.ts  — v2
//  Cubre todos los endpoints de areas_checkin.py
//  prefijo en backend: /torneos-v2
// ============================================================

import api from '../api/axios';

// ─── Tipos ────────────────────────────────────────────────────

export interface AreaCombate {
  idarea:              number;
  nombre_area:         string;
  estatus:             'disponible' | 'en_combate' | 'inactiva';
  idjuez_asignado:     number | null;
  juez_username:       string | null;
  combates_pendientes: number;
}

/** Competidor en la lista de check-in */
export interface CompetidorCheckin {
  idinscripcion:   number;
  idalumno:        number;
  nombre_alumno:   string;
  foto:            string | null;
  edad:            number;
  cinta:           string;
  color_cinta:     string;
  peso_declarado:  number | null;
  escuela:         string;
  idescuela:       number;
  categoria:       string;
  estatus_checkin: boolean;
  tiene_qr:        boolean;
  // campos extra de lista-completa
  area_asignada?:  string | null;
  idarea_asignada?: number | null;
  estatus_pago?:   string;
  hora_llegada?:   string | null;
  peso_bascula?:   number | null;
  asistio?:        boolean;
  lugar_obtenido?: number | null;
}

/** Datos para imprimir el gafete */
export interface GafeteData {
  nombre_alumno:  string;
  foto:           string | null;
  edad:           number;
  escuela:        string;
  categoria:      string;
  torneo:         string;
  fecha_torneo:   string;
  sede:           string;
  token_qr:       string;
  idinscripcion:  number;
}

/** Respuesta del endpoint pendientes-checkin */
export interface CheckinListaResponse {
  ok:            boolean;
  total_pagados: number;
  pendientes:    CompetidorCheckin[];
  con_checkin:   CompetidorCheckin[];
}

/** Respuesta del endpoint lista-completa */
export interface CheckinListaCompletaResponse {
  ok:              boolean;
  total:           number;
  pagados:         number;
  con_checkin:     number;
  pendientes_pago: number;
  inscritos:       CompetidorCheckin[];
}

/** Respuesta del check-in individual */
export interface CheckinResponse {
  ok:           boolean;
  mensaje:      string;
  ya_existia:   boolean;
  token_qr:     string;
  datos_gafete: GafeteData;
}

/** Respuesta del check-in en lote */
export interface CheckinLoteDetalle {
  idinscripcion: number;
  ok:            boolean;
  token_qr?:     string;
  ya_existia?:   boolean;
  error?:        string;
}

export interface CheckinLoteResponse {
  ok:       boolean;
  total:    number;
  exitosos: number;
  fallidos: number;
  detalle:  CheckinLoteDetalle[];
}

/**
 * Estado del escaneo QR — v2
 * invalido | sin_checkin | eliminado | limite_combates | area_incorrecta | listo
 */
export type EstadoQR =
  | 'invalido'
  | 'sin_checkin'
  | 'eliminado'
  | 'limite_combates'
  | 'area_incorrecta'
  | 'listo';

export interface EscaneoQRResult {
  ok:                       boolean;
  valido:                   boolean;
  estado?:                  EstadoQR;
  // datos del competidor (presentes cuando valido=true o area_incorrecta)
  competidor?: {
    idinscripcion:           number;
    nombre_alumno:           string;
    foto:                    string | null;
    edad:                    number;
    cinta:                   string;
    color_cinta:             string;
    escuela:                 string;
    categoria:               string;
    torneo:                  string;
    num_combates_realizados: number;
    tipo_torneo:             'competencia' | 'local';
    max_combates:            number | null;
    combate_activo:          CombateActivo | null;
  };
  // compat con v1 (algunos campos en raíz)
  nombre_alumno?:           string | null;
  foto?:                    string | null;
  edad?:                    number;
  cinta?:                   string | null;
  color_cinta?:             string | null;
  escuela?:                 string | null;
  idinscripcion?:           number | null;
  tipo_torneo?:             'competencia' | 'local' | null;
  num_combates_realizados?: number | null;
  max_combates?:            number | null;
  combate_activo?:          CombateActivo | null;
  mensaje:                  string;
  area_correcta?:           string | null;
  idarea_correcta?:         number | null;
  area_escaneada?:          string | null;
  lugar_obtenido?:          number | null;
  en_area_correcta?:        boolean | null;
}

export interface CombateActivo {
  idcombate:       number;
  id_competidor_1: number;
  id_competidor_2: number | null;
  ronda:           number | null;
  estatus:         string;
  idarea:          number | null;
}

export interface ResultadoLocalPayload {
  id_ganador: number;
}

export interface PodioEntry {
  idinscripcion: number;
  lugar:         1 | 2 | 3;
}

export interface MatchmakingCompetidor {
  idinscripcion:  number;
  nombre:         string;
  escuela:        string;
  peso:           number | null;
  foto?:          string | null;
  edad?:          number;
  cinta?:         string;
  color_cinta?:   string;
  orden_cinta?:   number;
  idescuela?:     number;
}

export interface MatchmakingEnfrentamiento {
  posicion:     number;
  competidor_a: MatchmakingCompetidor | null;
  competidor_b: MatchmakingCompetidor | null;
  es_bye:       boolean;
  advertencia?: string | null;
}

export interface MatchmakingCategoria {
  idcategoria:      number;
  nombre_categoria: string;
  total:            number;
  enfrentamientos:  MatchmakingEnfrentamiento[];
}

export interface MatchmakingPreview {
  ok:         boolean;
  idtorneo:   number;
  categorias: MatchmakingCategoria[];
  nota?:      string;
}

// ─── Helpers internos ────────────────────────────────────────

/**
 * Normaliza la respuesta del escaneo QR para que siempre tenga
 * los campos en raíz (compat v1 + v2).
 */
function normalizarEscaneo(data: any): EscaneoQRResult {
  const comp = data.competidor ?? {};
  return {
    ...data,
    // si vienen en competidor, los exponemos también en raíz
    nombre_alumno:           data.nombre_alumno           ?? comp.nombre_alumno           ?? null,
    foto:                    data.foto                    ?? comp.foto                    ?? null,
    edad:                    data.edad                    ?? comp.edad,
    cinta:                   data.cinta                   ?? comp.cinta                   ?? null,
    color_cinta:             data.color_cinta             ?? comp.color_cinta             ?? null,
    escuela:                 data.escuela                 ?? comp.escuela                 ?? null,
    idinscripcion:           data.idinscripcion           ?? comp.idinscripcion           ?? null,
    tipo_torneo:             data.tipo_torneo             ?? comp.tipo_torneo             ?? null,
    num_combates_realizados: data.num_combates_realizados ?? comp.num_combates_realizados ?? null,
    max_combates:            data.max_combates            ?? comp.max_combates            ?? null,
    combate_activo:          data.combate_activo          ?? comp.combate_activo          ?? null,
    // en_area_correcta: true si listo, false si area_incorrecta, null si inválido
    en_area_correcta: data.estado === 'listo'
      ? true
      : data.estado === 'area_incorrecta'
      ? false
      : data.en_area_correcta ?? null,
  };
}

// ─── Service ─────────────────────────────────────────────────

const BASE = '/torneos-v2';

export const torneoAreasService = {

  // ── ÁREAS ─────────────────────────────────────────────────

  listarAreas: async (idtorneo: number): Promise<AreaCombate[]> => {
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/areas`);
    return data.areas ?? [];
  },

  crearArea: async (idtorneo: number, payload: {
    nombre_area: string;
    idjuez_asignado?: number | null;
  }) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/areas`, payload);
    return data;
  },

  editarArea: async (idtorneo: number, idarea: number, payload: {
    nombre_area?:     string;
    idjuez_asignado?: number | null;
    estatus?:         'disponible' | 'en_combate' | 'inactiva';
  }) => {
    const { data } = await api.put(`${BASE}/torneos/${idtorneo}/areas/${idarea}`, payload);
    return data;
  },

  eliminarArea: async (idtorneo: number, idarea: number) => {
    const { data } = await api.delete(`${BASE}/torneos/${idtorneo}/areas/${idarea}`);
    return data;
  },

  asignarCombateAArea: async (idtorneo: number, idarea: number, idcombate: number) => {
    const { data } = await api.post(
      `${BASE}/torneos/${idtorneo}/areas/${idarea}/asignar-combate/${idcombate}`
    );
    return data;
  },

  // ── CHECK-IN ───────────────────────────────────────────────

  /** Inscritos pagados — separados en pendientes y con_checkin */
  pendientesCheckin: async (idtorneo: number, idescuela?: number): Promise<CheckinListaResponse> => {
    const params = idescuela ? { idescuela } : {};
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/checkin/pendientes`, { params });
    return data;
  },

  /** Lista completa con todos los estados */
  listaCompletaCheckin: async (
    idtorneo: number,
    idescuela?: number,
    buscar?: string,
  ): Promise<CheckinListaCompletaResponse> => {
    const params: Record<string, any> = {};
    if (idescuela) params.idescuela = idescuela;
    if (buscar)    params.buscar    = buscar;
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/checkin/lista-completa`, { params });
    return data;
  },

  /** Check-in individual — genera QR y devuelve GafeteData */
  hacerCheckin: async (
    idtorneo: number,
    idinscripcion: number,
    peso_bascula?: number,
  ): Promise<CheckinResponse> => {
    const { data } = await api.post(
      `${BASE}/torneos/${idtorneo}/checkin/${idinscripcion}`,
      peso_bascula !== undefined ? { peso_bascula } : {},
    );
    return data;
  },

  /** Check-in en lote */
  checkinLote: async (idtorneo: number, idinscripciones: number[]): Promise<CheckinLoteResponse> => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/checkin/lote`, {
      idinscripciones,
    });
    return data;
  },

  /** Descargar PDF del gafete (devuelve blob URL) */
  gafetePdfUrl: (idtorneo: number, idinscripcion: number): string =>
    `${api.defaults.baseURL}${BASE}/torneos/${idtorneo}/checkin/${idinscripcion}/gafete-pdf`,

  // ── ESCANEO QR ─────────────────────────────────────────────

  escanearQR: async (token: string, idarea?: number): Promise<EscaneoQRResult> => {
    const { data } = await api.post(`${BASE}/qr/escanear`, {
      token,
      idarea: idarea ?? null,
    });
    return normalizarEscaneo(data);
  },

  invalidarQR: async (idinscripcion: number, lugar?: number) => {
    const { data } = await api.post(`${BASE}/qr/invalidar/${idinscripcion}`, {
      lugar: lugar ?? null,
    });
    return data;
  },

  /** Descalifica a un competidor por ausencia — desactiva su QR */
  descalificarCompetidor: async (
    idtorneo: number,
    idinscripcion: number,
    motivo = 'No se presentó al área de combate',
  ) => {
    const { data } = await api.post(
      `${BASE}/torneos/${idtorneo}/qr/descalificar/${idinscripcion}`,
      { motivo },
    );
    return data;
  },

  // ── RESULTADO LOCAL ────────────────────────────────────────

  resultadoLocal: async (idcombate: number, ganadorId: number) => {
    const { data } = await api.post(`${BASE}/combates/${idcombate}/resultado-local`, {
      id_ganador: ganadorId,
    });
    return data;
  },

  // ── PODIO ──────────────────────────────────────────────────

  asignarPodio: async (idtorneo: number, podio: PodioEntry[]) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/podio`, { podio });
    return data;
  },

  resultadosLocal: async (idtorneo: number) => {
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/resultados-local`);
    return data;
  },

  // ── MATCHMAKING ────────────────────────────────────────────

  matchmakingPreview: async (
    idtorneo: number,
    idcategoria?: number,
  ): Promise<MatchmakingPreview> => {
    const params = idcategoria ? { idcategoria } : {};
    const { data } = await api.get(
      `${BASE}/torneos/${idtorneo}/matchmaking/preview`, { params }
    );
    return data;
  },

  reasignarMatchmaking: async (idtorneo: number, payload: {
    idinscripcion_a: number;
    idinscripcion_b: number;
  }) => {
    const { data } = await api.put(
      `${BASE}/torneos/${idtorneo}/matchmaking/reasignar`, payload
    );
    return data;
  },

  confirmarMatchmaking: async (idtorneo: number) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/matchmaking/confirmar`);
    return data;
  },
};