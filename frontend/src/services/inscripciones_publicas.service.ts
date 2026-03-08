// ============================================================
//  src/services/inscripciones_publicas.service.ts
//  Llamadas al API para el formulario público de inscripción
// ============================================================

import api from '../api/axios';
import type {
  EscuelaInfo,
  InscripcionForm,
  InscripcionPayload,
  RegistrarAlumnoResponse,
} from '../types/inscripciones_publicas.types';

const BASE = '/inscripcion';

// ─── GET /:slug — datos públicos de la escuela ───────────────
export async function getEscuelaBySlug(slug: string): Promise<EscuelaInfo> {
  const { data } = await api.get<EscuelaInfo>(`${BASE}/${slug}`);
  return data;
}

// ─── POST /:slug — registrar alumno ──────────────────────────
export async function registrarAlumno(
  slug: string,
  form: InscripcionForm,
): Promise<RegistrarAlumnoResponse> {
  const payload: InscripcionPayload = {
    ...form,
    nombres:         form.nombres.trim(),
    apellidopaterno: form.apellidopaterno.trim(),
  };

  const { data } = await api.post<RegistrarAlumnoResponse>(`${BASE}/${slug}`, payload);
  return data;
}