import api from '../api/axios';

export const dashboardService = {
  /**
   * Obtiene estadísticas para el rol Escuela
   */
  getEscuelaStats: async () => {
    const response = await api.get('/dashboard/dashboard/escuela');
    return response.data;
  },

  getSuperAdminStats: async (idEscuela?: string) => {
    const url = idEscuela ? `/dashboard/superadmin?idescuela=${idEscuela}` : '/dashboard/superadmin';
    const response = await api.get(url);
    return response.data;
  },

  getProfesorStats: async () => {
    const response = await api.get('/dashboard/profesor');
    return response.data;
  }
};