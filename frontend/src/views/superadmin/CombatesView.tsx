// ============================================================
//  src/views/superadmin/CombatesView.tsx
//  Vista de combates en tiempo real — brackets + registro juez
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Crown, Award, RefreshCw, ChevronRight,
  Clock, CheckCircle2, Circle, Zap, Shield, Target,
  Play, SkipForward, AlertTriangle, Users, Calendar,
  ChevronLeft, Minus, Plus, X,
} from 'lucide-react';

import { torneoService } from '../../services/torneo.service';
import type {
  Torneo, BracketLive, CategoriaLive, RondaBracket,
  Combate, Competidor, ResultadoCombateResponse,
} from '../../types/torneo.types';

// ─────────────────────────────────────────────────────────────
//  TEMA — igual que el resto del dashboard
// ─────────────────────────────────────────────────────────────
type Tema = {
  bg: string; surface: string; card: string; cardHover: string;
  border: string; violet: string; violetLo: string; violetHi: string;
  cyan: string; cyanLo: string; green: string; greenLo: string;
  orange: string; orangeLo: string; red: string; redLo: string;
  yellow: string; yellowLo: string;
  text: string; textMid: string; textDim: string; navBg: string;
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

const ESTATUS_TORNEO: Record<number, { label: string; color: string }> = {
  1: { label: 'Próximo',    color: '#10b981' },
  2: { label: 'En Curso',   color: '#f97316' },
  3: { label: 'Finalizado', color: '#94a3b8' },
};

// ─────────────────────────────────────────────────────────────
//  COMPETIDOR SLOT
// ─────────────────────────────────────────────────────────────
const CompetidorSlot: React.FC<{
  comp: Competidor | null | undefined;
  puntos: number;
  esGanador: boolean;
  lado: 'izq' | 'der';
  T: Tema;
}> = ({ comp, puntos, esGanador, lado, T }) => (
  <motion.div
    animate={{ backgroundColor: esGanador ? `${T.green}15` : T.card }}
    className="flex items-center gap-2.5 p-2.5 rounded-2xl"
    style={{ border: `1px solid ${esGanador ? T.green + '50' : T.border}` }}
  >
    {/* Avatar */}
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
      style={{
        background: comp ? `${T.violet}25` : T.surface,
        color: T.violetHi,
        border: `1px solid ${T.violet}20`,
      }}
    >
      {comp ? comp.nombre.charAt(0).toUpperCase() : '?'}
    </div>

    <div className="flex-1 min-w-0">
      {comp ? (
        <>
          <p className="text-[10px] font-black uppercase italic tracking-tighter truncate leading-none"
            style={{ color: T.text }}>{comp.nombre}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: comp.color_cinta || '#888' }} />
            <p className="text-[8px] font-bold truncate leading-none"
              style={{ color: T.textDim }}>{comp.cinta} · {comp.escuela}</p>
          </div>
        </>
      ) : (
        <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
          Por definir
        </p>
      )}
    </div>

    {/* Puntos */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {puntos > 0 && (
        <span className="text-lg font-black leading-none"
          style={{ color: esGanador ? T.green : T.textMid }}>{puntos}</span>
      )}
      {esGanador && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Award size={14} style={{ color: T.green }} />
        </motion.div>
      )}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  MODAL REGISTRAR RESULTADO
// ─────────────────────────────────────────────────────────────
const ModalResultado: React.FC<{
  combate: Combate;
  T: Tema;
  onClose: () => void;
  onGuardado: (res: ResultadoCombateResponse) => void;
}> = ({ combate, T, onClose, onGuardado }) => {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuardar = async () => {
    if (p1 === p2) { setError('No puede haber empate. Ajusta los puntos.'); return; }
    if (p1 < 0 || p2 < 0) { setError('Los puntos no pueden ser negativos.'); return; }
    try {
      setLoading(true);
      const res = await torneoService.registrarResultado(combate.idcombate, p1, p2);
      onGuardado(res);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al registrar resultado');
    } finally {
      setLoading(false);
    }
  };

  const Counter: React.FC<{
    value: number; onChange: (v: number) => void; label: string; color: string;
  }> = ({ value, onChange, label, color }) => (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[8px] font-black uppercase tracking-widest truncate max-w-[100px] text-center"
        style={{ color: T.textDim }}>{label}</p>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        key={value}
        transition={{ duration: 0.15 }}
        className="text-5xl font-black tracking-tighter"
        style={{ color }}
      >{value}</motion.div>
      <div className="flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <Minus size={14} style={{ color: T.textMid }} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Plus size={14} style={{ color }} />
        </motion.button>
      </div>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center pb-[88px]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-lg flex flex-col"
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderBottom: 'none',
          borderRadius: '2rem',
          maxHeight: 'calc(92dvh - 88px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: T.border }} />
        </div>
        {/* Header fijo */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: T.orangeLo, border: `1px solid ${T.orange}40` }}>
              <Swords size={16} style={{ color: T.orange }} />
            </div>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                Registrar Resultado
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                {combate.nombre_ronda} · Combate #{combate.idcombate}
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <X size={14} style={{ color: T.textDim }} />
          </motion.button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Contadores */}
          <div className="rounded-[1.5rem] py-6 px-4"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-around">
              <Counter
                value={p1}
                onChange={setP1}
                label={combate.competidor_1?.nombre.split(' ')[0] || 'C1'}
                color={p1 > p2 ? T.green : T.cyan}
              />
              <div className="flex flex-col items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest"
                  style={{ color: T.textDim }}>VS</span>
                <AnimatePresence>
                  {p1 !== p2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="px-2 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider text-center"
                      style={{ background: T.greenLo, border: `1px solid ${T.green}40`, color: T.green, maxWidth: 72 }}>
                      {(p1 > p2 ? combate.competidor_1?.nombre : combate.competidor_2?.nombre)?.split(' ')[0]} gana
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Counter
                value={p2}
                onChange={setP2}
                label={combate.competidor_2?.nombre.split(' ')[0] || 'C2'}
                color={p2 > p1 ? T.green : T.orange}
              />
            </div>
          </div>

          {/* Info competidores */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { comp: combate.competidor_1, puntos: p1, esGanador: p1 > p2 },
              { comp: combate.competidor_2, puntos: p2, esGanador: p2 > p1 },
            ] as const).map((item, i) => item.comp && (
              <div key={i} className="rounded-2xl p-3"
                style={{
                  background: item.esGanador ? `${T.green}10` : T.surface,
                  border: `1px solid ${item.esGanador ? T.green + '40' : T.border}`,
                }}>
                <p className="text-[9px] font-black uppercase italic tracking-tighter truncate"
                  style={{ color: T.text }}>{item.comp.nombre}</p>
                <p className="text-[7px] font-bold mt-0.5 truncate" style={{ color: T.textDim }}>
                  {item.comp.cinta} · {item.comp.escuela}
                </p>
                {item.esGanador && (
                  <p className="text-[7px] font-black uppercase tracking-wider mt-1"
                    style={{ color: T.green }}>✓ Ganador</p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-black uppercase tracking-wider text-center py-2 px-4 rounded-xl"
              style={{ background: T.redLo, border: `1px solid ${T.red}30`, color: T.red }}>
              ⚠️ {error}
            </motion.p>
          )}
        </div>

        {/* Botones SIEMPRE visibles al fondo */}
        <div className="flex-shrink-0 px-6 py-4 flex gap-3"
          style={{ borderTop: `1px solid ${T.border}` }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid }}>
            Cancelar
          </motion.button>
          <motion.button
            whileTap={{ scale: p1 !== p2 ? 0.95 : 1 }}
            onClick={handleGuardar}
            disabled={loading || p1 === p2}
            className="flex-[2] h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            style={{
              background: p1 !== p2 ? `linear-gradient(135deg, ${T.green}, #059669)` : T.surface,
              color: p1 !== p2 ? '#fff' : T.textDim,
              border: p1 !== p2 ? 'none' : `1px solid ${T.border}`,
              opacity: loading ? 0.7 : 1,
              cursor: p1 === p2 ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⏳ Guardando...' : p1 === p2 ? 'Ajusta los puntos' : '✓ Confirmar Resultado'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TARJETA DE COMBATE
// ─────────────────────────────────────────────────────────────
const CombateCard: React.FC<{
  combate: Combate;
  T: Tema;
  canRegistrar: boolean;
  onRegistrar: (c: Combate) => void;
  delay?: number;
}> = ({ combate, T, canRegistrar, onRegistrar, delay = 0 }) => {
  const finalizado = combate.estatus === 'finalizado';
  const esBye      = combate.es_bye;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-[1.75rem] p-4 space-y-2"
      style={{
        background: finalizado
          ? `linear-gradient(135deg, ${T.green}08, ${T.card})`
          : esBye
          ? `linear-gradient(135deg, ${T.textDim}08, ${T.card})`
          : `linear-gradient(135deg, ${T.card}, ${T.surface})`,
        border: `1px solid ${
          finalizado ? T.green + '30' : esBye ? T.border : T.violet + '20'
        }`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {finalizado ? (
            <CheckCircle2 size={10} style={{ color: T.green }} />
          ) : esBye ? (
            <SkipForward size={10} style={{ color: T.textDim }} />
          ) : (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Circle size={10} style={{ color: T.orange }} />
            </motion.div>
          )}
          <span className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: finalizado ? T.green : esBye ? T.textDim : T.orange }}>
            {esBye ? 'BYE — Pasa directo' : finalizado ? 'Finalizado' : 'Pendiente'}
          </span>
        </div>
        <span className="text-[7px] font-black" style={{ color: T.textDim }}>
          #{combate.idcombate}
        </span>
      </div>

      {/* Competidores */}
      <CompetidorSlot
        comp={combate.competidor_1}
        puntos={combate.puntos_c1}
        esGanador={!!(combate.ganador && combate.ganador.idinscripcion === combate.competidor_1?.idinscripcion)}
        lado="izq"
        T={T}
      />

      {!esBye && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: T.border }} />
            <span className="text-[7px] font-black uppercase tracking-wider px-1"
              style={{ color: T.textDim }}>vs</span>
            <div className="flex-1 h-px" style={{ background: T.border }} />
          </div>

          <CompetidorSlot
            comp={combate.competidor_2}
            puntos={combate.puntos_c2}
            esGanador={!!(combate.ganador && combate.ganador.idinscripcion === combate.competidor_2?.idinscripcion)}
            lado="der"
            T={T}
          />
        </>
      )}

      {/* Botón registrar */}
      {canRegistrar && !finalizado && !esBye && combate.competidor_1 && combate.competidor_2 && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onRegistrar(combate)}
          className="w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest mt-1"
          style={{
            background: `linear-gradient(135deg, ${T.orange}20, ${T.yellow}15)`,
            border: `1px solid ${T.orange}40`,
            color: T.orange,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Zap size={11} />
            Registrar Resultado
          </span>
        </motion.button>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BRACKET VISUALIZER
// ─────────────────────────────────────────────────────────────
const BracketVisualizer: React.FC<{
  categoria: CategoriaLive;
  T: Tema;
  canRegistrar: boolean;
  onRegistrar: (c: Combate) => void;
}> = ({ categoria, T, canRegistrar, onRegistrar }) => {
  if (!categoria.rondas.length) return (
    <p className="text-center text-[10px] font-black uppercase tracking-wider py-12"
      style={{ color: T.textDim }}>Sin combates generados</p>
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-5 min-w-max items-start">
        {categoria.rondas.map((ronda, ri) => (
          <div key={ronda.ronda} className="flex flex-col gap-4" style={{ minWidth: 220 }}>

            {/* Header ronda */}
            <div className="text-center px-3 py-2 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: T.violetHi }}>{ronda.nombre_ronda}</p>
              <p className="text-[7px] font-black uppercase tracking-wider mt-0.5"
                style={{ color: T.textDim }}>
                {ronda.combates.filter(c => c.estatus === 'finalizado').length}/{ronda.combates.length} completados
              </p>
            </div>

            {/* Combates con espaciado visual entre rondas */}
            <div className="flex flex-col"
              style={{ gap: ri === 0 ? 12 : `${Math.pow(2, ri) * 12 + 60}px` }}>
              {ronda.combates.map((combate, ci) => (
                <CombateCard
                  key={combate.idcombate}
                  combate={combate}
                  T={T}
                  canRegistrar={canRegistrar}
                  onRegistrar={onRegistrar}
                  delay={ci * 0.05}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Campeón */}
        {categoria.campeon && (
          <div className="flex flex-col justify-center" style={{ minWidth: 180, paddingTop: 52 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="rounded-[2rem] p-5 text-center"
              style={{
                background: `linear-gradient(135deg, ${T.yellow}15, ${T.orange}10)`,
                border: `1px solid ${T.yellow}40`,
                boxShadow: `0 0 40px ${T.yellow}15`,
              }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Crown size={32} style={{ color: T.yellow, margin: '0 auto 10px' }} />
              </motion.div>
              <p className="text-[7px] font-black uppercase tracking-widest mb-2" style={{ color: T.yellow }}>
                🏆 Campeón
              </p>
              <p className="text-xs font-black uppercase italic tracking-tighter leading-tight"
                style={{ color: T.text }}>{categoria.campeon.nombre}</p>
              <p className="text-[8px] font-bold mt-1" style={{ color: T.textMid }}>
                {categoria.campeon.escuela}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: categoria.campeon.color_cinta || '#888' }} />
                <span className="text-[8px] font-bold" style={{ color: T.textDim }}>
                  {categoria.campeon.cinta}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA DETALLE TORNEO — brackets por categoría
// ─────────────────────────────────────────────────────────────
const DetalleCombates: React.FC<{
  torneo: Torneo;
  T: Tema;
  onVolver: () => void;
}> = ({ torneo, T, onVolver }) => {
  const [live, setLive]           = useState<BracketLive | null>(null);
  const [catActiva, setCatActiva] = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);
  const [combateModal, setCombateModal] = useState<Combate | null>(null);
  const [ultimoUpdate, setUltimoUpdate] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarLive = useCallback(async () => {
    try {
      const data = await torneoService.bracketLive(torneo.idtorneo);
      setLive(data);
      setUltimoUpdate(new Date().toLocaleTimeString('es-MX'));
      if (!catActiva && data.categorias.length > 0) {
        setCatActiva(data.categorias[0].idcategoria);
      }
    } catch {
      // silencioso — puede que no haya brackets aún
    } finally {
      setLoading(false);
    }
  }, [torneo.idtorneo, catActiva]);

  // Cargar al montar y polling cada 15 segundos
  useEffect(() => {
    cargarLive();
    intervalRef.current = setInterval(cargarLive, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cargarLive]);

  const categoriaActual = live?.categorias.find(c => c.idcategoria === catActiva) ?? null;

  const handleResultadoGuardado = (res: ResultadoCombateResponse) => {
    cargarLive();
    if (res.es_final && res.campeon) {
      // Pequeña animación se verá en el siguiente polling
    }
  };

  const estatusTorneo = ESTATUS_TORNEO[torneo.estatus] ?? { label: 'Desconocido', color: T.textDim };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <ChevronLeft size={16} style={{ color: T.textDim }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black uppercase italic tracking-tighter truncate"
            style={{ color: T.text }}>{torneo.nombre}</p>
          <p className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: T.textDim }}>{fmtFecha(torneo.fecha)} · {torneo.sede}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: T.greenLo, border: `1px solid ${T.green}30` }}>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: T.green }} />
            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.green }}>
              Live
            </span>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={cargarLive}
            className="w-9 h-9 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <RefreshCw size={13} style={{ color: T.textDim }} />
          </motion.button>
        </div>
      </div>

      {/* KPIs */}
      {live && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Categorías', value: live.total_categorias,                          color: T.violet, accentLo: T.violetLo, icon: Target    },
            { label: 'Finalizados', value: live.categorias.reduce((a,c)=>a+c.finalizados,0), color: T.green,  accentLo: T.greenLo,  icon: CheckCircle2 },
            { label: 'Pendientes', value: live.categorias.reduce((a,c)=>a+c.pendientes,0),  color: T.orange, accentLo: T.orangeLo, icon: Clock     },
            { label: 'Campeones',  value: live.categorias.filter(c=>c.campeon).length,      color: T.yellow, accentLo: T.yellowLo, icon: Crown     },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-[1.5rem] p-3"
              style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-2"
                style={{ background: item.accentLo, border: `1px solid ${item.color}30` }}>
                <item.icon size={13} style={{ color: item.color }} />
              </div>
              <p className="text-xl font-black tracking-tighter leading-none" style={{ color: T.text }}>
                {item.value}
              </p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-1" style={{ color: T.textDim }}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selector de categorías */}
      {live && live.categorias.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[2rem] p-5"
          style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}
        >
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {live.categorias.map(cat => {
              const isActive = catActiva === cat.idcategoria;
              const allDone  = cat.pendientes === 0 && cat.finalizados > 0;
              return (
                <motion.button key={cat.idcategoria} whileTap={{ scale: 0.93 }}
                  onClick={() => setCatActiva(cat.idcategoria)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider"
                  style={{
                    background: isActive ? T.violetLo : T.surface,
                    border: `1px solid ${isActive ? T.violet + '60' : T.border}`,
                    color: isActive ? T.violetHi : T.textMid,
                  }}>
                  {cat.nombre}
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: allDone ? T.green : cat.campeon ? T.yellow : T.orange }} />
                </motion.button>
              );
            })}
          </div>

          {/* Progreso de la categoría activa */}
          {categoriaActual && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xl font-black tracking-tighter" style={{ color: T.green }}>
                      {categoriaActual.finalizados}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                      Done
                    </p>
                  </div>
                  <div className="w-px h-8" style={{ background: T.border }} />
                  <div className="text-center">
                    <p className="text-xl font-black tracking-tighter" style={{ color: T.orange }}>
                      {categoriaActual.pendientes}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                      Pend.
                    </p>
                  </div>
                  {categoriaActual.campeon && (
                    <>
                      <div className="w-px h-8" style={{ background: T.border }} />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                        style={{ background: T.yellowLo, border: `1px solid ${T.yellow}30` }}>
                        <Crown size={10} style={{ color: T.yellow }} />
                        <span className="text-[8px] font-black uppercase tracking-wider"
                          style={{ color: T.yellow }}>
                          {categoriaActual.campeon.nombre.split(' ')[0]}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {ultimoUpdate && (
                  <span className="text-[7px] font-bold" style={{ color: T.textDim }}>
                    ↻ {ultimoUpdate}
                  </span>
                )}
              </div>

              {/* Barra de progreso */}
              {categoriaActual.finalizados + categoriaActual.pendientes > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden mb-5"
                  style={{ background: T.border }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${T.green}, ${T.cyan})` }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(categoriaActual.finalizados / (categoriaActual.finalizados + categoriaActual.pendientes)) * 100}%`
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              )}

              {/* Bracket */}
              <BracketVisualizer
                categoria={categoriaActual}
                T={T}
                canRegistrar={torneo.estatus === 2}
                onRegistrar={setCombateModal}
              />
            </>
          )}
        </motion.div>
      )}

      {/* Estado vacío */}
      {!loading && (!live || live.categorias.length === 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center"
            style={{ background: T.violetLo, border: `1px solid ${T.violet}40` }}>
            <Swords size={28} style={{ color: T.violetHi }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center"
            style={{ color: T.textDim }}>
            Sin brackets generados.<br />Cierra el check-in desde la vista de Torneos.
          </p>
        </motion.div>
      )}

      {/* Modal resultado */}
      <AnimatePresence>
        {combateModal && (
          <ModalResultado
            combate={combateModal}
            T={T}
            onClose={() => setCombateModal(null)}
            onGuardado={handleResultadoGuardado}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TARJETA TORNEO (lista)
// ─────────────────────────────────────────────────────────────
const TorneoCardCombates: React.FC<{
  torneo: Torneo; T: Tema; delay?: number;
  onVer: (t: Torneo) => void;
}> = ({ torneo, T, delay = 0, onVer }) => {
  const estatus = ESTATUS_TORNEO[torneo.estatus] ?? { label: '?', color: T.textDim };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onVer(torneo)}
      className="rounded-[2rem] p-5 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
        border: `1px solid ${torneo.estatus === 2 ? T.orange + '40' : T.border}`,
        boxShadow: torneo.estatus === 2 ? `0 0 20px ${T.orange}10` : 'none',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: torneo.estatus === 2 ? T.orangeLo : T.violetLo,
            border: `1px solid ${torneo.estatus === 2 ? T.orange + '40' : T.violet + '30'}`,
          }}>
          {torneo.estatus === 2
            ? <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Swords size={20} style={{ color: T.orange }} />
              </motion.div>
            : <Trophy size={20} style={{ color: T.violetHi }} />
          }
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
          style={{ background: `${estatus.color}18`, border: `1px solid ${estatus.color}30` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: estatus.color }} />
          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: estatus.color }}>
            {estatus.label}
          </span>
        </div>
      </div>

      <p className="text-sm font-black uppercase italic tracking-tighter leading-tight mb-1"
        style={{ color: T.text }}>{torneo.nombre}</p>
      <p className="text-[8px] font-black uppercase tracking-widest mb-4"
        style={{ color: T.textDim }}>ID #{torneo.idtorneo}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Calendar size={9} style={{ color: T.cyan }} />
          <span className="text-[9px] font-bold" style={{ color: T.textMid }}>
            {fmtFecha(torneo.fecha)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={9} style={{ color: T.orange }} />
          <span className="text-[9px] font-bold truncate max-w-[120px]" style={{ color: T.textMid }}>
            {torneo.sede}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end mt-3 pt-3"
        style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-1" style={{ color: T.violetHi }}>
          <span className="text-[9px] font-black uppercase tracking-wider">Ver Brackets</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const CombatesView: React.FC<{ T: Tema; onAbrirQR?: (id: number) => void }> = ({ T, onAbrirQR }) => {
  const [torneos, setTorneos]           = useState<Torneo[]>([]);
  const [loading, setLoading]           = useState(true);
  const [torneoDetalle, setTorneoDetalle] = useState<Torneo | null>(null);
  const [filtro, setFiltro]             = useState<'todos' | 'activos' | 'en_curso'>('en_curso');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await torneoService.listar();
      setTorneos(data);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const torneosFiltrados = torneos.filter(t =>
    filtro === 'todos'    ? true :
    filtro === 'activos'  ? t.estatus === 1 :
    filtro === 'en_curso' ? t.estatus === 2 : true
  );

  // Vista detalle
  if (torneoDetalle) {
    return (
      <DetalleCombates
        torneo={torneoDetalle}
        T={T}
        onVolver={() => setTorneoDetalle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-lg font-black uppercase italic tracking-tighter leading-none"
            style={{ color: T.text }}>Combates</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1"
            style={{ color: T.textDim }}>
            Brackets en tiempo real
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
          className="w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <RefreshCw size={14} style={{ color: T.textDim }} />
        </motion.button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {([
          { id: 'en_curso', label: 'En Curso' },
          { id: 'activos',  label: 'Próximos' },
          { id: 'todos',    label: 'Todos'    },
        ] as const).map(f => (
          <motion.button key={f.id} whileTap={{ scale: 0.92 }} onClick={() => setFiltro(f.id)}
            className="h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: filtro === f.id ? T.orangeLo : T.surface,
              border: `1px solid ${filtro === f.id ? T.orange + '60' : T.border}`,
              color: filtro === f.id ? T.orange : T.textMid,
            }}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full"
            style={{ border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}` }} />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse"
            style={{ color: T.textDim }}>Cargando torneos...</p>
        </div>
      ) : torneosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center"
            style={{ background: T.orangeLo, border: `1px solid ${T.orange}40` }}>
            <Swords size={28} style={{ color: T.orange }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center"
            style={{ color: T.textDim }}>
            {filtro === 'en_curso'
              ? 'Sin torneos en curso.\nCierra el check-in desde Torneos para activarlos.'
              : 'Sin torneos en este filtro'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneosFiltrados.map((t, i) => (
            <TorneoCardCombates key={t.idtorneo} torneo={t} T={T} delay={i * 0.08}
              onVer={setTorneoDetalle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CombatesView;