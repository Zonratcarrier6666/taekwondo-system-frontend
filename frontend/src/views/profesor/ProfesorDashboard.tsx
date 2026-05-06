import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Trophy,
  LogOut,
  Loader2,
  PieChart as PieIcon,
  ChevronRight,
  Sparkles,
  UserCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  ArrowUpRight,
  UserX,
  Award,
  BarChart2,
} from 'lucide-react';

// --- IMPORTACIONES REALES DE PRODUCCIÓN ---
// @ts-ignore
import { useAuth } from '../../context/AuthContext';
// @ts-ignore
import { dashboardService } from '../../services/dashboard.service';
// @ts-ignore
import { escuelaService } from '../../services/escuela.service';
// @ts-ignore
import { themeService } from '../../services/theme.service';
// @ts-ignore
import GlobalNavbar from '../../components/common/GlobalNavbar';
// @ts-ignore
import CajaProfesor from './CajaProfesor';
// @ts-ignore
import PaseListaView from './PaseListaView';
// @ts-ignore
import ExamenesView from './Examenesview';
// @ts-ignore
import CombatesActivos from './CombatesView';


// ── Resolución de colores de cintas ──────────────────────────
// Fuente única de verdad compartida con GestionAlumnos y PerfilConfiguracion.
// @ts-ignore
import { getBeltHex as beltHex } from '../../utils/beltColors';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const formatDate = (iso: string | null) => {
  if (!iso) return 'Sin registro';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Avatar: React.FC<{ src: string; name: string; size?: number }> = ({ src, name, size = 40 }) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      className="rounded-2xl object-cover border border-white/10 shadow-lg"
      style={{ width: size, height: size }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  ) : (
    <div
      className="rounded-2xl flex items-center justify-center text-white font-black text-xs border border-white/10 shadow-lg"
      style={{ width: size, height: size, background: 'var(--color-primary)' }}
    >
      {initials}
    </div>
  );
};

// ── Tarjeta KPI clicable ──
const KpiCard: React.FC<{
  icon: React.ReactNode;
  value: number | string;
  label: string;
  accent: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
}> = ({ icon, value, label, accent, onClick, badge, badgeColor }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="w-full text-left bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] shadow-2xl relative overflow-hidden group focus:outline-none"
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    {/* fondo decorativo */}
    <div
      className="absolute -right-5 -top-5 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"
      style={{ color: accent }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="50" /></svg>
    </div>

    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      {onClick && (
        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity text-[var(--color-text-muted)]" />
      )}
    </div>

    <h4 className="text-3xl font-black italic tracking-tighter leading-none text-[var(--color-text)]">{value}</h4>
    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--color-text-muted)] mt-1.5">{label}</p>

    {badge && (
      <span
        className="mt-2 inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{ background: `${badgeColor ?? accent}22`, color: badgeColor ?? accent }}
      >
        {badge}
      </span>
    )}

    {onClick && (
      <div
        className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full"
        style={{ background: accent }}
      />
    )}
  </motion.button>
);

/**
 * COMPONENTE: ProfesorDashboard
 * Dashboard enriquecido que aprovecha al 100% la API del profesor.
 */
export const ProfesorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');
  const [stats, setStats] = useState<any>(null);
  const [escuela, setEscuela] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [statsRes, escuelaRes] = await Promise.all([
        dashboardService.getProfesorStats(),
        escuelaService.getMiEscuela(),
      ]);
      setStats(statsRes);
      setEscuela(escuelaRes);
      if (escuelaRes?.color_paleta) {
        themeService.applyTheme(escuelaRes.color_paleta);
      }
    } catch (err) {
      console.error('Error al sincronizar el tablero del profesor:', err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-text)]">
        <div className="relative">
          <Loader2 className="animate-spin text-[var(--color-primary)] mb-6" size={60} strokeWidth={1.5} />
          <div className="absolute inset-0 blur-3xl bg-[var(--color-primary)]/20 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-text-muted)] italic">
          Sincronizando Perfil Técnico...
        </p>
      </div>
    );

  // ── Datos derivados ──
  const montoPendiente = stats?.mis_pagos_pendientes_monto ?? 0;
  const pagosPendientes = stats?.mis_pagos_pendientes_count ?? 0;
  const ausentes = stats?.alumnos_ausentes ?? [];
  const ausentes3 = ausentes.filter((a: any) => a.dias_ausente !== null).slice(0, 3);
  const promociones = (stats?.ultimas_promociones ?? []).slice(0, 3);
  const semana = stats?.asistencia_semana ?? [];
  const maxPresentes = Math.max(...semana.map((d: any) => d.presentes), 1);
  const proxExamenes = (stats?.proximos_examenes ?? []).slice(0, 2);
  const cumpleanos = (stats?.cumpleanos_proximos ?? []).slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-700 font-sans">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <motion.button
            onClick={() => setActiveTab('inicio')}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 focus:outline-none group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-card)] shadow-2xl border border-[var(--color-border)] overflow-hidden flex items-center justify-center transition-all group-hover:border-[var(--color-primary)]/40 group-hover:shadow-[0_0_16px_var(--color-primary)33]">
              {escuela?.logo_url ? (
                <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Dojo Logo" />
              ) : (
                <Users className="text-[var(--color-primary)]" size={24} />
              )}
            </div>
            <div className="text-left flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">Staff Técnico</span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none group-hover:text-[var(--color-primary)] transition-colors">
                Prof. {user?.nombre || 'Instructor'}
              </h1>
            </div>
          </motion.button>
          <button
            onClick={handleLogout}
            className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 shadow-xl active:scale-90 transition-all hover:bg-red-500 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* ── CONTENIDO DINÁMICO ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'circOut' }}
            className="space-y-5"
          >
            {activeTab === 'inicio' && (
              <>
                {/* ── KPIs CLICABLES ── */}
                <div className="grid grid-cols-2 gap-4">
                  <KpiCard
                    icon={<Users size={20} />}
                    value={stats?.total_alumnos ?? 0}
                    label="Mis Alumnos"
                    accent="var(--color-primary)"
                    onClick={() => setActiveTab('alumnos')}
                    badge={`${stats?.mis_alumnos_activos ?? 0} activos`}
                    badgeColor="#22c55e"
                  />
                  <KpiCard
                    icon={<UserCheck size={20} />}
                    value={stats?.mis_asistencias_hoy ?? 0}
                    label="Pases Hoy"
                    accent="#10b981"
                    onClick={() => setActiveTab('alumnos')}
                    badge="Tomar lista →"
                    badgeColor="#10b981"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <KpiCard
                    icon={<DollarSign size={20} />}
                    value={formatCurrency(montoPendiente)}
                    label="Cobros pendientes"
                    accent="#f97316"
                    onClick={() => setActiveTab('pagos')}
                    badge={`${pagosPendientes} cargos`}
                    badgeColor="#f97316"
                  />
                  <KpiCard
                    icon={<Trophy size={20} />}
                    value={stats?.alumnos_en_torneo ?? 0}
                    label="En torneo"
                    accent="#a855f7"
                    onClick={() => setActiveTab('torneos')}
                    badge="Ver competencias →"
                    badgeColor="#a855f7"
                  />
                </div>

                {/* ── GRÁFICA DE ASISTENCIA SEMANAL ── */}
                <div className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center">
                      <BarChart2 size={14} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)]">Asistencia</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">— Esta semana</span>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-20">
                    {semana.map((dia: any, i: number) => {
                      const heightPct = maxPresentes > 0 ? (dia.presentes / maxPresentes) * 100 : 0;
                      const isToday = i === semana.length - 1;
                      return (
                        <div key={dia.fecha} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[9px] font-black text-[var(--color-text-muted)]">{dia.presentes}</span>
                          <div className="w-full bg-[var(--color-background)] rounded-lg overflow-hidden" style={{ height: 44 }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(heightPct, dia.presentes > 0 ? 15 : 0)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.06, ease: 'circOut' }}
                              className="w-full rounded-lg"
                              style={{
                                background: isToday
                                  ? 'var(--color-primary)'
                                  : dia.presentes > 0
                                  ? 'var(--color-primary)'
                                  : 'var(--color-border)',
                                opacity: isToday ? 1 : dia.presentes > 0 ? 0.5 : 0.2,
                                marginTop: 'auto',
                              }}
                            />
                          </div>
                          <span
                            className="text-[8px] font-black uppercase"
                            style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: isToday ? 1 : 0.6 }}
                          >
                            {dia.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── DISTRIBUCIÓN DE CINTAS ── */}
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-7 rounded-[3rem] border border-[var(--color-border)] shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <PieIcon size={14} className="text-indigo-400" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Análisis Kup/Dan</span>
                      </div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter">Niveles de Grado</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background)] rounded-full border border-[var(--color-border)]">
                      <Sparkles size={12} className="text-amber-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Fuerza Técnica</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {stats?.distribucion_cintas?.map((c: any, idx: number) => {
                      const total = stats.distribucion_cintas.reduce((a: number, b: any) => a + b.count, 0);
                      const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                      const hex = beltHex(c.color);
                      return (
                        <div key={c.idgrado ?? idx} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase italic tracking-tighter text-[var(--color-text)]">
                            <span className="flex items-center gap-2">
                              <div
                                className="relative w-4 h-2.5 rounded-sm overflow-hidden border border-white/10 shadow"
                                style={{ backgroundColor: hex }}
                              />
                              {c.nivelkupdan || c.color}
                              <span className="font-bold opacity-40 not-italic normal-case">({c.count})</span>
                            </span>
                            <span style={{ color: hex }} className="font-black">{pct}%</span>
                          </div>
                          <div className="h-2.5 bg-[var(--color-background)] rounded-full overflow-hidden border border-[var(--color-border)]/5 shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1.2, delay: idx * 0.08, ease: 'circOut' }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${hex}99, ${hex})` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── ALUMNOS AUSENTES ── */}
                {ausentes3.length > 0 && (
                  <div className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-red-500/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
                          <UserX size={14} className="text-red-400" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Alerta de Ausencias</span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('alumnos')}
                        className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Ver todos →
                      </motion.button>
                    </div>
                    <div className="space-y-3">
                      {ausentes3.map((a: any) => (
                        <div key={a.idalumno} className="flex items-center gap-3">
                          <Avatar src={a.fotoalumno} name={`${a.nombres} ${a.apellidopaterno}`} size={38} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight truncate">
                              {a.nombres} {a.apellidopaterno}
                            </p>
                            <p className="text-[9px] text-[var(--color-text-muted)] opacity-60">
                              Última: {formatDate(a.ultima_asistencia)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-red-400">{a.dias_ausente}</span>
                            <p className="text-[8px] text-[var(--color-text-muted)] opacity-50 uppercase">días</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ÚLTIMAS PROMOCIONES ── */}
                {promociones.length > 0 && (
                  <div className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-amber-500/20 shadow-2xl">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <Award size={14} className="text-amber-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Últimas Promociones</span>
                    </div>
                    <div className="space-y-3">
                      {promociones.map((p: any) => (
                        <div key={p.idhistorial} className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm border border-white/10 shadow" style={{ background: beltHex(p.grado_anterior) }} />
                            <TrendingUp size={10} className="text-[var(--color-text-muted)] opacity-40" />
                            <div className="w-3 h-3 rounded-sm border border-white/10 shadow" style={{ background: beltHex(p.grado_nuevo) }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight truncate">
                              {p.nombres} {p.apellidopaterno}
                            </p>
                            <p className="text-[9px] text-[var(--color-text-muted)] opacity-60">
                              {p.grado_anterior} → <span style={{ color: beltHex(p.grado_nuevo) }} className="font-black">{p.grado_nuevo}</span>
                              {' · '}{p.nivelkupdan}
                            </p>
                          </div>
                          <span className="text-[8px] text-[var(--color-text-muted)] opacity-40 shrink-0">
                            {formatDate(p.fecha_examen)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PRÓXIMOS EXÁMENES ── */}
                {proxExamenes.length > 0 ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('examenes')}
                    className="w-full bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between group cursor-pointer hover:border-[var(--color-primary)]/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        <Star size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">
                          Próximos Exámenes
                        </h4>
                        <p className="text-[10px] font-bold text-[var(--color-primary)] mt-1.5">
                          {proxExamenes.length} examen{proxExamenes.length > 1 ? 'es' : ''} programado{proxExamenes.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-[var(--color-text-muted)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('examenes')}
                    className="w-full bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between group cursor-pointer hover:border-[var(--color-primary)]/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        <Star size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Exámenes de Grado</h4>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] mt-1.5 opacity-60">Sin exámenes próximos</p>
                      </div>
                    </div>
                    <ChevronRight className="text-[var(--color-text-muted)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                  </motion.button>
                )}

                {/* ── COBROS PENDIENTES (card clicable) ── */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('pagos')}
                  className="w-full bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between group cursor-pointer hover:border-orange-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Cobros Pendientes</h4>
                      <p className="text-[10px] font-bold text-orange-400 mt-1.5">
                        {pagosPendientes} cargos · {formatCurrency(montoPendiente)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-[var(--color-text-muted)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                </motion.button>

                {/* ── ARENA Y TORNEOS (card clicable) ── */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('torneos')}
                  className="w-full bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between group cursor-pointer hover:border-purple-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Arena y Torneos</h4>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] mt-1.5 opacity-60">
                        {stats?.alumnos_en_torneo ?? 0} atletas en competencia activa
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-[var(--color-text-muted)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                </motion.button>

                {/* ── CUMPLEAÑOS (si los hay) ── */}
                {cumpleanos.length > 0 && (
                  <div className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-pink-500/20 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-pink-500/10 rounded-lg flex items-center justify-center">
                        <Calendar size={14} className="text-pink-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-pink-400">Cumpleaños Próximos</span>
                    </div>
                    <div className="space-y-3">
                      {cumpleanos.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <Avatar src={c.fotoalumno ?? ''} name={`${c.nombres} ${c.apellidopaterno}`} size={36} />
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-tight">{c.nombres} {c.apellidopaterno}</p>
                            <p className="text-[9px] text-[var(--color-text-muted)] opacity-60">{formatDate(c.fecha)}</p>
                          </div>
                          <span className="text-lg">🎂</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}

            {activeTab === 'alumnos' && <PaseListaView />}
            {activeTab === 'pagos' && <CajaProfesor />}
            {activeTab === 'examenes' && <ExamenesView />}
            {activeTab === 'torneos' && <CombatesActivos />}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── NAVEGACIÓN GLOBAL ── */}
      <GlobalNavbar
        activeTab={activeTab}
        onTabChange={(id: string) => setActiveTab(id)}
        role="Profesor"
      />
    </div>
  );
};

export default ProfesorDashboard;