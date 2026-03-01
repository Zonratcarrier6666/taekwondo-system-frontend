// ============================================================
//  src/types/torneo.types.ts
//  Tipado completo basado en el backend (brackets.py + torneos)
// ============================================================

// ─────────────────────────────────────────────────────────────
//  TORNEO
// ─────────────────────────────────────────────────────────────

export interface Torneo {
  idtorneo: number;
  nombre: string;
  fecha: string;
  sede: string;
  ciudad?: string;
  descripcion?: string;
  hora_inicio?: string;
  estatus: number;               // 1=activo, 2=en_curso, 3=finalizado
  costo_inscripcion?: number;
  monto_inscripcion?: number;
  max_participantes?: number;
  genero?: string;               // 'M' | 'F' | 'A'
  cinta_minima?: number;
  cinta_maxima?: number;
  edad_minima?: number;
  edad_maxima?: number;
  peso_minimo?: number;
  peso_maximo?: number;
  modalidades?: Record<string, any>;
  id_juez?: number;
  creado_por?: number;
}

export interface CrearTorneoDTO {
  nombre: string;
  fecha: string;
  sede: string;
  ciudad?: string;
  descripcion?: string;
  hora_inicio?: string;
  costo_inscripcion?: number;
  monto_inscripcion?: number;
  max_participantes?: number;
  genero?: string;
  cinta_minima?: number;
  cinta_maxima?: number;
  edad_minima?: number;
  edad_maxima?: number;
  peso_minimo?: number;
  peso_maximo?: number;
}

// ─────────────────────────────────────────────────────────────
//  CATEGORÍAS
// ─────────────────────────────────────────────────────────────

export interface TorneoCategoria {
  idcategoria: number;
  idtorneo: number;
  nombre_categoria: string;
  edad_min?: number;
  edad_max?: number;
  peso_min?: number;
  peso_max?: number;
  grados_permitidos?: number[];
  genero?: string;
  total_inscritos?: number;
  bracket_generado?: boolean;
}

export interface CrearCategoriaDTO {
  nombre_categoria: string;
  edad_min?: number;
  edad_max?: number;
  peso_min?: number;
  peso_max?: number;
  grados_permitidos?: number[];
  genero?: string;
}

// ─────────────────────────────────────────────────────────────
//  INSCRIPCIONES
// ─────────────────────────────────────────────────────────────

export interface InscripcionTorneo {
  idinscripcion: number;
  idtorneo: number;
  idalumno: number;
  idcategoria?: number;
  idescuela?: number;
  peso_declarado?: number;
  peso_bascula?: number;
  edad_al_momento?: number;
  estatus_pago: string;          // 'Pendiente' | 'pagado'
  estatus_checkin: boolean;
  qr_usado: boolean;
  hora_llegada?: string;
  fecha_inscripcion?: string;
  token_qr?: string;
  asistio?: boolean;
}

// ─────────────────────────────────────────────────────────────
//  COMPETIDOR (dentro de bracket)
// ─────────────────────────────────────────────────────────────

export interface Competidor {
  idinscripcion: number;
  nombre: string;
  edad: number;
  cinta: string;
  color_cinta: string;
  peso?: number;
  escuela: string;
}

// ─────────────────────────────────────────────────────────────
//  COMBATES
// ─────────────────────────────────────────────────────────────

export interface Combate {
  idcombate: number;
  bracket_posicion: number;
  nombre_ronda: string;
  estatus: 'pendiente' | 'finalizado' | 'bye';
  es_bye: boolean;
  competidor_1?: Competidor | null;
  competidor_2?: Competidor | null;
  puntos_c1: number;
  puntos_c2: number;
  ganador?: Competidor | null;
  area_asignada?: string;
  tiempo_inicio?: string;
  tiempo_fin?: string;
}

export interface RondaBracket {
  ronda: number;
  nombre_ronda: string;
  combates: Combate[];
}

// ─────────────────────────────────────────────────────────────
//  BRACKET — respuesta de /bracket/{idcategoria}
// ─────────────────────────────────────────────────────────────

export interface BracketCategoria {
  ok: boolean;
  idtorneo: number;
  categoria: {
    idcategoria: number;
    nombre: string;
    edad_min?: number;
    edad_max?: number;
    peso_min?: number;
    peso_max?: number;
    genero?: string;
  };
  resumen: {
    total_combates: number;
    finalizados: number;
    pendientes: number;
    total_rondas: number;
  };
  campeon?: Competidor | null;
  rondas: RondaBracket[];
}

// ─────────────────────────────────────────────────────────────
//  BRACKET LIVE — respuesta de /bracket/live
// ─────────────────────────────────────────────────────────────

export interface CategoriaLive {
  idcategoria: number;
  nombre: string;
  finalizados: number;
  pendientes: number;
  campeon?: Competidor | null;
  rondas: RondaBracket[];
}

export interface BracketLive {
  ok: boolean;
  idtorneo: number;
  total_categorias: number;
  categorias: CategoriaLive[];
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
//  CERRAR CHECKIN
// ─────────────────────────────────────────────────────────────

export interface ResumenCheckin {
  idcategoria: number;
  nombre: string;
  participantes: number;
  combates_r1?: number;
  total_rondas?: number;
  byes?: number;
  nota?: string;
}

export interface CerrarCheckinResponse {
  ok: boolean;
  mensaje: string;
  combates_creados: number;
  categorias: ResumenCheckin[];
}

// ─────────────────────────────────────────────────────────────
//  RESULTADO COMBATE
// ─────────────────────────────────────────────────────────────

export interface RegistrarResultadoDTO {
  puntos_c1: number;
  puntos_c2: number;
}

export interface ResultadoCombateResponse {
  ok: boolean;
  idcombate: number;
  puntos_c1: number;
  puntos_c2: number;
  ganador_id: number;
  ganador_nombre: string;
  es_final: boolean;
  campeon?: string | null;
  mensaje: string;
}

// ─────────────────────────────────────────────────────────────
//  JUEZ
// ─────────────────────────────────────────────────────────────

export interface AsignarJuezResponse {
  ok: boolean;
  mensaje: string;
  juez: {
    idusuario: number;
    username: string;
    rol: string;
  };
}

// ─────────────────────────────────────────────────────────────
//  MIS COMBATES (vista juez)
// ─────────────────────────────────────────────────────────────

export interface MisCombatesResponse {
  ok: boolean;
  juez: string;
  pendientes: Combate[];
  finalizados: Combate[];
  total: number;
}