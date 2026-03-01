// ============================================================
//  src/views/superadmin/SuperAdminDashboard.tsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Trophy, UserPlus, DollarSign,
  Swords, Settings, LogOut, ShieldCheck,
  AlertCircle, RotateCcw, School, Users,
  Medal, BarChart3, Sun, Moon, Wifi, WifiOff,
  GraduationCap, Building2, ChevronRight,
} from 'lucide-react';

// @ts-ignore
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard.service';
import TorneosView from './TorneosView';
import CombatesView from './CombatesView';
import UsuariosView from './UsuariosView';
// ─────────────────────────────────────────────────────────────
//  TIPOS basados en la respuesta real de la API
// ─────────────────────────────────────────────────────────────
interface UsuarioItem {
  idusuario: number;
  username: string;
  rol: string;
  [key: string]: any;
}

interface EscuelaItem {
  idescuela: number;
  nombreescuela: string;
  logo_url: string | null;
}

interface SuperAdminStats {
  total_usuarios: number;
  usuarios_online_recientes: number;
  usuarios_por_rol: Record<string, number>;
  usuarios_lista: UsuarioItem[];
  escuelas: EscuelaItem[];
  filtro_aplicado: any;
  resumen_sistema: { total_escuelas: number };
}

// ─────────────────────────────────────────────────────────────
//  TEMA CLARO / OSCURO
// ─────────────────────────────────────────────────────────────
const DARK = {
  bg:        '#06060a',
  surface:   '#0d0d14',
  card:      '#111118',
  cardHover: '#161622',
  border:    '#1e1e2e',
  violet:    '#7c3aed',
  violetLo:  '#7c3aed22',
  violetHi:  '#a855f7',
  cyan:      '#06b6d4',
  cyanLo:    '#06b6d422',
  green:     '#10b981',
  greenLo:   '#10b98122',
  orange:    '#f97316',
  orangeLo:  '#f9731622',
  red:       '#ef4444',
  redLo:     '#ef444422',
  yellow:    '#eab308',
  yellowLo:  '#eab30822',
  text:      '#e2e8f0',
  textMid:   '#94a3b8',
  textDim:   '#475569',
  navBg:     'rgba(13,13,20,0.92)',
};

const LIGHT = {
  bg:        '#f1f5f9',
  surface:   '#ffffff',
  card:      '#ffffff',
  cardHover: '#f8fafc',
  border:    '#e2e8f0',
  violet:    '#7c3aed',
  violetLo:  '#7c3aed12',
  violetHi:  '#6d28d9',
  cyan:      '#0891b2',
  cyanLo:    '#0891b212',
  green:     '#059669',
  greenLo:   '#05966912',
  orange:    '#ea580c',
  orangeLo:  '#ea580c12',
  red:       '#dc2626',
  redLo:     '#dc262612',
  yellow:    '#ca8a04',
  yellowLo:  '#ca8a0412',
  text:      '#0f172a',
  textMid:   '#475569',
  textDim:   '#94a3b8',
  navBg:     'rgba(255,255,255,0.92)',
};

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
    const steps = 40;
    const inc = value / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 24);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString('es-MX')}</>;
};

// ─────────────────────────────────────────────────────────────
//  DONUT CHART — Distribución por Rol
// ─────────────────────────────────────────────────────────────
const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  T: typeof DARK;
}> = ({ data, T }) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  if (total === 0) return null;

  let offset = 0;
  const radius = 36;
  const circum = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none"
            stroke={T.border} strokeWidth="14" />
          {data.map((item, i) => {
            const pct = item.value / total;
            const dash = pct * circum;
            const gap = circum - dash;
            const currentOffset = offset;
            offset += dash;
            return (
              <motion.circle
                key={i} cx="50" cy="50" r={radius} fill="none"
                stroke={item.color} strokeWidth="14"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-currentOffset}
                initial={{ strokeDasharray: `0 ${circum}` }}
                animate={{ strokeDasharray: `${dash} ${gap}` }}
                transition={{ duration: 1.2, delay: i * 0.2, ease: 'easeOut' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black tracking-tighter leading-none" style={{ color: T.text }}>{total}</span>
          <span className="text-[7px] font-black uppercase tracking-wider mt-0.5" style={{ color: T.textDim }}>total</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1">
        {data.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMid }}>
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 rounded-full overflow-hidden w-16" style={{ backgroundColor: T.border }}>
                <motion.div className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / total) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                />
              </div>
              <span className="text-sm font-black w-5 text-right" style={{ color: T.text }}>{item.value}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BAR CHART — Usuarios por escuela (simulado con datos reales)
// ─────────────────────────────────────────────────────────────
const HorizontalBarChart: React.FC<{
  items: { label: string; value: number; max: number; color: string }[];
  T: typeof DARK;
}> = ({ items, T }) => (
  <div className="space-y-3">
    {items.map((item, i) => (
      <div key={i} className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[140px]"
            style={{ color: T.textMid }}>{item.label}</span>
          <span className="text-xs font-black" style={{ color: T.text }}>{item.value}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.border }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}99)` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
          />
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  ACTIVITY TIMELINE — últimos usuarios registrados
// ─────────────────────────────────────────────────────────────
const ActivityTimeline: React.FC<{
  usuarios: UsuarioItem[];
  T: typeof DARK;
}> = ({ usuarios, T }) => {
  const rolColor: Record<string, string> = {
    Escuela:    T.violet,
    Profesor:   T.cyan,
    SuperAdmin: T.orange,
  };
  const rolIcon: Record<string, React.ElementType> = {
    Escuela:    Building2,
    Profesor:   GraduationCap,
    SuperAdmin: ShieldCheck,
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
      {usuarios.slice(0, 9).map((u, i) => {
        const color = rolColor[u.rol] || T.textDim;
        const Icon = rolIcon[u.rol] || Users;
        return (
          <motion.div
            key={u.idusuario}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-2xl transition-all group cursor-default"
            style={{ backgroundColor: T.surface }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.cardHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = T.surface)}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
              style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}>
              {u.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11px] font-black uppercase italic tracking-tighter truncate leading-none"
                style={{ color: T.text }}>{u.username}</p>
              <div className="flex items-center gap-1 mt-1">
                <Icon size={9} style={{ color }} />
                <span className="text-[8px] font-black uppercase tracking-widest leading-none"
                  style={{ color }}>{u.rol}</span>
              </div>
            </div>
            <span className="text-[8px] font-black opacity-30" style={{ color: T.textDim }}>
              #{u.idusuario}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  ESCUELAS CARDS
// ─────────────────────────────────────────────────────────────
const EscuelasGrid: React.FC<{
  escuelas: EscuelaItem[];
  totalUsuarios: number;
  usuariosPorRol: Record<string, number>;
  T: typeof DARK;
}> = ({ escuelas, totalUsuarios, usuariosPorRol, T }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {escuelas.map((esc, i) => (
      <motion.div
        key={esc.idescuela}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 + i * 0.1 }}
        whileHover={{ y: -3 }}
        className="rounded-[2rem] p-5 flex items-center gap-4 cursor-default"
        style={{
          background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
          border: `1px solid ${T.border}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Logo o placeholder */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: T.violetLo, border: `1px solid ${T.violet}30` }}>
          {esc.logo_url
            ? <img src={esc.logo_url} alt={esc.nombreescuela} className="w-full h-full object-cover" />
            : <School size={24} style={{ color: T.violetHi }} />
          }
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-black uppercase italic tracking-tighter truncate leading-none"
            style={{ color: T.text }}>{esc.nombreescuela}</p>
          <p className="text-[8px] font-black uppercase tracking-widest mt-1 leading-none"
            style={{ color: T.textDim }}>ID #{esc.idescuela}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider"
              style={{ backgroundColor: T.violetLo, color: T.violetHi, border: `1px solid ${T.violet}25` }}>
              Activa
            </span>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: T.textDim, flexShrink: 0 }} />
      </motion.div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: number; prefix?: string;
  icon: React.ElementType; accent: string; accentLo: string;
  delay?: number; T: typeof DARK;
}> = ({ label, value, prefix = '', icon: Icon, accent, accentLo, delay = 0, T }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    whileHover={{ y: -3 }}
    className="relative overflow-hidden rounded-[1.75rem] p-5 cursor-default"
    style={{
      background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
      border: `1px solid ${T.border}`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)`,
    }}
  >
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`, transform: 'translate(25%, -25%)' }} />
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: accentLo, border: `1px solid ${accent}40` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
    <p className="text-[8px] font-black uppercase tracking-[0.3em] leading-none mb-2" style={{ color: T.textDim }}>
      {label}
    </p>
    <p className="text-3xl font-black tracking-tighter leading-none" style={{ color: T.text }}>
      <AnimatedNumber value={value} prefix={prefix} />
    </p>
    <motion.div
      className="absolute bottom-0 left-0 h-[2px]"
      style={{ background: `linear-gradient(90deg, ${accent}, transparent)`, width: '55%' }}
      initial={{ scaleX: 0, transformOrigin: 'left' }}
      animate={{ scaleX: 1 }}
      transition={{ delay: delay + 0.5, duration: 0.8 }}
    />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  PARTICLE BG
// ─────────────────────────────────────────────────────────────
const ParticleBg: React.FC<{ T: typeof DARK; isDark: boolean }> = ({ T, isDark }) => {
  if (!isDark) return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{
      background: `
        radial-gradient(ellipse 60% 40% at 10% 10%, ${T.violet}08 0%, transparent 60%),
        radial-gradient(ellipse 50% 35% at 90% 90%, ${T.cyan}06 0%, transparent 60%)
      `
    }} />
  );

  const particles = Array.from({ length: 18 }, (_, i) => ({
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
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
            background: p.color, opacity: 0.15, boxShadow: `0 0 ${p.size * 5}px ${p.color}` }}
          animate={{ y: [0, -24, 0], opacity: [0.1, 0.3, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 60% 40% at 15% 15%, ${T.violet}18 0%, transparent 60%),
          radial-gradient(ellipse 50% 35% at 85% 85%, ${T.cyan}12 0%, transparent 60%)
        `
      }} />
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)',
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BOTTOM NAVBAR
// ─────────────────────────────────────────────────────────────
const BottomNav: React.FC<{
  active: string; onChange: (id: string) => void; T: typeof DARK;
}> = ({ active, onChange, T }) => (
  <motion.nav
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.3, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4"
  >
    <div className="flex items-center gap-1 px-2 py-2 rounded-[2rem]"
      style={{
        background: T.navBg,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${T.border}`,
        boxShadow: `0 -4px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <motion.button key={id} onClick={() => onChange(id)} whileTap={{ scale: 0.88 }}
            className="relative flex items-center justify-center rounded-[1.5rem] overflow-hidden"
            animate={{
              minWidth: isActive ? 108 : 52,
              backgroundColor: isActive ? `${T.violet}22` : 'transparent',
            }}
            style={{ height: 52, border: `1px solid ${isActive ? T.violet + '44' : 'transparent'}` }}
          >
            {isActive && (
              <motion.div layoutId="nav-pill"
                className="absolute inset-0 rounded-[1.5rem] pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${T.violet}25, transparent 70%)` }}
              />
            )}
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div key="a" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }} className="flex flex-col items-center gap-1 px-4">
                  <Icon size={14} style={{ color: T.violetHi }} />
                  <span className="text-[7px] font-black uppercase tracking-widest whitespace-nowrap"
                    style={{ color: T.violetHi }}>{label}</span>
                </motion.div>
              ) : (
                <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 16px' }}>
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
//  COMING SOON
// ─────────────────────────────────────────────────────────────
const ComingSoon: React.FC<{ label: string; icon: React.ElementType; T: typeof DARK }> = ({ label, icon: Icon, T }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-32 gap-6">
    <motion.div animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="w-20 h-20 rounded-[2rem] flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${T.violetLo}, ${T.cyanLo})`,
        border: `1px solid ${T.violet}40`, boxShadow: `0 0 40px ${T.violet}20` }}>
      <Icon size={36} style={{ color: T.violetHi }} />
    </motion.div>
    <div className="text-center space-y-2">
      <p className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: T.text }}>{label}</p>
      <p className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: T.textDim }}>Módulo en desarrollo</p>
    </div>
    <div className="flex gap-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: T.violet }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  DASHBOARD HOME — Vista principal con gráficas
// ─────────────────────────────────────────────────────────────
const DashboardHome: React.FC<{ T: typeof DARK }> = ({ T }) => {
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
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 rounded-full"
        style={{ border: `3px solid ${T.border}`, borderTop: `3px solid ${T.violet}`,
          boxShadow: `0 0 24px ${T.violet}40` }} />
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
      <motion.button whileTap={{ scale: 0.95 }} onClick={cargarStats}
        className="flex items-center gap-2 px-5 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
        style={{ background: T.violetLo, border: `1px solid ${T.violet}50`, color: T.violetHi }}>
        <RotateCcw size={14} /> Reintentar
      </motion.button>
    </div>
  );

  // ── Datos derivados de la API real ──
  const totalEscuelas = stats?.resumen_sistema?.total_escuelas ?? 0;
  const totalUsuarios = stats?.total_usuarios ?? 0;
  const onlineRecientes = stats?.usuarios_online_recientes ?? 0;
  const usuariosPorRol = stats?.usuarios_por_rol ?? {};
  const usuariosLista = stats?.usuarios_lista ?? [];
  const escuelas = stats?.escuelas ?? [];

  // Donut data — roles
  const roleColors: Record<string, string> = {
    Escuela: T.violet, Profesor: T.cyan, SuperAdmin: T.orange,
  };
  const donutData = Object.entries(usuariosPorRol).map(([label, value]) => ({
    label, value: value as number, color: roleColors[label] || T.textMid,
  }));

  // Barras — usuarios por rol
  const maxRolValue = Math.max(...Object.values(usuariosPorRol).map(v => v as number), 1);
  const barData = Object.entries(usuariosPorRol).map(([label, value]) => ({
    label, value: value as number, max: maxRolValue,
    color: roleColors[label] || T.textMid,
  }));

  return (
    <div className="space-y-6">

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Escuelas"    value={totalEscuelas}  icon={School}       accent={T.violet} accentLo={T.violetLo} delay={0.1} T={T} />
        <StatCard label="Usuarios"    value={totalUsuarios}  icon={Users}        accent={T.cyan}   accentLo={T.cyanLo}   delay={0.2} T={T} />
        <StatCard label="Online Hoy"  value={onlineRecientes}icon={Wifi}         accent={T.green}  accentLo={T.greenLo}  delay={0.3} T={T} />
        <StatCard label="Roles Act."  value={Object.keys(usuariosPorRol).length} icon={Medal} accent={T.orange} accentLo={T.orangeLo} delay={0.4} T={T} />
      </div>

      {/* ── FILA 2: Donut + Barras ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Distribución por rol — Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[2rem] p-6"
          style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
            border: `1px solid ${T.border}`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.1)` }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: T.violetLo, border: `1px solid ${T.violet}30` }}>
              <BarChart3 size={14} style={{ color: T.violetHi }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic tracking-tighter leading-none"
                style={{ color: T.text }}>Distribución por Rol</p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-0.5 leading-none"
                style={{ color: T.textDim }}>Usuarios del sistema</p>
            </div>
          </div>
          <DonutChart data={donutData} T={T} />
        </motion.div>

        {/* Conteo por rol — Barras horizontales */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-[2rem] p-6"
          style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
            border: `1px solid ${T.border}`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.1)` }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: T.cyanLo, border: `1px solid ${T.cyan}30` }}>
              <Users size={14} style={{ color: T.cyan }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic tracking-tighter leading-none"
                style={{ color: T.text }}>Usuarios por Rol</p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-0.5 leading-none"
                style={{ color: T.textDim }}>Comparativa de accesos</p>
            </div>
          </div>
          <HorizontalBarChart items={barData} T={T} />

          {/* Mini resumen */}
          <div className="mt-5 pt-4 flex items-center justify-between"
            style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-1.5">
              <Wifi size={12} style={{ color: onlineRecientes > 0 ? T.green : T.textDim }} />
              <span className="text-[9px] font-black uppercase tracking-wider"
                style={{ color: onlineRecientes > 0 ? T.green : T.textDim }}>
                {onlineRecientes > 0 ? `${onlineRecientes} online` : 'Sin actividad reciente'}
              </span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider"
              style={{ color: T.textDim }}>{totalUsuarios} total</span>
          </div>
        </motion.div>
      </div>

      {/* ── FILA 3: Escuelas registradas ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-[2rem] p-6"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
          border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: T.orangeLo, border: `1px solid ${T.orange}30` }}>
              <Building2 size={14} style={{ color: T.orange }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic tracking-tighter leading-none"
                style={{ color: T.text }}>Escuelas Registradas</p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-0.5 leading-none"
                style={{ color: T.textDim }}>{escuelas.length} unidades activas</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: T.greenLo, border: `1px solid ${T.green}30` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.green }} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.green }}>Live</span>
          </div>
        </div>
        <EscuelasGrid escuelas={escuelas} totalUsuarios={totalUsuarios}
          usuariosPorRol={usuariosPorRol} T={T} />
      </motion.div>

      {/* ── FILA 4: Activity Timeline — Lista de usuarios ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-[2rem] p-6"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
          border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: T.yellowLo, border: `1px solid ${T.yellow}30` }}>
            <Users size={14} style={{ color: T.yellow }} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase italic tracking-tighter leading-none"
              style={{ color: T.text }}>Directorio de Usuarios</p>
            <p className="text-[7px] font-black uppercase tracking-widest mt-0.5 leading-none"
              style={{ color: T.textDim }}>{usuariosLista.length} registros activos</p>
          </div>
        </div>
        <ActivityTimeline usuarios={usuariosLista} T={T} />
      </motion.div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MAIN LAYOUT
// ─────────────────────────────────────────────────────────────
export const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);

  const T = isDark ? DARK : LIGHT;

  const handleLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };

  const PAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
    dashboard: { label: 'Panel Global',     icon: LayoutDashboard },
    torneos:   { label: 'Torneos',           icon: Trophy          },
    usuarios:  { label: 'Gestión Usuarios',  icon: UserPlus        },
    finanzas:  { label: 'Finanzas',          icon: DollarSign      },
    combates:  { label: 'Combates',          icon: Swords          },
    config:    { label: 'Configuración',     icon: Settings        },
  };
  const current = PAGE_META[activeTab];

  return (
    <motion.div
      className="min-h-screen relative flex flex-col transition-colors duration-500"
      style={{ background: T.bg, color: T.text }}
      animate={{ backgroundColor: T.bg }}
    >
      <ParticleBg T={T} isDark={isDark} />

      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: T.navBg,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${T.border}`,
          boxShadow: `0 4px 32px rgba(0,0,0,0.1)`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1, rotate: 6 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${T.violetLo}, ${T.cyanLo})`,
                border: `1px solid ${T.violet}55`, boxShadow: `0 0 16px ${T.violet}30` }}>
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

          {/* Page name */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}
              className="hidden md:flex items-center gap-2">
              <current.icon size={12} style={{ color: T.violetHi }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]"
                style={{ color: T.textDim }}>{current.label}</span>
            </motion.div>
          </AnimatePresence>

          {/* Right: toggle modo + user + logout */}
          <div className="flex items-center gap-2">

            {/* Toggle oscuro/claro */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setIsDark(!isDark)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              <AnimatePresence mode="wait">
                {isDark
                  ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Sun size={16} style={{ color: T.yellow }} />
                    </motion.div>
                  : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Moon size={16} style={{ color: T.violet }} />
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>

            {/* User badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`, color: '#fff' }}>
                {(user?.nombre || user?.name || 'S')[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[9px] font-black uppercase italic tracking-tighter leading-none"
                  style={{ color: T.text }}>{user?.nombre || user?.name || 'Superadmin'}</p>
                <p className="text-[7px] font-bold uppercase tracking-widest mt-0.5 leading-none"
                  style={{ color: T.violet }}>{user?.rol || user?.role}</p>
              </div>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
            </div>

            {/* Logout */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.redLo)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = T.surface)}
              title="Cerrar sesión">
              <LogOut size={16} style={{ color: T.textDim }} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── CONTENIDO ── */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 pt-6 pb-36">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
            {activeTab === 'dashboard' && <DashboardHome T={T} />}
            {activeTab === 'torneos'   && <TorneosView T={T}  />}
            {activeTab === 'usuarios'  && <UsuariosView T={T} />}
            {activeTab === 'finanzas'  && <ComingSoon label="Finanzas"          icon={DollarSign} T={T} />}
            {activeTab === 'combates'  && <CombatesView T={T} />}
            {activeTab === 'config'    && <ComingSoon label="Configuración"     icon={Settings}   T={T} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAVBAR ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} T={T} />
    </motion.div>
  );
};

export default SuperAdminDashboard;