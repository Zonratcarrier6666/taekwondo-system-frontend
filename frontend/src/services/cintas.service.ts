import api from '../api/axios';

/**
 * INTERFAZ: Cinta
 * Coincide con la respuesta del endpoint /grados/
 */
export interface Cinta {
  idgrado: number;
  nivelkupdan: string;
  color: string;
  significado: string;
}

export const cintasService = {
  /**
   * Obtiene el catálogo completo de grados (Kup y Dan)
   * GET /grados/
   */
  listarGrados: async (): Promise<Cinta[]> => {
    const response = await api.get('/grados/');
    return response.data;
  }
};