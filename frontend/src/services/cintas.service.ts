import api from '../api/axios';

export interface Cinta {
  idgrado: number;
  idescuela: number | null;
  nivelkupdan: string;
  color: string;
  color_stripe: string | null;
  significado: string | null;
  orden: number | null;
}

export interface CintaCreate {
  nivelkupdan: string;
  color: string;
  color_stripe?: string | null;
  significado?: string | null;
  orden?: number | null;
}

export interface CintaUpdate {
  nivelkupdan?: string;
  color?: string;
  color_stripe?: string | null;
  significado?: string | null;
  orden?: number | null;
}

export const cintasService = {
  /** Cintas propias de la escuela (con auth) — fuente principal */
  listarGrados: async (): Promise<Cinta[]> => {
    const r = await api.get('/grados/mi-escuela');
    return r.data;
  },

  /** Alias — mismo endpoint, por compatibilidad */
  listarMiEscuela: async (): Promise<Cinta[]> => {
    const r = await api.get('/grados/mi-escuela');
    return r.data;
  },

  crear: async (body: CintaCreate): Promise<Cinta> => {
    const r = await api.post('/grados/mi-escuela', body);
    return r.data;
  },

  actualizar: async (idgrado: number, body: CintaUpdate): Promise<Cinta> => {
    const r = await api.put(`/grados/mi-escuela/${idgrado}`, body);
    return r.data;
  },

  eliminar: async (idgrado: number): Promise<void> => {
    await api.delete(`/grados/mi-escuela/${idgrado}`);
  },

  importarGlobal: async (): Promise<{ importadas: number; mensaje: string }> => {
    const r = await api.post('/grados/mi-escuela/importar-global');
    return r.data;
  },
};