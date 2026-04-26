// ============================================================
//  src/services/usuario.service.ts
// ============================================================

import api from '../api/axios';
import type {
  Usuario,
  ListaUsuariosResponse,
  RegistroEscuelaDTO,
  RegistroProfesorDTO,
  RegistroJuezDTO,
  RegistroStaffDTO,
} from '../types/usuarios.types';

export const usuarioService = {

  // ─────────────────────────────────────────────────────────
  //  LISTAR  GET /usuarios/lista
  // ─────────────────────────────────────────────────────────

  listar: async (rol?: string): Promise<Usuario[]> => {
    const params = rol ? `?rol=${rol}` : '';
    const res = await api.get<ListaUsuariosResponse>(`/usuarios/usuarios/lista${params}`);
    return res.data?.usuarios ?? [];
  },

  // ─────────────────────────────────────────────────────────
  //  MI PERFIL  GET /usuarios/perfil
  // ─────────────────────────────────────────────────────────

  miPerfil: async (): Promise<Usuario> => {
    const res = await api.get<Usuario>('/usuarios/usuarios/perfil');
    return res.data;
  },

  // ─────────────────────────────────────────────────────────
  //  CREAR POR TIPO
  // ─────────────────────────────────────────────────────────

  /** POST /usuarios/registrar-escuela  (solo SuperAdmin) */
  registrarEscuela: async (data: RegistroEscuelaDTO): Promise<Usuario> => {
    const res = await api.post<Usuario>('/usuarios/usuarios/registrar-escuela', data);
    return res.data;
  },

  /** POST /usuarios/registrar-profesor  (SuperAdmin o Escuela) */
  registrarProfesor: async (data: RegistroProfesorDTO): Promise<Usuario> => {
    const res = await api.post<Usuario>('/usuarios/usuarios/registrar-profesor', data);
    return res.data;
  },

  /** POST /usuarios/registrar-juez  (solo SuperAdmin) */
  registrarJuez: async (data: RegistroJuezDTO): Promise<Usuario> => {
    const res = await api.post<Usuario>('/usuarios/usuarios/registrar-juez', data);
    return res.data;
  },

  /** POST /usuarios/registrar-staff  (solo SuperAdmin) */
  registrarStaff: async (data: RegistroStaffDTO): Promise<Usuario> => {
    const res = await api.post<Usuario>('/usuarios/usuarios/registrar-staff', data);
    return res.data;
  },
  /** GET /usuarios/escuelas — lista para selectores */
  listarEscuelas: async (): Promise<{ value: string; label: string }[]> => {
    const res = await api.get<any>('/usuarios/usuarios/escuelas');
    const raw = res.data?.escuelas ?? [];
    return raw.map((e: any) => ({
        value: String(e.idescuela),   // ← idescuela real de datosescuela
        label: e.nombreescuela,
    }));
    },
};