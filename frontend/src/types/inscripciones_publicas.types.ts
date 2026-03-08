// ============================================================
//  src/types/inscripciones_publicas.types.ts
// ============================================================

// ─── Escuela ─────────────────────────────────────────────────
export interface EscuelaInfo {
  idescuela:     number;
  nombreescuela: string;
  logo_url:      string | null;
  lema:          string | null;
  direccion:     string | null;
  slug:          string;
}

// ─── Formulario ──────────────────────────────────────────────
export interface InscripcionForm {
  nombres:               string;
  apellidopaterno:       string;
  apellidomaterno:       string;
  fechanacimiento:       string;
  es_mayor_de_edad:      boolean;
  nombretutor:           string;
  telefonocontacto:      string;
  correotutor:           string;
  telefono_propio:       string;
  correo_propio:         string;
  direcciondomicilio:    string;
  tipo_sangre:           string;
  alergias:              string;
  padecimientos_cronicos: string;
  seguro_medico:         string;
  nss_o_poliza:          string;
  contacto_emergencia_nombre: string;
  contacto_emergencia_tel:    string;
  grado_escolar:         string;
  escuela_procedencia:   string;
}

export const EMPTY_INSCRIPCION_FORM: InscripcionForm = {
  nombres: '', apellidopaterno: '', apellidomaterno: '',
  fechanacimiento: '', es_mayor_de_edad: false,
  nombretutor: '', telefonocontacto: '', correotutor: '',
  telefono_propio: '', correo_propio: '',
  direcciondomicilio: '',
  tipo_sangre: '', alergias: 'Ninguna', padecimientos_cronicos: 'Ninguno',
  seguro_medico: 'No cuenta', nss_o_poliza: '',
  contacto_emergencia_nombre: '', contacto_emergencia_tel: '',
  grado_escolar: '', escuela_procedencia: '',
};

// ─── Payload hacia el backend ─────────────────────────────────
export type InscripcionPayload = InscripcionForm;

// ─── Respuesta del backend ────────────────────────────────────
export interface RegistrarAlumnoResponse {
  message:   string;
  idalumno:  number;
  nombres:   string;
  apellidos: string;
}