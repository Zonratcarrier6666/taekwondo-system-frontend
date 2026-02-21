import api from '../api/axios';

export const dashboardService = {
  // Obtiene datos para el rol Escuela
  getEscuelaStats: async () => {
    const response = await api.get('/dashboard/escuela');
    return response.data;
  },

  // Obtiene datos para el rol SuperAdmin (con filtro opcional)
  getSuperAdminStats: async (idEscuela?: string) => {
    const url = idEscuela ? `/dashboard/superadmin?idescuela=${idEscuela}` : '/dashboard/superadmin';
    const response = await api.get(url);
    return response.data;
  },

  // Obtiene datos para el rol Profesor
  getProfesorStats: async () => {
    const response = await api.get('/dashboard/profesor');
    return response.data;
  }
};