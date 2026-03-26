import axios from 'axios';

// ─────────────────────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────────────────────

export interface ListaDiaResponse {
  fecha:         string;
  ya_registrada: boolean;
  alumnos:       AlumnoDia[];
}

export interface AlumnoDia {
  idalumno:        number;
  nombres:         string;
  apellidopaterno: string;
  foto?:           string;
  cinta_color?:    string;
  cinta_nivel?:    string;
  presente:        boolean | null;  // null = no registrado aún
  id_asistencia?:  number;
}

export interface RegistroAsistencia {
  idalumno: number;
  presente: boolean;
}

export interface PaseListaRequest {
  fecha?:     string;              // YYYY-MM-DD, default = hoy en el backend
  registros:  RegistroAsistencia[];
}

export interface PaseListaResponse {
  ok:        boolean;
  fecha:     string;
  total:     number;
  presentes: number;
  ausentes:  number;
  mensaje:   string;
}

export interface ResumenAlumno {
  idalumno:        number;
  nombre_completo: string;
  foto?:           string;
  cinta_color?:    string;
  cinta_nivel?:    string;
  total_dias:      number;
  presentes:       number;
  ausentes:        number;
  porcentaje:      number | null;
}

export interface ResumenGrupoResponse {
  rango:   { desde: string; hasta: string };
  alumnos: ResumenAlumno[];
}

export interface HistorialAlumnoResponse {
  alumno: {
    idalumno:        number;
    nombre_completo: string;
  };
  rango: { desde: string; hasta: string };
  metricas: {
    total_dias:  number;
    presentes:   number;
    ausentes:    number;
    porcentaje:  number;
  };
  registros: {
    id:             number;
    fecha:          string;
    presente:       boolean;
    fecharegistro?: string;
  }[];
}

export interface ResumenParams {
  desde?: string;
  hasta?: string;
}

export interface HistorialParams {
  desde?: string;
  hasta?: string;
}

// ─────────────────────────────────────────────────────────────
//  INSTANCIA AXIOS — mismo patrón que alumno.service.ts
// ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'https://taekwondo-system-api.onrender.com',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────
//  SERVICE
// ─────────────────────────────────────────────────────────────

export const asistenciaService = {

  /**
   * Alumnos del grupo con su estatus de asistencia de HOY.
   * Accesible para Escuela y Profesor.
   */
  listarHoy: async (): Promise<ListaDiaResponse> => {
    const res = await api.get<ListaDiaResponse>('/asistencia/hoy');
    return res.data;
  },

  /**
   * Alumnos del grupo con su estatus de asistencia de una fecha específica.
   * @param fecha  YYYY-MM-DD
   */
  listarPorFecha: async (fecha: string): Promise<ListaDiaResponse> => {
    const res = await api.get<ListaDiaResponse>(`/asistencia/fecha/${fecha}`);
    return res.data;
  },

  /**
   * Registra o actualiza la lista completa de un día (upsert).
   * Si no se pasa `fecha`, el backend usa hoy.
   */
  pasarLista: async (body: PaseListaRequest): Promise<PaseListaResponse> => {
    const res = await api.post<PaseListaResponse>('/asistencia/pasar-lista', body);
    return res.data;
  },

  /**
   * Historial de asistencia de un alumno con métricas.
   * Por defecto devuelve los últimos 30 días.
   */
  historialAlumno: async (
    idalumno: number,
    params: HistorialParams = {}
  ): Promise<HistorialAlumnoResponse> => {
    const p = new URLSearchParams();
    if (params.desde) p.set('desde', params.desde);
    if (params.hasta) p.set('hasta', params.hasta);
    const res = await api.get<HistorialAlumnoResponse>(
      `/asistencia/historial/${idalumno}?${p}`
    );
    return res.data;
  },

  /**
   * Resumen de % de asistencia de todo el grupo en un rango de fechas.
   * Los alumnos con menor asistencia aparecen primero.
   */
  resumenGrupo: async (params: ResumenParams = {}): Promise<ResumenGrupoResponse> => {
    const p = new URLSearchParams();
    if (params.desde) p.set('desde', params.desde);
    if (params.hasta) p.set('hasta', params.hasta);
    const res = await api.get<ResumenGrupoResponse>(`/asistencia/resumen?${p}`);
    return res.data;
  },
};