// src/services/examenes.service.ts

import axios from 'axios';

// ─────────────────────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────────────────────

export interface Examen {
  idexamen:         number;
  idescuela:        number;
  idprofesor?:      number;
  nombre_examen:    string;
  fecha_programada: string;      // YYYY-MM-DD
  lugar?:           string;
  costo_examen:     number;
  sinodal?:         string;
  estatus:          number;      // 1=activo 0=inactivo
  archivo_pdf?:     string;      // URL pública
  fecharegistro?:   string;
  // enriquecidos por el backend
  _inscritos?:      number;
  _calificados?:    number;
  _pagados?:        number;
  _pendientes?:     number;
}

export interface AlumnoExamen {
  idhistorial:      number;
  idalumno:         number;
  idgrado_anterior: number;
  idgrado_nuevo:    number;
  calificacion?:    number;
  aprobado?:        boolean;
  notas?:           string;
  fecharegistro?:   string;
  alumnos?: {
    nombres:         string;
    apellidopaterno: string;
    fotoalumno?:     string;
  };
  grado_ant?: { nivelkupdan: string; color: string; color_stripe?: string };
  grado_nvo?: { nivelkupdan: string; color: string; color_stripe?: string };
  pago?: {
    idpago:      number;
    monto:       number;
    estatus:     number;
    metodo_pago?: string;
  };
  pago_estatus?: number;   // 0=pendiente 1=pagado null=sin pago
}

export interface ExamenDetalle extends Examen {
  alumnos: AlumnoExamen[];
}

export interface ExamenCreate {
  nombre_examen:    string;
  fecha_programada: string;
  lugar?:           string;
  costo_examen?:    number;
  sinodal?:         string;
}

export interface ExamenUpdate {
  nombre_examen?:    string;
  fecha_programada?: string;
  lugar?:            string;
  costo_examen?:     number;
  sinodal?:          string;
  estatus?:          number;
}

export interface InscribirRequest {
  idalumnos: number[];
}

export interface CalificarRequest {
  idalumno:      number;
  calificacion:  number;
  idgrado_nuevo: number;
  notas?:        string;
  aprobado?:     boolean;
}

// ─────────────────────────────────────────────────────────────
//  INSTANCIA AXIOS
// ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'https://taekwondo-system-api.onrender.com',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────────────────────────
//  SERVICE
// ─────────────────────────────────────────────────────────────

export const examenesService = {

  listar: async (estatus?: number): Promise<Examen[]> => {
    const params = estatus !== undefined ? `?estatus=${estatus}` : '';
    const res = await api.get<Examen[]>(`/examenes/${params}`);
    return res.data;
  },

  detalle: async (idexamen: number): Promise<ExamenDetalle> => {
    const res = await api.get<ExamenDetalle>(`/examenes/${idexamen}`);
    return res.data;
  },

  crear: async (data: ExamenCreate): Promise<Examen> => {
    const res = await api.post<Examen>('/examenes/', data);
    return res.data;
  },

  editar: async (idexamen: number, data: ExamenUpdate): Promise<Examen> => {
    const res = await api.put<Examen>(`/examenes/${idexamen}`, data);
    return res.data;
  },

  eliminar: async (idexamen: number): Promise<void> => {
    await api.delete(`/examenes/${idexamen}`);
  },

  subirPdf: async (idexamen: number, file: File): Promise<{ ok: boolean; archivo_pdf: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/examenes/${idexamen}/upload-pdf`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  inscribir: async (idexamen: number, idalumnos: number[]): Promise<{
    ok: boolean; inscritos: number; pagos_generados: number; mensaje: string;
  }> => {
    const res = await api.post(`/examenes/${idexamen}/inscribir`, { idalumnos });
    return res.data;
  },

  quitarAlumno: async (idexamen: number, idalumno: number): Promise<void> => {
    await api.delete(`/examenes/${idexamen}/alumnos/${idalumno}`);
  },

  calificar: async (idexamen: number, data: CalificarRequest): Promise<{
    ok: boolean; aprobado: boolean; mensaje: string;
  }> => {
    const res = await api.post(`/examenes/${idexamen}/calificar`, data);
    return res.data;
  },
};