// src/services/dashboard.service.ts

import api from '../api/axios';  // o la ruta que uses

export const dashboardService = {
  // Obtiene datos para el rol Escuela → ¡este es el path correcto!
  getEscuelaStats: async () => {
    const response = await api.get('/dashboard/dashboard/escuela');
    return response.data;
  },

  // Los otros métodos quedan igual si los usas
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