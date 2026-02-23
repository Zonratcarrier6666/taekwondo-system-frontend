// ============================================================
//  src/views/superadmin/SuperAdminDashboard.tsx
//  Diseño: "Obsidian Command Center" — Premium Dark UI
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Trophy, UserPlus, DollarSign,
  Swords, Settings, LogOut, ShieldCheck,
  AlertCircle, RotateCcw, School, Users, TrendingUp,
  Medal, BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// @ts-ignore
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard.service';

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS — Obsidian palette
// ─────────────────────────────────────────────────────────────
const T = {
  bg:       '#06060a',
  surface:  '#0d0d14',
  card:     '#111118',
  border:   '#1e1e2e',
  violet:   '#7c3aed',
  violetLo: '#7c3aed22',
  violetHi: '#a855f7',
  cyan:     '#06b6d4',
  cyanLo:   '#06b6d422',
  green:    '#10b981',
  greenLo:  '#10b98122',
  orange:   '#f97316',
  orangeLo: '#f9731622',
  red:      '#ef4444',
  redLo:    '#ef444422',
  text:     '#e2e8f0',
  textMid:  '#94a3b8',
  textDim:  '#475569',
};

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
interface EscuelaResumen {
  idescuela: number;
  nombre: string;
  total_alumnos: number;
  total_profesores: number;
  ingresos_mes: number;
  deuda_pendiente: number;
  alumnos_activos: number;
}

interface SuperAdminStats {
  total_escuelas: number;
  total_alumnos: number;
  total_profesores: number;
  ingresos_totales_mes: number;
  deuda_total_pendiente: number;
  escuelas: EscuelaResumen[];
}

// ─────────────────────────────────────────────────────────────
//  NAV ITEMS
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'torneos',   label: 'Torneos',   icon: Trophy          },
  { id: 'usuarios',  label: 'Usuarios',  icon: UserPlus        },
  { id: 'finanzas',  label: 'Finanzas',  icon: DollarSign      },
  { id: 'combates',  label: 'Combates',  icon: Swords          },
  { id: 'config',    label: 'Config',    icon: Settings        },
];

// ─────────────────────────────────────────────────────────────
//  ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 50;
    const inc = value / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 28);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString('es-MX')}</>;
};

// ─────────────────────────────────────────────────────────────
//  PARTICLE BACKGROUND
// ─────────────────────────────────────────────────────────────
const ParticleBg: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    dur: Math.random() * 8 + 6,
    delay: Math.random() * 4,
    color: i % 3 === 0 ? T.violet : i % 3 === 1 ? T.cyan : T.green,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
            opacity: 0.15,
            boxShadow: `0 0 ${p.size * 5}px ${p.color}`,
          }}
          animate={{ y: [0, -28, 0], opacity: [0.1, 0.35, 0.1], scale: [1, 1.6, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Gradient mesh */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 60% 40% at 15% 15%, ${T.violet}18 0%, transparent 60%),
          radial-gradient(ellipse 50% 35% at 85% 85%, ${T.cyan}12 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 60% 40%, ${T.green}08 0%, transparent 60%)
        `
      }} />
      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)',
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  KPI CARD
// ─────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string; value: number; prefix?: string;
  icon: React.ElementType; accent: string; accentLo: string;
  delay?: number; trend?: 'up' | 'down';
}> = ({ label, value, prefix = '', icon: Icon, accent, accentLo, delay = 0, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative overflow-hidden rounded-[1.75rem] p-5 flex flex-col gap-4 cursor-default"
    style={{
      background: `linear-gradient(135deg, ${T.card} 0%, ${T.surface} 100%)`,
      border: `1px solid ${T.border}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
    }}
  >
    {/* Glow corner */}
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}
    />
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: accentLo, border: `1px solid ${accent}40` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest"
          style={{
            background: trend === 'up' ? T.greenLo : T.redLo,
            color: trend === 'up' ? T.green : T.red,
            border: `1px solid ${trend === 'up' ? T.green : T.red}30`,
          }}>
          {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          <span className="ml-0.5">Live</span>
        </div>
      )}
    </div>
    <div className="text-left">
      <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-2 leading-none" style={{ color: T.textDim }}>
        {label}
      </p>
      <p className="text-3xl font-black tracking-tighter leading-none" style={{ color: T.text }}>
        <AnimatedNumber value={value} prefix={prefix} />
      </p>
    </div>
    {/* Bottom accent line */}
    <motion.div
      className="absolute bottom-0 left-0 h-[2px]"
      style={{ background: `linear-gradient(90deg, ${accent}, transparent)`, width: '60%' }}
      initial={{ scaleX: 0, transformOrigin: 'left' }}
      animate={{ scaleX: 1 }}
      transition={{ delay: delay + 0.4, duration: 0.8, ease: 'easeOut' }}
    />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  BOTTOM NAVBAR PREMIUM
// ─────────────────────────────────────────────────────────────
const BottomNav: React.FC<{
  active: string;
  onChange: (id: string) => void;
  onLogout: () => void;
}> = ({ active, onChange, onLogout }) => (
  <motion.nav
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.35, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4"
  >
    <div
      className="flex items-center gap-1 px-2 py-2 rounded-[2rem]"
      style={{
        background: 'rgba(13,13,20,0.90)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${T.border}`,
        boxShadow: `0 -4px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.88 }}
            className="relative flex items-center justify-center rounded-[1.5rem] transition-all overflow-hidden"
            animate={{
              minWidth: isActive ? 108 : 52,
              background: isActive
                ? `linear-gradient(135deg, ${T.violetLo}, ${T.cyanLo})`
                : 'transparent',
              borderColor: isActive ? `${T.violet}55` : 'transparent',
            }}
            style={{
              height: 52,
              border: '1px solid transparent',
              boxShadow: isActive ? `0 0 20px ${T.violet}30, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
            }}
          >
            {/* Active glow */}
            {isActive && (
              <motion.div
                layoutId="nav-pill-glow"
                className="absolute inset-0 rounded-[1.5rem] pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${T.violet}28, transparent 70%)` }}
              />
            )}
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center gap-1 px-4"
                >
                  <Icon size={15} style={{ color: T.violetHi }} />
                  <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap leading-none" style={{ color: T.violetHi }}>
                    {label}
                  </span>
                </motion.div>
              ) : (
                <motion.div key="inactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 16px' }}>
                  <Icon size={18} style={{ color: T.textDim }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}


    </div>
  </motion.nav>
);

// ─────────────────────────────────────────────────────────────
//  ESCUELAS TABLE
// ─────────────────────────────────────────────────────────────
const EscuelasTable: React.FC<{ escuelas: EscuelaResumen[] }> = ({ escuelas }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.52, duration: 0.5 }}
    className="rounded-[2rem] overflow-hidden"
    style={{
      background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
      border: `1px solid ${T.border}`,
      boxShadow: `0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
    }}
  >
    {/* Header */}
    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: T.violetLo, border: `1px solid ${T.violet}40` }}>
          <BarChart3 size={16} style={{ color: T.violetHi }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
            Rendimiento por Escuela
          </p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1 leading-none" style={{ color: T.textDim }}>
            {escuelas.length} unidades activas
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
        style={{ background: T.greenLo, border: `1px solid ${T.green}30` }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />
        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.green }}>Live</span>
      </div>
    </div>

    {escuelas.length === 0 ? (
      <div className="py-20 text-center">
        <School size={32} className="mx-auto mb-3 opacity-20" style={{ color: T.textDim }} />
        <p className="text-xs font-black uppercase tracking-widest opacity-30" style={{ color: T.textDim }}>Sin escuelas registradas</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['#', 'Escuela', 'Alumnos', 'Profesores', 'Ingresos Mes', 'Deuda'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-[8px] font-black uppercase tracking-[0.25em]" style={{ color: T.textDim }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {escuelas.map((esc, idx) => (
                <motion.tr
                  key={esc.idescuela}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.56 + idx * 0.05 }}
                  className="group transition-all"
                  style={{ borderBottom: `1px solid ${T.border}50` }}
                  whileHover={{ backgroundColor: `${T.violet}09` }}
                >
                  <td className="px-6 py-4 text-[10px] font-black" style={{ color: T.textDim }}>
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 8 }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: T.violetLo, border: `1px solid ${T.violet}30` }}
                      >
                        <School size={13} style={{ color: T.violetHi }} />
                      </motion.div>
                      <span className="text-sm font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
                        {esc.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={11} style={{ color: T.cyan, opacity: 0.7 }} />
                      <span className="text-sm font-black" style={{ color: T.text }}>{esc.total_alumnos}</span>
                      {esc.alumnos_activos > 0 && (
                        <span className="text-[8px] font-bold" style={{ color: T.green, opacity: 0.7 }}>({esc.alumnos_activos})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Medal size={11} style={{ color: T.orange, opacity: 0.7 }} />
                      <span className="text-sm font-black" style={{ color: T.text }}>{esc.total_profesores}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black" style={{ color: T.green }}>
                      ${(esc.ingresos_mes ?? 0).toLocaleString('es-MX')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black"
                      style={{ color: (esc.deuda_pendiente ?? 0) > 0 ? T.orange : T.textDim }}>
                      ${(esc.deuda_pendiente ?? 0).toLocaleString('es-MX')}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  COMING SOON PLACEHOLDER
// ─────────────────────────────────────────────────────────────
const ComingSoon: React.FC<{ label: string; icon: React.ElementType }> = ({ label, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-32 gap-6"
  >
    <motion.div
      animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="w-20 h-20 rounded-[2rem] flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${T.violetLo}, ${T.cyanLo})`,
        border: `1px solid ${T.violet}40`,
        boxShadow: `0 0 40px ${T.violet}25`,
      }}
    >
      <Icon size={36} style={{ color: T.violetHi }} />
    </motion.div>
    <div className="text-center space-y-2">
      <p className="text-2xl font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
        {label}
      </p>
      <p className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: T.textDim }}>
        Módulo en desarrollo
      </p>
    </div>
    <div className="flex gap-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: T.violet }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  DASHBOARD HOME
// ─────────────────────────────────────────────────────────────
const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getSuperAdminStats();
      setStats(data);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarStats(); }, [cargarStats]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 rounded-full"
        style={{
          border: `3px solid ${T.border}`,
          borderTop: `3px solid ${T.violet}`,
          boxShadow: `0 0 24px ${T.violet}40`,
        }}
      />
      <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse" style={{ color: T.textDim }}>
        Sincronizando sistema...
      </p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-5">
      <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center"
        style={{ background: T.redLo, border: `1px solid ${T.red}40` }}>
        <AlertCircle size={28} style={{ color: T.red }} />
      </div>
      <p className="text-sm font-bold italic" style={{ color: T.textMid }}>{error}</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={cargarStats}
        className="flex items-center gap-2 px-5 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
        style={{ background: T.violetLo, border: `1px solid ${T.violet}50`, color: T.violetHi }}
      >
        <RotateCcw size={14} /> Reintentar
      </motion.button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="Escuelas"        value={stats?.total_escuelas ?? 0}         icon={School}     accent={T.violetHi} accentLo={T.violetLo} delay={0.1} trend="up" />
        <KpiCard label="Total Alumnos"   value={stats?.total_alumnos ?? 0}          icon={Users}      accent={T.cyan}     accentLo={T.cyanLo}   delay={0.2} />
        <KpiCard label="Profesores"      value={stats?.total_profesores ?? 0}       icon={Medal}      accent={T.orange}   accentLo={T.orangeLo} delay={0.3} />
        <KpiCard label="Ingresos Mes"    value={stats?.ingresos_totales_mes ?? 0}   icon={TrendingUp} accent={T.green}    accentLo={T.greenLo}  delay={0.4} prefix="$" trend="up" />
        <KpiCard label="Deuda Pendiente" value={stats?.deuda_total_pendiente ?? 0}  icon={DollarSign} accent={T.orange}   accentLo={T.orangeLo} delay={0.5} prefix="$" />
      </div>

      {/* TABLA ESCUELAS */}
      <EscuelasTable escuelas={stats?.escuelas ?? []} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MAIN LAYOUT
// ─────────────────────────────────────────────────────────────
export const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };

  const PAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
    dashboard: { label: 'Panel Global',    icon: LayoutDashboard },
    torneos:   { label: 'Torneos',          icon: Trophy          },
    usuarios:  { label: 'Gestión Usuarios', icon: UserPlus        },
    finanzas:  { label: 'Finanzas',         icon: DollarSign      },
    combates:  { label: 'Combates',         icon: Swords          },
    config:    { label: 'Configuración',    icon: Settings        },
  };
  const current = PAGE_META[activeTab];

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: T.bg, color: T.text }}>
      <ParticleBg />

      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: 'rgba(6,6,10,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${T.border}`,
          boxShadow: `0 4px 40px rgba(0,0,0,0.6)`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 6 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${T.violetLo}, ${T.cyanLo})`,
                border: `1px solid ${T.violet}55`,
                boxShadow: `0 0 18px ${T.violet}35`,
              }}
            >
              <ShieldCheck size={18} style={{ color: T.violetHi }} />
            </motion.div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
                TKW System
              </p>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] mt-0.5 leading-none" style={{ color: T.violet }}>
                Super Admin
              </p>
            </div>
          </div>

          {/* Active page name — centro */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="hidden md:flex items-center gap-2"
            >
              <current.icon size={12} style={{ color: T.violetHi }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: T.textDim }}>
                {current.label}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* User badge + logout */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`, color: '#fff' }}
              >
                {(user?.nombre || user?.name || 'S')[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[9px] font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
                  {user?.nombre || user?.name || 'Superadmin'}
                </p>
                <p className="text-[7px] font-bold uppercase tracking-widest mt-0.5 leading-none" style={{ color: T.violet }}>
                  {user?.rol || user?.role}
                </p>
              </div>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: T.green, boxShadow: `0 0 6px ${T.green}` }}
              />
            </div>

            {/* Logout */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ backgroundColor: T.redLo }}
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
              title="Cerrar sesión"
            >
              <LogOut size={16} style={{ color: T.textDim }} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── CONTENIDO ── */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 pt-6 pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            {activeTab === 'dashboard' && <DashboardHome />}
            {activeTab === 'torneos'   && <ComingSoon label="Torneos"          icon={Trophy}     />}
            {activeTab === 'usuarios'  && <ComingSoon label="Gestión Usuarios" icon={UserPlus}   />}
            {activeTab === 'finanzas'  && <ComingSoon label="Finanzas"         icon={DollarSign} />}
            {activeTab === 'combates'  && <ComingSoon label="Combates"         icon={Swords}     />}
            {activeTab === 'config'    && <ComingSoon label="Configuración"    icon={Settings}   />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAVBAR ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} onLogout={handleLogout} />
    </div>
  );
};

export default SuperAdminDashboard;