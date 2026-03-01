import api from '../api/axios';
import type {
  DashboardEscuela,
  DashboardSuperAdmin,
  DashboardProfesor,
} from '../types/dashboard.types';

/**
 * Servicio de Dashboard optimizado para usar la instancia global de Axios.
 * Se mantienen las rutas indicadas por el backend (incluyendo prefijos si son necesarios).
 */
export const dashboardService = {
  /** Dashboard para rol Escuela */
  getEscuelaStats: async (): Promise<DashboardEscuela> => {
    const response = await api.get<DashboardEscuela>('/dashboard/dashboard/escuela');
    return response.data;
  },

  /** Dashboard para rol SuperAdmin — opcionalmente filtrado por escuela */
  getSuperAdminStats: async (idescuela?: number): Promise<DashboardSuperAdmin> => {
    const qs = idescuela ? `?idescuela=${idescuela}` : '';
    const response = await api.get<DashboardSuperAdmin>(`/dashboard/dashboard/superadmin${qs}`);
    return response.data;
  },

  /** Dashboard para rol Profesor */
  getProfesorStats: async (): Promise<DashboardProfesor> => {
    const response = await api.get<DashboardProfesor>('/dashboard/dashboard/profesor');
    return response.data;
  },
};