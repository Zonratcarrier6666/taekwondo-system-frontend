import api from '../api/axios';

export const dashboardService = {
  /**
   * Obtiene estadísticas para el rol Escuela
   */
  getEscuelaStats: async () => {
    const response = await api.get('/dashboard/dashboard/escuela');
    return response.data;
  },

  /**
   * Estadísticas globales para el rol Superadmin
   * @param idEscuela  ID opcional para filtrar por escuela específica
   */
  getSuperAdminStats: async (idEscuela?: string) => {
    const url = idEscuela
      ? `/dashboard/dashboard/superadmin?idescuela=${idEscuela}`
      : '/dashboard/dashboard/superadmin';
    const response = await api.get(url);
    return response.data;
  },

  getProfesorStats: async () => {
    const response = await api.get('/dashboard/profesor');
    return response.data;
  }
};