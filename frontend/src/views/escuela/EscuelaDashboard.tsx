// ============================================================
//  src/views/escuela/EscuelaDashboard.tsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, LogOut, School, Loader2, PieChart as PieIcon,
  BarChart3, Target, Clock, GraduationCap, Users,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Cake, BookOpen, DollarSign,
} from 'lucide-react';

// @ts-ignore
import { dashboardService } from '../../services/dashboard.service';
// @ts-ignore
import { escuelaService } from '../../services/escuela.service';
// @ts-ignore
import { themeService } from '../../services/theme.service';
// @ts-ignore
import { useAuth } from '../../context/AuthContext';
// @ts-ignore
import type { Escuela } from '../../types/escuela.types';
// @ts-ignore
import type { DashboardEscuela, BeltStat, FinanceStat, AsistenciaDia } from '../../types/dashboard.types';
// @ts-ignore
import GlobalNavbar from '../../components/common/GlobalNavbar';
// @ts-ignore
import PerfilConfiguracion from './PerfilConfiguracion';
// @ts-ignore
import GestionProfesores from './GestionProfesores';
// @ts-ignore
import GestionAlumnos from './GestionAlumnos';
// @ts-ignore
import CajaFinanzas from './CajaFinanzas';
import TorneosEscuelaView from './TorneosEscuelaView';
// @ts-ignore
import CheckinTorneoView from './CheckinTorneoView';
// @ts-ignore
import MisCombatesView from './MisCombatesView';
// @ts-ignore
import EscaneoQRView from '../juez/EscaneoQRView';

// Convierte el nombre de color de la BD al hex CSS correcto.
// Si la escuela tiene colores personalizados (ej. "Azul Marino"), usa el valor
// directamente si parece un hex/rgb, o busca en el mapa como fallback.
const BELT_COLOR_MAP: Record<string, string> = {
  Blanca: '#f8fafc', Amarilla: '#fbbf24', Naranja: '#fb923c',
  Verde: '#22c55e', Azul: '#3b82f6', Roja: '#ef4444',
  Marrón: '#92400e', Café: '#92400e', Morada: '#a855f7',
  Negra: '#1e293b', Gris: '#64748b',
};

const beltHex = (color: string): string => {
  if (!color) return '#94a3b8';
  // Si ya es un valor CSS válido (hex, rgb, hsl) úsalo directo
  if (/^#[0-9a-f]{3,8}$/i.test(color) || /^rgb/i.test(color)) return color;
  return BELT_COLOR_MAP[color] ?? '#94a3b8';
};
const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 0 });
const pctChange = (cur: number, prev: number) =>
  prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

// ─── Donut de cintas ─────────────────────────────────────────
const BeltRingChart = ({ data }: { data: BeltStat[] }) => {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) return (
    <div className="w-32 h-32 rounded-full border-4 border-dashed border-[var(--color-border)] flex items-center justify-center opacity-20">
      <PieIcon size={20} />
    </div>
  );
  let acc = 0;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, i) => {
          const p = (item.count / total) * 100;
          // Usa el color real de la cinta; si tiene franja, mezcla visualmente
          const stroke = beltHex(item.color);
          const off = acc; acc += p;
          return (
            <motion.circle key={i} cx="50" cy="50" r="40" fill="transparent"
              stroke={stroke} strokeWidth="14"
              initial={{ strokeDasharray: '0 251' }}
              animate={{ strokeDasharray: `${p * 2.51} 251` }}
              strokeDashoffset={-off * 2.51}
              transition={{ duration: 1.5, ease: 'circOut' }} />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black italic tracking-tighter leading-none text-[var(--color-text)]">{total}</span>
        <span className="text-[6px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mt-0.5">Alumnos</span>
      </div>
    </div>
  );
};

// ─── Barras genéricas ────────────────────────────────────────
const BarChart = ({ data, h = 80 }: { data: { label: string; value: number }[]; h?: number }) => {
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="flex items-end justify-between gap-1.5 px-1 mt-3" style={{ height: h }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative overflow-hidden rounded-lg border border-[var(--color-border)]/10"
            style={{ height: h - 14, backgroundColor: 'var(--color-background)' }}>
            <motion.div className="absolute bottom-0 w-full rounded-t-md"
              style={{ background: 'linear-gradient(to top, var(--color-primary), var(--color-primary)88)' }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.9, delay: i * 0.05, ease: 'easeOut' }} />
          </div>
          <span className="text-[6px] font-black uppercase text-[var(--color-text-muted)] opacity-50">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Línea de tendencia ──────────────────────────────────────
const LineChart = ({ data }: { data: { mes_label: string; total: number }[] }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.total)) || 1;
  const W = 280; const H = 72; const P = 8;
  const step = (W - P * 2) / (data.length - 1);
  const pts = data.map((d, i) => ({ x: P + i * step, y: H - P - (d.total / max) * (H - P * 2) }));
  const line = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M ${pts[0].x},${H - P} ${pts.map(p => `L ${p.x},${p.y}`).join(' ')} L ${pts[pts.length - 1].x},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#lg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.polyline points={line} fill="none" stroke="var(--color-primary)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="3"
          fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.08 }} />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={H - 1} textAnchor="middle"
          fontSize="6" fontWeight="800" fill="var(--color-text-muted)" opacity="0.5">
          {d.mes_label}
        </text>
      ))}
    </svg>
  );
};

// ─── Stat Card ───────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent, delay = 0 }: {
  icon: any; label: string; value: string | number; sub?: string; accent?: string; delay?: number;
}) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] shadow-xl flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: accent ? `${accent}18` : 'var(--color-primary)18' }}>
        <Icon size={16} style={{ color: accent ?? 'var(--color-primary)' }} />
      </div>
      {sub && <span className="text-[7px] font-black uppercase tracking-wide opacity-50 text-[var(--color-text-muted)]">{sub}</span>}
    </div>
    <p className="text-[7px] font-black uppercase tracking-widest leading-none opacity-40 text-[var(--color-text-muted)]">{label}</p>
    <p className="text-2xl font-black italic tracking-tighter leading-none text-[var(--color-text)]">{value}</p>
  </motion.div>
);

// ─── Vista Inicio ────────────────────────────────────────────
const VistaInicio = ({ stats }: { stats: DashboardEscuela }) => {
  const cambio = pctChange(stats.ingresos_mes_actual, stats.ingresos_mes_anterior);
  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Alumnos Activos" value={stats.total_alumnos_activos}
          sub={`+${stats.alumnos_nuevos_30d} este mes`} delay={0.05} />
        <StatCard icon={GraduationCap} label="Profesores" value={stats.total_profesores} delay={0.1} />
        <StatCard icon={CheckCircle} label="Asistencia Hoy" value={stats.asistencia_hoy} accent="#22c55e" delay={0.15} />
        <StatCard icon={Clock} label="Pagos Pendientes" value={stats.pagos_pendientes_count} accent="#f97316" delay={0.2} />
      </div>

      {/* Distribución cintas */}
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl flex items-center justify-between gap-6">
        <div className="flex-1 text-left space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <PieIcon size={14} className="text-indigo-500" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Grados Kup</span>
          </div>
          <h3 className="text-lg font-black italic uppercase text-[var(--color-text)]">Distribución</h3>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
            {stats.distribucion_cintas.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {/* Pastilla de cinta: color base + franja si existe */}
                <div className="relative w-4 h-2 rounded-sm flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: beltHex(c.color) }}>
                  {c.color_stripe && (
                    <div className="absolute inset-y-0 right-0 w-1"
                      style={{ backgroundColor: beltHex(c.color_stripe) }} />
                  )}
                </div>
                <span className="text-[8px] font-black uppercase truncate opacity-70 text-[var(--color-text)]">
                  {c.nivelkupdan || c.color}: {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
        <BeltRingChart data={stats.distribucion_cintas} />
      </div>

      {/* Ingresos semana */}
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl">
        <div className="flex justify-between items-start mb-1">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 size={14} className="text-emerald-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Esta Semana</span>
            </div>
            <h3 className="text-lg font-black italic uppercase text-[var(--color-text)]">Ingresos</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-tighter leading-none" style={{ color: 'var(--color-primary)' }}>
              ${fmt(stats.ingresos_mes_actual)}
            </p>
            {cambio !== null && (
              <div className="flex items-center justify-end gap-1 mt-1">
                {cambio >= 0
                  ? <TrendingUp size={10} className="text-emerald-500" />
                  : <TrendingDown size={10} className="text-red-500" />
                }
                <span className={`text-[8px] font-black ${cambio >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {cambio >= 0 ? '+' : ''}{cambio}% vs mes ant.
                </span>
              </div>
            )}
          </div>
        </div>
        <BarChart data={stats.ingresos_semana.map(d => ({ label: d.label, value: d.value }))} />
      </div>

      {/* Tendencia 6 meses */}
      {stats.ingresos_6_meses.length > 1 && (
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)18' }}>
              <TrendingUp size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Tendencia 6 Meses</span>
          </div>
          <LineChart data={stats.ingresos_6_meses} />
        </div>
      )}

      {/* Asistencia semanal */}
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Users size={14} className="text-emerald-500" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Asistencia Semanal</span>
          </div>
          <span className="text-lg font-black italic tracking-tighter text-emerald-500">{stats.asistencia_hoy} hoy</span>
        </div>
        <BarChart data={stats.asistencia_semana.map(d => ({ label: d.label, value: d.presentes }))} h={64} />
      </div>

      {/* Resumen deuda + torneo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center gap-1">
          <AlertTriangle className="text-orange-500 mb-1" size={22} />
          <p className="text-[8px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Deuda Vencida</p>
          <p className="text-xl font-black italic text-[var(--color-text)]">{stats.alumnos_deuda_vencida.length}</p>
          <p className="text-[7px] text-orange-500 font-black">${fmt(stats.deuda_total_pendiente)}</p>
        </div>
        <div className="bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center gap-1">
          <Target className="text-purple-500 mb-1" size={22} />
          <p className="text-[8px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">En Torneo</p>
          <p className="text-xl font-black italic text-[var(--color-text)]">{stats.alumnos_torneo_count}</p>
        </div>
      </div>

      {/* Alumnos con deuda vencida */}
      {stats.alumnos_deuda_vencida.length > 0 && (
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-orange-500/20 shadow-2xl space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Deuda Vencida +30 días</span>
          </div>
          {stats.alumnos_deuda_vencida.slice(0, 5).map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-black uppercase italic tracking-tighter truncate text-[var(--color-text)]">
                  {a.nombres} {a.apellidopaterno}
                </p>
                <p className="text-[8px] text-[var(--color-text-muted)] opacity-60 truncate">{a.concepto}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-orange-500">${fmt(a.monto)}</p>
                <p className="text-[7px] font-black opacity-40 text-[var(--color-text-muted)]">{a.dias_vencido}d vencido</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Próximos exámenes */}
      {stats.proximos_examenes.length > 0 && (
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Próximos Exámenes</span>
          </div>
          {stats.proximos_examenes.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-black uppercase italic tracking-tighter truncate text-[var(--color-text)]">
                  {e.nombre_examen}
                </p>
                <p className="text-[8px] text-[var(--color-text-muted)] opacity-60">{e.lugar}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[9px] font-black" style={{ color: 'var(--color-primary)' }}>
                  {new Date(e.fecha_programada + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </p>
                {e.costo_examen ? (
                  <p className="text-[7px] opacity-40 font-black text-[var(--color-text-muted)]">${fmt(e.costo_examen)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cumpleaños */}
      {stats.cumpleanos_proximos.length > 0 && (
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-pink-500/20 shadow-2xl space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Cake size={14} className="text-pink-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">Cumpleaños Esta Semana</span>
          </div>
          {stats.cumpleanos_proximos.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: 'var(--color-background)' }}>
              <p className="text-[11px] font-black uppercase italic tracking-tighter text-[var(--color-text)]">
                {a.nombres} {a.apellidopaterno}
              </p>
              <div className="text-right flex-shrink-0">
                <p className="text-[9px] font-black text-pink-500">{a.fecha_display}</p>
                <p className="text-[7px] opacity-40 font-black text-[var(--color-text-muted)]">{a.edad} años</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export const EscuelaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [escuela, setEscuela]     = useState<Escuela | null>(null);
  const [stats, setStats]         = useState<DashboardEscuela | null>(null);
  const [loading, setLoading]     = useState(true);
  const { currentTheme }          = useAuth();

  // Sub-vistas torneos
  const [torneoSubVista, setTorneoSubVista] = useState<null | 'checkin'>(null);
  const [torneoActivoId, setTorneoActivoId] = useState<number | null>(null);

  const handleTabChange = (t: string) => {
    setActiveTab(t);
    setTorneoSubVista(null);
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [escuelaRes, statsRes] = await Promise.all([
        escuelaService.getMiEscuela(),
        dashboardService.getEscuelaStats(),
      ]);
      setEscuela(escuelaRes);
      setStats(statsRes);
      if (escuelaRes?.color_paleta) {
        themeService.applyTheme(escuelaRes.color_paleta);
        try {
          const s = localStorage.getItem('user_session');
          if (s) {
            const p = JSON.parse(s);
            p.tema = escuelaRes.color_paleta;
            localStorage.setItem('user_session', JSON.stringify(p));
          }
        } catch (_) {}
        localStorage.setItem('theme_preference', escuelaRes.color_paleta);
      }
    } catch (err) {
      console.error('Error Sync:', err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const handleLogout = () => { localStorage.clear(); window.location.href = '/auth/login'; };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <Loader2 className="animate-spin text-[var(--color-primary)] mb-4" size={48} />
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)] animate-pulse">
        Sincronizando Dojo...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-700">
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/30 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-card)] shadow-lg border border-[var(--color-border)]/50 overflow-hidden flex items-center justify-center flex-shrink-0">
              {escuela?.logo_url
                ? <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Logo" />
                : <School className="text-[var(--color-primary)]" size={20} />
              }
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] leading-none mb-0.5 opacity-70">Unidad Activa</p>
              <h1 className="text-xs font-black italic uppercase tracking-tighter truncate max-w-[140px] text-[var(--color-text)]">
                {escuela?.nombreescuela || 'Mi Academia'}
              </h1>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button className="p-2.5 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm active:scale-90 transition-all hover:text-[var(--color-primary)]">
              <Bell size={18} />
            </button>
            <button onClick={handleLogout}
              className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/10 shadow-sm active:scale-90 transition-all hover:bg-red-500 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-40">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} className="space-y-5">
            {activeTab === 'inicio' && stats && <VistaInicio stats={stats} />}
            {activeTab === 'perfil' && escuela && <PerfilConfiguracion initialEscuela={escuela} onUpdate={() => fetchData(true)} />}
            {activeTab === 'profesores' && <GestionProfesores />}
            {activeTab === 'alumnos' && <GestionAlumnos />}
            {activeTab === 'caja' && <CajaFinanzas />}
            {activeTab === 'torneos' && (
              torneoSubVista === 'checkin' && torneoActivoId ? (
                <CheckinTorneoView
                  idtorneo={torneoActivoId}
                  onVolver={() => setTorneoSubVista(null)}
                />
              ) : (
                <TorneosEscuelaView
                  onAbrirCheckin={(id: number) => {
                    setTorneoActivoId(id);
                    setTorneoSubVista('checkin');
                  }}
                />
              )
            )}
            {activeTab === 'combates' && <MisCombatesView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <GlobalNavbar key={currentTheme} activeTab={activeTab} onTabChange={handleTabChange} role="Escuela" />
    </div>
  );
};

export default EscuelaDashboard;