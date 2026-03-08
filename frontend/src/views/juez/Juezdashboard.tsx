// ============================================================
//  src/views/juez/JuezDashboard.tsx
//  Dashboard del Juez — mismo sistema de temas que SuperAdmin
//  Tabs: Panel · Mis Áreas · Escaneo QR · Resultados
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Shield, Trophy, LogOut, Sun, Moon,
  Swords, LayoutDashboard, RefreshCw, AlertCircle,
  RotateCcw, CheckCircle2, Clock, Zap, Crown,
  ChevronRight, MapPin, User, Activity,
} from 'lucide-react';

// @ts-ignore
import { useAuth } from '../../context/AuthContext';
import EscaneoQRView from './EscaneoQRView';
import { torneoAreasService, type AreaCombate } from '../../services/torneo_areas.service';
import { torneoService } from '../../services/torneo.service';
import type { Torneo } from '../../types/torneo.types';

// ─────────────────────────────────────────────────────────────
//  TEMA — idéntico al SuperAdmin
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

type Tema = typeof DARK;

// ─────────────────────────────────────────────────────────────
//  NAV ITEMS
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'panel',      label: 'Panel',    icon: LayoutDashboard },
  { id: 'mis_areas',  label: 'Mis Áreas',icon: Shield          },
  { id: 'escaneo',    label: 'Escaneo',  icon: QrCode          },
  { id: 'resultados', label: 'Resultados',icon: Trophy         },
];

// ─────────────────────────────────────────────────────────────
//  PARTICLE BG (igual que SuperAdmin)
// ─────────────────────────────────────────────────────────────
const ParticleBg: React.FC<{ T: Tema; isDark: boolean }> = ({ T, isDark }) => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 12 + 8,
    delay: Math.random() * 6,
  }));

  if (!isDark) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: p.id % 3 === 0 ? T.cyan : p.id % 3 === 1 ? T.violet : T.green,
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
            opacity: 0.3,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.04]"
        style={{ background: T.cyan, filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.05]"
        style={{ background: T.violet, filter: 'blur(60px)' }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BOTTOM NAV
// ─────────────────────────────────────────────────────────────
const BottomNav: React.FC<{ active: string; onChange: (id: string) => void; T: Tema }> = ({ active, onChange, T }) => (
  <motion.nav
    initial={{ y: 80 }} animate={{ y: 0 }}
    transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 26 }}
    className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 px-4 pointer-events-none"
  >
    <div className="flex items-center gap-1 px-3 py-2 rounded-[2rem] pointer-events-auto"
      style={{
        background: T.navBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${T.border}`,
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.4)',
      }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <motion.button key={id} whileTap={{ scale: 0.88 }} onClick={() => onChange(id)}
            className="relative flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all"
            style={{ minWidth: 56 }}>
            {isActive && (
              <motion.div layoutId="juezNavIndicator"
                className="absolute inset-0 rounded-2xl"
                style={{ background: T.cyanLo, border: `1px solid ${T.cyan}40` }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              />
            )}
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div key="a" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="relative flex flex-col items-center gap-0.5">
                  <Icon size={18} style={{ color: T.cyan }} strokeWidth={2.5} />
                  <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: T.cyan }}>
                    {label}
                  </span>
                </motion.div>
              ) : (
                <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="relative">
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
//  STAT CARD
// ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: number | string;
  icon: React.ElementType; accent: string; accentLo: string;
  delay?: number; T: Tema; sub?: string;
}> = ({ label, value, icon: Icon, accent, accentLo, delay = 0, T, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="rounded-[1.75rem] p-4"
    style={{ background: T.card, border: `1px solid ${T.border}` }}
  >
    <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3"
      style={{ background: accentLo, border: `1px solid ${accent}30` }}>
      <Icon size={16} style={{ color: accent }} />
    </div>
    <p className="text-2xl font-black tracking-tighter leading-none" style={{ color: T.text }}>
      {value}
    </p>
    {sub && <p className="text-[8px] font-bold mt-0.5" style={{ color: accent }}>{sub}</p>}
    <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: T.textDim }}>
      {label}
    </p>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  PANEL HOME — resumen del juez
// ─────────────────────────────────────────────────────────────
const PanelHome: React.FC<{
  T: Tema;
  areas: AreaCombate[];
  torneosActivos: Torneo[];
  user: any;
  onIrEscaneo: () => void;
}> = ({ T, areas, torneosActivos, user, onIrEscaneo }) => {
  const combatesPendientes = areas.reduce((acc, a) => acc + a.combates_pendientes, 0);
  const areasActivas       = areas.filter(a => a.estatus === 'en_combate').length;
  const areasDisp          = areas.filter(a => a.estatus === 'disponible').length;

  return (
    <div className="space-y-6">

      {/* Bienvenida */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] p-5"
        style={{
          background: `linear-gradient(135deg, ${T.cyanLo}, ${T.violetLo})`,
          border: `1px solid ${T.cyan}30`,
        }}>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ boxShadow: [`0 0 0px ${T.cyan}00`, `0 0 20px ${T.cyan}60`, `0 0 0px ${T.cyan}00`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 text-xl font-black"
            style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.violet})`, color: '#fff' }}>
            {(user?.nombre || user?.username || 'J')[0].toUpperCase()}
          </motion.div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: T.cyan }}>
              Juez · TKW System
            </p>
            <p className="text-base font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
              {user?.nombre || user?.username || 'Juez'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full" style={{ background: T.green }} />
              <span className="text-[8px] font-bold" style={{ color: T.textMid }}>En línea</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Áreas Asignadas" value={areas.length}
          icon={Shield}  accent={T.cyan}   accentLo={T.cyanLo}   delay={0.05} T={T} />
        <StatCard label="Combates Pend." value={combatesPendientes}
          icon={Swords}  accent={T.orange} accentLo={T.orangeLo} delay={0.1}  T={T}
          sub={combatesPendientes > 0 ? 'Por resolver' : 'Al día ✓'} />
        <StatCard label="Torneos Activos" value={torneosActivos.length}
          icon={Trophy}  accent={T.violet} accentLo={T.violetLo} delay={0.15} T={T} />
        <StatCard label="Áreas en Combate" value={areasActivas}
          icon={Activity} accent={T.green} accentLo={T.greenLo}  delay={0.2}  T={T}
          sub={`${areasDisp} disponibles`} />
      </div>

      {/* CTA Escanear */}
      {torneosActivos.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onIrEscaneo}
          className="w-full flex items-center justify-between p-5 rounded-[2rem]"
          style={{
            background: `linear-gradient(135deg, ${T.cyan}18, ${T.violet}12)`,
            border: `1px solid ${T.cyan}40`,
          }}>
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.violet})` }}>
              <QrCode size={22} color="#fff" />
            </motion.div>
            <div className="text-left">
              <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                Iniciar Escaneo
              </p>
              <p className="text-[8px] font-black uppercase tracking-wider mt-0.5" style={{ color: T.cyan }}>
                Escanea QR de los competidores
              </p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: T.cyan }} />
        </motion.button>
      )}

      {/* Áreas rápidas */}
      {areas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
            Mis Áreas
          </p>
          {areas.map((area, i) => {
            const COLOR = area.estatus === 'en_combate' ? T.orange : area.estatus === 'disponible' ? T.green : T.textDim;
            return (
              <motion.div key={area.idarea}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${COLOR}18`, border: `1px solid ${COLOR}30` }}>
                  <Shield size={15} style={{ color: COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                    {area.nombre_area}
                  </p>
                  <p className="text-[8px] font-bold mt-0.5" style={{ color: T.textDim }}>
                    {area.combates_pendientes} combates pendientes
                  </p>
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
                  style={{ background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}25` }}>
                  {area.estatus.replace('_', ' ')}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {areas.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center py-16 gap-4 rounded-[2rem]"
          style={{ background: T.card, border: `1px dashed ${T.border}` }}>
          <Shield size={32} style={{ color: T.textDim }} />
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
              Sin áreas asignadas
            </p>
            <p className="text-[9px] font-bold mt-1" style={{ color: T.textDim }}>
              El SuperAdmin debe asignarte a un área
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MIS ÁREAS — detalle + selector de torneo
// ─────────────────────────────────────────────────────────────
const MisAreas: React.FC<{
  T: Tema;
  areas: AreaCombate[];
  torneos: Torneo[];
  idtorneoActivo: number | null;
  setIdtorneoActivo: (id: number) => void;
  onRecargar: () => void;
}> = ({ T, areas, torneos, idtorneoActivo, setIdtorneoActivo, onRecargar }) => {
  const torneosEnCurso = torneos.filter(t => t.estatus === 2);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
            Mis Áreas
          </p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-0.5" style={{ color: T.textDim }}>
            Áreas asignadas al juez
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={onRecargar}
          className="w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <RefreshCw size={14} style={{ color: T.textDim }} />
        </motion.button>
      </div>

      {/* Selector torneo */}
      {torneosEnCurso.length > 1 && (
        <div className="space-y-2">
          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
            Torneo activo
          </p>
          <div className="flex gap-2 flex-wrap">
            {torneosEnCurso.map(t => (
              <motion.button key={t.idtorneo} whileTap={{ scale: 0.94 }}
                onClick={() => setIdtorneoActivo(t.idtorneo)}
                className="px-3 h-9 rounded-xl text-[8px] font-black uppercase tracking-wider"
                style={{
                  background: idtorneoActivo === t.idtorneo ? T.cyanLo : T.surface,
                  border: `1px solid ${idtorneoActivo === t.idtorneo ? T.cyan + '60' : T.border}`,
                  color: idtorneoActivo === t.idtorneo ? T.cyan : T.textDim,
                }}>
                {t.nombre}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Áreas */}
      {areas.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 rounded-[2rem]"
          style={{ background: T.card, border: `1px dashed ${T.border}` }}>
          <MapPin size={28} style={{ color: T.textDim }} />
          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
            Sin áreas asignadas
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {areas.map((area, i) => {
            const COLOR  = area.estatus === 'en_combate' ? T.orange : area.estatus === 'disponible' ? T.green : T.textDim;
            const isLive = area.estatus === 'en_combate';
            return (
              <motion.div key={area.idarea}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-[1.75rem] p-5"
                style={{
                  background: isLive
                    ? `linear-gradient(135deg, ${T.orangeLo}, ${T.card})`
                    : T.card,
                  border: `1px solid ${isLive ? T.orange + '40' : T.border}`,
                  boxShadow: isLive ? `0 0 20px ${T.orange}10` : 'none',
                }}>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${COLOR}18`, border: `1px solid ${COLOR}30` }}>
                      {isLive ? (
                        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                          <Swords size={20} style={{ color: COLOR }} />
                        </motion.div>
                      ) : (
                        <Shield size={20} style={{ color: COLOR }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                        {area.nombre_area}
                      </p>
                      <p className="text-[8px] font-bold mt-0.5" style={{ color: T.textDim }}>
                        ID Área #{area.idarea}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}25` }}>
                    {isLive && (
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR }} />
                    )}
                    <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: COLOR }}>
                      {area.estatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Stats del área */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xl font-black tracking-tighter" style={{ color: T.orange }}>
                      {area.combates_pendientes}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest mt-0.5" style={{ color: T.textDim }}>
                      Pendientes
                    </p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-1.5">
                      <User size={12} style={{ color: T.cyan }} />
                      <p className="text-[10px] font-black uppercase italic truncate" style={{ color: T.text }}>
                        {area.juez_username ?? 'Sin juez'}
                      </p>
                    </div>
                    <p className="text-[7px] font-black uppercase tracking-widest mt-1" style={{ color: T.textDim }}>
                      Juez asignado
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  RESULTADOS — historial de combates registrados
// ─────────────────────────────────────────────────────────────
const ResultadosView: React.FC<{
  T: Tema;
  idtorneoActivo: number | null;
}> = ({ T, idtorneoActivo }) => {
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);

  const cargar = useCallback(async () => {
    if (!idtorneoActivo) return;
    setLoading(true);
    try {
      const data = await torneoAreasService.resultadosLocal(idtorneoActivo);
      setResultados(data);
    } catch {
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, [idtorneoActivo]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!idtorneoActivo) return (
    <div className="flex flex-col items-center py-20 gap-4 rounded-[2rem]"
      style={{ background: T.card, border: `1px dashed ${T.border}` }}>
      <Trophy size={28} style={{ color: T.textDim }} />
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
        Selecciona un torneo activo
      </p>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 rounded-full"
        style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.cyan}` }} />
    </div>
  );

  if (resultados.length === 0) return (
    <div className="space-y-5">
      <p className="text-lg font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
        Resultados
      </p>
      <div className="flex flex-col items-center py-20 gap-4 rounded-[2rem]"
        style={{ background: T.card, border: `1px dashed ${T.border}` }}>
        <CheckCircle2 size={28} style={{ color: T.textDim }} />
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
          Sin resultados registrados aún
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="text-lg font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
        Resultados
      </p>
      {resultados.map((cat: any, ci: number) => (
        <motion.div key={ci}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ci * 0.06 }}
          className="rounded-[1.75rem] overflow-hidden"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>

          {/* Header categoría */}
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${T.border}`, background: T.cyanLo }}>
            <p className="text-[10px] font-black uppercase italic tracking-tighter" style={{ color: T.cyan }}>
              {cat.nombre_categoria}
            </p>
            <p className="text-[7px] font-black uppercase tracking-widest mt-0.5" style={{ color: T.textDim }}>
              {cat.competidores?.length ?? 0} competidores
            </p>
          </div>

          {/* Podio */}
          <div className="p-4 space-y-2">
            {(cat.competidores ?? []).slice(0, 5).map((comp: any, pi: number) => {
              const LUGAR_COLOR: Record<number, string> = {
                1: T.yellow, 2: T.textMid, 3: T.orange,
              };
              const color = LUGAR_COLOR[comp.lugar_obtenido] ?? T.textDim;
              return (
                <div key={pi} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: pi < (cat.competidores?.length ?? 1) - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                    style={{ background: `${color}18`, color }}>
                    {comp.lugar_obtenido === 1 ? '🥇' : comp.lugar_obtenido === 2 ? '🥈' : comp.lugar_obtenido === 3 ? '🥉' : comp.lugar_obtenido}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase italic tracking-tighter truncate" style={{ color: T.text }}>
                      {comp.nombre_alumno}
                    </p>
                    <p className="text-[8px] font-bold truncate" style={{ color: T.textDim }}>
                      {comp.escuela} · {comp.num_combates_realizados} combates
                    </p>
                  </div>
                  {comp.lugar_obtenido <= 3 && (
                    <Crown size={14} style={{ color, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────
export const JuezDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab,        setActiveTab]        = useState('panel');
  const [isDark,           setIsDark]           = useState(true);
  const [torneos,          setTorneos]          = useState<Torneo[]>([]);
  const [areas,            setAreas]            = useState<AreaCombate[]>([]);
  const [idtorneoActivo,   setIdtorneoActivo]   = useState<number | null>(null);
  const [idareaActiva,     setIdareaActiva]     = useState<number | null>(null);
  const [loading,          setLoading]          = useState(true);

  const T = isDark ? DARK : LIGHT;

  const handleLogout = () => { logout(); window.location.href = '/auth/login'; };

  const handleTabChange = (t: string) => setActiveTab(t);

  // Cargar torneos y áreas del juez
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await torneoService.listar();
      const activos = data.filter(t => t.estatus === 2);
      setTorneos(data);

      if (activos.length > 0) {
        const primerTorneo = activos[0];
        setIdtorneoActivo(primerTorneo.idtorneo);

        // Cargar áreas del primer torneo activo
        const areasData = await torneoAreasService.listarAreas(primerTorneo.idtorneo);
        // Filtrar solo las áreas donde el juez actual es el asignado
        const miAreas = areasData.filter(
          a => a.idjuez_asignado === user?.idusuario ||
               a.idjuez_asignado === user?.id ||
               a.juez_username   === (user?.username || user?.nombre)
        );
        setAreas(miAreas.length > 0 ? miAreas : areasData); // si no hay match, mostrar todas (para pruebas)
        if (miAreas.length > 0 || areasData.length > 0) {
          setIdareaActiva((miAreas[0] ?? areasData[0])?.idarea ?? null);
        }
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Cuando cambia el torneo activo, recargar áreas
  useEffect(() => {
    if (!idtorneoActivo) return;
    torneoAreasService.listarAreas(idtorneoActivo).then(data => {
      const miAreas = data.filter(
        a => a.idjuez_asignado === user?.idusuario ||
             a.idjuez_asignado === user?.id ||
             a.juez_username   === (user?.username || user?.nombre)
      );
      setAreas(miAreas.length > 0 ? miAreas : data);
      if ((miAreas.length > 0 || data.length > 0) && !idareaActiva) {
        setIdareaActiva((miAreas[0] ?? data[0])?.idarea ?? null);
      }
    }).catch(() => {});
  }, [idtorneoActivo]);

  const torneosActivos = torneos.filter(t => t.estatus === 2);

  const PAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
    panel:      { label: 'Panel',         icon: LayoutDashboard },
    mis_areas:  { label: 'Mis Áreas',     icon: Shield          },
    escaneo:    { label: 'Escaneo QR',    icon: QrCode          },
    resultados: { label: 'Resultados',    icon: Trophy          },
  };
  const current = PAGE_META[activeTab] ?? PAGE_META['panel'];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: T.bg }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 rounded-full"
        style={{ border: `3px solid ${T.border}`, borderTop: `3px solid ${T.cyan}`,
          boxShadow: `0 0 24px ${T.cyan}40` }} />
      <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse" style={{ color: T.textDim }}>
        Cargando panel del juez...
      </p>
    </div>
  );

  return (
    <motion.div className="min-h-screen relative flex flex-col transition-colors duration-500"
      style={{ background: T.bg, color: T.text }}
      animate={{ backgroundColor: T.bg }}>

      <ParticleBg T={T} isDark={isDark} />

      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: T.navBg,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${T.border}`,
          boxShadow: '0 4px 32px rgba(0,0,0,0.1)',
        }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1, rotate: 6 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${T.cyanLo}, ${T.violetLo})`,
                border: `1px solid ${T.cyan}55`,
                boxShadow: `0 0 16px ${T.cyan}30`,
              }}>
              <Swords size={18} style={{ color: T.cyan }} />
            </motion.div>
            <div>
              <p className="text-xs font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
                TKW System
              </p>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] mt-0.5 leading-none" style={{ color: T.cyan }}>
                Juez
              </p>
            </div>
          </div>

          {/* Nombre página */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}
              className="hidden md:flex items-center gap-2">
              <current.icon size={12} style={{ color: T.cyan }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]"
                style={{ color: T.textDim }}>
                {current.label}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Toggle dark/light */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsDark(!isDark)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}>
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
                style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.violet})`, color: '#fff' }}>
                {(user?.nombre || user?.username || 'J')[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[9px] font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
                  {user?.nombre || user?.username || 'Juez'}
                </p>
                <p className="text-[7px] font-bold uppercase tracking-widest mt-0.5 leading-none" style={{ color: T.cyan }}>
                  Juez
                </p>
              </div>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
            </div>

            {/* Logout */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.redLo)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = T.surface)}>
              <LogOut size={16} style={{ color: T.textDim }} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── CONTENIDO ── */}
      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-36">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>

            {activeTab === 'panel' && (
              <PanelHome
                T={T}
                areas={areas}
                torneosActivos={torneosActivos}
                user={user}
                onIrEscaneo={() => setActiveTab('escaneo')}
              />
            )}

            {activeTab === 'mis_areas' && (
              <MisAreas
                T={T}
                areas={areas}
                torneos={torneos}
                idtorneoActivo={idtorneoActivo}
                setIdtorneoActivo={(id) => setIdtorneoActivo(id)}
                onRecargar={cargarDatos}
              />
            )}

            {activeTab === 'escaneo' && idtorneoActivo && (
              <div style={{ color: T.text }}>
                {/* Selector de área si tiene varias */}
                {areas.length > 1 && (
                  <div className="flex gap-2 flex-wrap mb-5">
                    <p className="w-full text-[8px] font-black uppercase tracking-widest mb-1"
                      style={{ color: T.textDim }}>
                      Área de escaneo
                    </p>
                    {areas.map(a => (
                      <motion.button key={a.idarea} whileTap={{ scale: 0.94 }}
                        onClick={() => setIdareaActiva(a.idarea)}
                        className="px-3 h-8 rounded-xl text-[8px] font-black uppercase tracking-wider"
                        style={{
                          background: idareaActiva === a.idarea ? T.cyanLo : T.surface,
                          border: `1px solid ${idareaActiva === a.idarea ? T.cyan + '60' : T.border}`,
                          color: idareaActiva === a.idarea ? T.cyan : T.textDim,
                        }}>
                        {a.nombre_area}
                      </motion.button>
                    ))}
                  </div>
                )}
                <EscaneoQRView
                  idtorneo={idtorneoActivo}
                  idarea={idareaActiva ?? undefined}
                />
              </div>
            )}

            {activeTab === 'escaneo' && !idtorneoActivo && (
              <div className="flex flex-col items-center py-20 gap-4 rounded-[2rem]"
                style={{ background: T.card, border: `1px dashed ${T.border}` }}>
                <Zap size={28} style={{ color: T.textDim }} />
                <p className="text-[10px] font-black uppercase tracking-wider text-center"
                  style={{ color: T.textDim }}>
                  No hay torneos en curso.<br />Espera a que el SuperAdmin inicie el torneo.
                </p>
              </div>
            )}

            {activeTab === 'resultados' && (
              <ResultadosView T={T} idtorneoActivo={idtorneoActivo} />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAV ── */}
      <BottomNav active={activeTab} onChange={handleTabChange} T={T} />
    </motion.div>
  );
};

export default JuezDashboard;