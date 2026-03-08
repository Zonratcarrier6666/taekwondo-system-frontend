// ============================================================
//  src/types/dashboard.types.ts
//  Tipado completo basado en la respuesta real de la API
// ============================================================

// ─────────────────────────────────────────────────────────────
//  COMPARTIDOS
// ─────────────────────────────────────────────────────────────

export interface BeltStat {
  idgrado?: number;
  color: string;
  color_stripe?: string | null;  // franja secundaria (cintas con dos colores)
  nivelkupdan?: string;
  count: number;
}

export interface FinanceStat {
  label: string;       // "Lun", "Mar"...
  dia?: string;        // "2024-11-11"
  value: number;
}

export interface FinanceMes {
  mes_label: string;   // "Nov", "Dic"
  mes?: string;        // "2024-11"
  total: number;
}

export interface ExamenProximo {
  idexamen: number;
  nombre_examen: string;
  fecha_programada: string;
  lugar?: string;
  costo_examen?: number;
  sinodal?: string;
  alumnos_inscritos?: number;
}

export interface TorneoProximo {
  idtorneo: number;
  nombre: string;
  fecha: string;
  sede: string;
  costo_inscripcion?: number;
  total_inscritos?: number;
}

export interface AlumnoCumple {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  fechanacimiento: string;
  edad: number;
  fecha_display?: string;
}

// ─────────────────────────────────────────────────────────────
//  ESCUELA
// ─────────────────────────────────────────────────────────────

export interface AlumnoDeudaVencida {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  monto: number;
  concepto: string;
  dias_vencido: number;
}

export interface AsistenciaDia {
  fecha: string;
  label: string;
  presentes: number;
}

export interface DashboardEscuela {
  // Conteos
  total_alumnos_activos: number;
  total_alumnos_inactivos: number;
  total_profesores: number;

  // Finanzas
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  deuda_total_pendiente: number;
  pagos_pendientes_count: number;

  // Gráficas
  ingresos_semana: FinanceStat[];
  ingresos_6_meses: FinanceMes[];

  // Técnico
  distribucion_cintas: BeltStat[];

  // Operativo
  alumnos_deuda_vencida: AlumnoDeudaVencida[];
  proximos_examenes: ExamenProximo[];
  alumnos_torneo_count: number;

  // Asistencia
  asistencia_hoy: number;
  asistencia_semana: AsistenciaDia[];

  // Extra
  alumnos_nuevos_30d: number;
  cumpleanos_proximos: AlumnoCumple[];

  // Compatibilidad hacia atrás
  total_alumnos?: number;
  ingresos_semanales?: number;
  finanzas_semana?: FinanceStat[];
  proximos_torneos?: any[];
}

// ─────────────────────────────────────────────────────────────
//  SUPERADMIN
// ─────────────────────────────────────────────────────────────

export interface EscuelaResumen {
  idescuela: number;
  nombreescuela: string;
  logo_url?: string;
  color_paleta?: string;
  alumnos_activos: number;
  profesores_activos: number;
  ingresos_mes: number;
  deuda_pendiente: number;
  pagos_pendientes_count: number;
}

export interface UsuarioItem {
  idusuario: number;
  username: string;
  rol: string;
  fecha_creacion?: string;
}

export interface EscuelaSimple {
  idescuela: number;
  nombreescuela: string;
  logo_url?: string;
}

export interface DashboardSuperAdmin {
  // Conteos globales
  total_escuelas: number;
  total_usuarios: number;
  total_alumnos_activos: number;
  total_profesores_activos: number;

  // Finanzas globales
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  deuda_total_pendiente: number;

  // Torneos
  torneos_activos: number;
  torneos_proximos_count: number;
  total_inscripciones_torneo: number;

  // Actividad
  alumnos_nuevos_30d: number;
  movimientos_financieros_7d: number;

  // Gráficas
  usuarios_por_rol: Record<string, number>;
  ingresos_ultimos_6_meses: FinanceMes[];
  escuelas_resumen: EscuelaResumen[];
  proximos_torneos: TorneoProximo[];

  // Listas
  usuarios_lista: UsuarioItem[];
  escuelas: EscuelaSimple[];

  // Meta
  filtro_aplicado?: number;
  resumen_sistema: Record<string, any>;
  usuarios_online_recientes?: number;
}

// ─────────────────────────────────────────────────────────────
//  PROFESOR
// ─────────────────────────────────────────────────────────────

export interface AlumnoAusente {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  fotoalumno?: string;
  ultima_asistencia?: string;
  dias_ausente?: number;
}

export interface PromocionGrado {
  idhistorial: number;
  nombres: string;
  apellidopaterno: string;
  grado_anterior: string;
  grado_nuevo: string;
  nivelkupdan: string;
  fecha_examen: string;
}

export interface AlumnoLista {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  fotoalumno?: string;
  fechanacimiento?: string;
  cinta_color: string;
  cinta_nivel: string;
  ultima_asistencia?: string;
  pagos_pendientes: number;
}

export interface DashboardProfesor {
  // Alumnos
  mis_alumnos_activos: number;
  mis_alumnos_inactivos: number;

  // Asistencia
  mis_asistencias_hoy: number;
  asistencia_semana: AsistenciaDia[];

  // Técnico
  distribucion_cintas: BeltStat[];

  // Finanzas
  mis_pagos_pendientes_count: number;
  mis_pagos_pendientes_monto: number;

  // Eventos
  proximos_examenes: ExamenProximo[];
  mis_alumnos_torneo_count: number;

  // Alertas
  alumnos_ausentes: AlumnoAusente[];
  cumpleanos_proximos: AlumnoCumple[];
  ultimas_promociones: PromocionGrado[];

  // Lista
  mis_alumnos_lista: AlumnoLista[];

  // Compatibilidad hacia atrás
  total_alumnos?: number;
}