// ============================================================
//  src/types/inscripcion.types.ts
// ============================================================

export interface TorneoResumen {
  idtorneo:         number;
  nombre:           string;
  fecha:            string;
  sede:             string;
  ciudad?:          string;
  hora_inicio?:     string;
  monto_inscripcion?: number;
  max_participantes?: number;
  estatus:          number;   // 1=Activo 2=En curso 3=Finalizado
  genero?:          string;
  cinta_minima?:    number;
  cinta_maxima?:    number;
  edad_minima?:     number;
  edad_maxima?:     number;
  peso_minimo?:     number;
  peso_maximo?:     number;
  descripcion?:     string;
  total_inscritos?: number;
}

export interface AlumnoElegible {
  idalumno:        number;
  nombres:         string;
  apellidopaterno: string;
  edad:            number;
  cinta:           string;
  color_cinta:     string;
  peso?:           number | null;
  genero?:         string | null;
  ya_inscrito:     boolean;
  // peso que el usuario captura antes de inscribir
  peso_capturado?: number;
}

export interface AlumnoNoElegible extends AlumnoElegible {
  razones_no_elegible: string[];
}

export interface AlumnosElegiblesResponse {
  ok:              boolean;
  idtorneo:        number;
  elegibles:       AlumnoElegible[];
  no_elegibles:    AlumnoNoElegible[];
  total_elegibles: number;
}

export interface InscribirConPesoItem {
  idalumno:    number;
  peso_actual: number | null;
}

export interface InscribirLoteDTO {
  idalumnos:   number[];
  peso_actual?: number | null;
}

export interface InscribirConPesoDTO {
  alumnos: InscribirConPesoItem[];
}

export interface ResultadoInscripcion {
  ok:       boolean;
  idalumno: number;
  error?:   string;
  folio?:   string;
}

export interface InscribirLoteResponse {
  ok:         boolean;
  inscritos:  number;
  errores:    ResultadoInscripcion[];
  resultados: ResultadoInscripcion[];
}