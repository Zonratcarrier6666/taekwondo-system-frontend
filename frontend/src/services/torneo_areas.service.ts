// ============================================================
//  src/services/torneo_areas.service.ts
//  Cubre todos los endpoints de areas_checkin.py
//  prefijo en backend: /torneos-v2
// ============================================================

import api from '../api/axios'; // axios instance con baseURL y token

// ─── Tipos ────────────────────────────────────────────────────

export interface AreaCombate {
  idarea:              number;
  nombre_area:         string;
  estatus:             'disponible' | 'en_combate' | 'inactiva';
  idjuez_asignado:     number | null;
  juez_username:       string | null;
  combates_pendientes: number;
}

export interface CheckinPendiente {
  idinscripcion:    number;
  idtorneo:         number;
  nombre_alumno:    string;
  escuela:          string;
  categoria:        string;
  peso:             number | null;
  talla:            number | null;
  estatus_checkin:  boolean;
  foto:             string | null;
}

export interface EscaneoQRResult {
  ok:                       boolean;
  valido:                   boolean;
  en_area_correcta?:        boolean;
  nombre_alumno?:           string;
  foto?:                    string | null;
  edad?:                    number;
  cinta?:                   string;
  color_cinta?:             string;
  escuela?:                 string;
  idinscripcion?:           number;
  idtorneo?:                number;
  tipo_torneo?:             'competencia' | 'local';
  num_combates_realizados?: number;
  max_combates?:            number | null;
  combate_activo?:          CombateActivo | null;
  mensaje:                  string;
  area_correcta?:           string | null;
  area_escaneada?:          string | null;
  lugar_obtenido?:          number | null;
}

export interface CombateActivo {
  idcombate:        number;
  id_competidor_1:  number;
  id_competidor_2:  number | null;
  ronda:            string | null;
  estatus:          string;
  idarea:           number | null;
}

export interface ResultadoLocalPayload {
  id_ganador: number;
}

export interface PodioEntry {
  idinscripcion: number;
  lugar:         1 | 2 | 3;
}

export interface MatchmakingCompetidor {
  idinscripcion: number;
  nombre:        string;
  escuela:       string;
  peso:          number | null;
}

export interface MatchmakingEnfrentamiento {
  posicion:      number;
  competidor_a:  MatchmakingCompetidor | null;
  competidor_b:  MatchmakingCompetidor | null;
  es_bye:        boolean;
  advertencia?:  string | null;
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

// ─── Service ─────────────────────────────────────────────────

const BASE = '/torneos-v2';

export const torneoAreasService = {

  // ── ÁREAS ─────────────────────────────────────────────────

  /** Listar áreas/rings del torneo */
  listarAreas: async (idtorneo: number): Promise<AreaCombate[]> => {
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/areas`);
    return data.areas ?? [];
  },

  /** Crear área (SuperAdmin) */
  crearArea: async (idtorneo: number, payload: {
    nombre_area: string;
    idjuez_asignado?: number | null;
  }) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/areas`, payload);
    return data;
  },

  /** Editar área: renombrar, reasignar juez, cambiar estatus */
  editarArea: async (idtorneo: number, idarea: number, payload: {
    nombre_area?:     string;
    idjuez_asignado?: number | null;
    estatus?:         'disponible' | 'en_combate' | 'inactiva';
  }) => {
    const { data } = await api.put(`${BASE}/torneos/${idtorneo}/areas/${idarea}`, payload);
    return data;
  },

  /** Eliminar área */
  eliminarArea: async (idtorneo: number, idarea: number) => {
    const { data } = await api.delete(`${BASE}/torneos/${idtorneo}/areas/${idarea}`);
    return data;
  },

  /** Asignar combate específico a un área */
  asignarCombateAArea: async (idtorneo: number, idarea: number, idcombate: number) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/areas/${idarea}/asignar-combate/${idcombate}`);
    return data;
  },

  // ── CHECK-IN ───────────────────────────────────────────────

  /** Obtener inscritos pagados sin check-in */
  checkinPendientes: async (idtorneo: number): Promise<CheckinPendiente[]> => {
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/checkin/pendientes`);
    return data.pendientes ?? [];
  },

  /** Confirmar llegada individual y generar QR */
  hacerCheckin: async (idtorneo: number, idinscripcion: number) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/checkin/${idinscripcion}`);
    return data; // { ok, idinscripcion, nombre, token_qr, qr_url }
  },

  /** Confirmar varios a la vez */
  checkinLote: async (idtorneo: number, idinscripciones: number[]) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/checkin/lote`, {
      idinscripciones,
    });
    return data;
  },

  // ── ESCANEO QR ─────────────────────────────────────────────

  /**
   * Juez escanea QR del gafete.
   * @param token   — contenido del QR escaneado
   * @param idarea  — área donde está el juez (opcional)
   */
  escanearQR: async (token: string, idarea?: number): Promise<EscaneoQRResult> => {
    const { data } = await api.post(`${BASE}/qr/escanear`, {
      token,
      idarea: idarea ?? null,
    });
    return data;
  },

  /** Invalida el QR al perder (competencia) o asigna lugar (local) */
  invalidarQR: async (idinscripcion: number, lugar?: number) => {
    const { data } = await api.post(`${BASE}/qr/invalidar/${idinscripcion}`, {
      lugar: lugar ?? null,
    });
    return data;
  },

  // ── RESULTADO LOCAL ────────────────────────────────────────

  /** Juez declara ganador en modalidad local (sin puntos) */
  registrarResultadoLocal: async (idcombate: number, payload: ResultadoLocalPayload) => {
    const { data } = await api.post(`${BASE}/combates/${idcombate}/resultado-local`, payload);
    return data; // { ok, idcombate, id_ganador, id_perdedor, mensaje }
  },

  // ── PODIO ──────────────────────────────────────────────────

  /** Asignar 1°/2°/3° lugar manualmente (modalidad local) */
  asignarPodio: async (idtorneo: number, podio: PodioEntry[]) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/podio`, { podio });
    return data;
  },

  /** Tabla de posiciones / resultados del torneo local */
  resultadosLocal: async (idtorneo: number) => {
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/resultados-local`);
    return data.resultados ?? [];
  },

  // ── MATCHMAKING ────────────────────────────────────────────

  /** Vista previa de emparejamientos antes de confirmar */
  matchmakingPreview: async (idtorneo: number, idcategoria?: number): Promise<MatchmakingPreview> => {
    const params = idcategoria ? { idcategoria } : {};
    const { data } = await api.get(`${BASE}/torneos/${idtorneo}/matchmaking/preview`, { params });
    return data;
  },

  /** Intercambiar dos competidores entre combates */
  reasignarMatchmaking: async (idtorneo: number, payload: {
    idinscripcion_a: number;
    idinscripcion_b: number;
  }) => {
    const { data } = await api.put(`${BASE}/torneos/${idtorneo}/matchmaking/reasignar`, payload);
    return data;
  },

  /** Confirmar y guardar matchmaking en BD */
  confirmarMatchmaking: async (idtorneo: number) => {
    const { data } = await api.post(`${BASE}/torneos/${idtorneo}/matchmaking/confirmar`);
    return data;
  },
};