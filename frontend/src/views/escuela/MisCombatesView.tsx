// ============================================================
//  src/views/escuela/MisCombatesView.tsx
//  Vista de combates filtrada por escuela — solo lectura
//  Muestra torneos en los que participan alumnos de la escuela
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Crown, Award, RefreshCw, ChevronRight,
  Clock, CheckCircle2, Circle, Shield, Target,
  SkipForward, Calendar, ChevronLeft, Users, Zap,
} from 'lucide-react';

// @ts-ignore
import { torneoService } from '../../services/torneo.service';
// @ts-ignore
import { escuelaService } from '../../services/escuela.service';
import type {
  Torneo, BracketLive, CategoriaLive, RondaBracket,
  Combate, Competidor,
} from '../../types/torneo.types';

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

// Determina si un combate involucra a la escuela
function combateInvolucraEscuela(combate: Combate, nombreEscuela: string): boolean {
  const norm = (s: string) => s.toLowerCase().trim();
  const escN = norm(nombreEscuela);
  return (
    norm(combate.competidor_1?.escuela ?? '').includes(escN) ||
    norm(combate.competidor_2?.escuela ?? '').includes(escN)
  );
}

// Filtra las categorías dejando solo las que tienen al menos un combate de la escuela
function filtrarCategoriasEscuela(categorias: CategoriaLive[], nombreEscuela: string): CategoriaLive[] {
  return categorias
    .map(cat => {
      const rondasFiltradas = cat.rondas.map(ronda => ({
        ...ronda,
        combates: ronda.combates.filter(c => combateInvolucraEscuela(c, nombreEscuela)),
      })).filter(r => r.combates.length > 0);

      return rondasFiltradas.length > 0 ? { ...cat, rondas: rondasFiltradas } : null;
    })
    .filter(Boolean) as CategoriaLive[];
}

// ─────────────────────────────────────────────────────────────
//  COMPETIDOR SLOT (solo lectura, sin acciones)
// ─────────────────────────────────────────────────────────────
const CompetidorSlot: React.FC<{
  comp:       Competidor | null | undefined;
  puntos:     number;
  esGanador:  boolean;
  esPropia:   boolean; // si es de nuestra escuela
}> = ({ comp, puntos, esGanador, esPropia }) => (
  <motion.div
    animate={{
      backgroundColor: esGanador
        ? '#22c55e15'
        : esPropia
        ? 'var(--color-primary)10'
        : 'var(--color-card)',
    }}
    className="flex items-center gap-2.5 p-2.5 rounded-2xl"
    style={{
      border: `1px solid ${
        esGanador
          ? '#22c55e50'
          : esPropia
          ? 'var(--color-primary)40'
          : 'var(--color-border)'
      }`,
    }}
  >
    {/* Avatar */}
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
      style={{
        background: esPropia
          ? 'var(--color-primary)25'
          : comp
          ? 'var(--color-background)'
          : 'var(--color-border)',
        color: esPropia ? 'var(--color-primary)' : 'var(--color-text-muted)',
        border: `1px solid ${esPropia ? 'var(--color-primary)30' : 'var(--color-border)'}`,
      }}
    >
      {comp ? comp.nombre.charAt(0).toUpperCase() : '?'}
    </div>

    <div className="flex-1 min-w-0">
      {comp ? (
        <>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-black uppercase italic tracking-tighter truncate leading-none text-[var(--color-text)]">
              {comp.nombre}
            </p>
            {esPropia && (
              <span
                className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}
              >
                Nosotros
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: comp.color_cinta || '#888' }} />
            <p className="text-[8px] font-bold truncate leading-none text-[var(--color-text-muted)]">
              {comp.cinta} · {comp.escuela}
            </p>
          </div>
        </>
      ) : (
        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
          Por definir
        </p>
      )}
    </div>

    {/* Puntos */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {puntos > 0 && (
        <span className="text-lg font-black leading-none"
          style={{ color: esGanador ? '#22c55e' : 'var(--color-text-muted)' }}>
          {puntos}
        </span>
      )}
      {esGanador && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Award size={14} style={{ color: '#22c55e' }} />
        </motion.div>
      )}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  TARJETA DE COMBATE (solo lectura)
// ─────────────────────────────────────────────────────────────
const CombateCard: React.FC<{
  combate:       Combate;
  nombreEscuela: string;
  delay?:        number;
}> = ({ combate, nombreEscuela, delay = 0 }) => {
  const finalizado = combate.estatus === 'finalizado';
  const esBye      = combate.es_bye;
  const norm       = (s: string) => s.toLowerCase().trim();
  const escN       = norm(nombreEscuela);

  const c1EsPropia = norm(combate.competidor_1?.escuela ?? '').includes(escN);
  const c2EsPropia = norm(combate.competidor_2?.escuela ?? '').includes(escN);

  const ganador1 = !!(combate.ganador &&
    combate.ganador.idinscripcion === combate.competidor_1?.idinscripcion);
  const ganador2 = !!(combate.ganador &&
    combate.ganador.idinscripcion === combate.competidor_2?.idinscripcion);

  const escuelaGano = (ganador1 && c1EsPropia) || (ganador2 && c2EsPropia);
  const escuelaPerdio = finalizado && !escuelaGano && (c1EsPropia || c2EsPropia);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-[1.75rem] p-4 space-y-2"
      style={{
        background: finalizado
          ? escuelaGano
            ? 'linear-gradient(135deg, #22c55e08, var(--color-card))'
            : escuelaPerdio
            ? 'linear-gradient(135deg, #ef444408, var(--color-card))'
            : 'linear-gradient(135deg, #94a3b808, var(--color-card))'
          : esBye
          ? 'linear-gradient(135deg, var(--color-background), var(--color-card))'
          : 'linear-gradient(135deg, var(--color-card), var(--color-background))',
        border: `1px solid ${
          finalizado
            ? escuelaGano
              ? '#22c55e30'
              : escuelaPerdio
              ? '#ef444425'
              : 'var(--color-border)'
            : esBye
            ? 'var(--color-border)'
            : 'var(--color-primary)20'
        }`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {finalizado ? (
            escuelaGano ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Trophy size={10} style={{ color: '#22c55e' }} />
              </motion.div>
            ) : (
              <CheckCircle2 size={10} style={{ color: '#94a3b8' }} />
            )
          ) : esBye ? (
            <SkipForward size={10} style={{ color: 'var(--color-text-muted)' }} />
          ) : (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}>
              <Circle size={10} style={{ color: '#f97316' }} />
            </motion.div>
          )}
          <span className="text-[8px] font-black uppercase tracking-widest"
            style={{
              color: finalizado
                ? escuelaGano ? '#22c55e' : '#94a3b8'
                : esBye ? 'var(--color-text-muted)' : '#f97316',
            }}>
            {esBye
              ? 'BYE'
              : finalizado
              ? escuelaGano
                ? '🏆 Victoria'
                : escuelaPerdio
                ? 'Derrota'
                : 'Finalizado'
              : 'En Curso'}
          </span>
        </div>
        <span className="text-[7px] font-black text-[var(--color-text-muted)]">
          #{combate.idcombate}
        </span>
      </div>

      {/* Competidores */}
      <CompetidorSlot
        comp={combate.competidor_1}
        puntos={combate.puntos_c1}
        esGanador={ganador1}
        esPropia={c1EsPropia}
      />

      {!esBye && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-[7px] font-black uppercase tracking-wider px-1 text-[var(--color-text-muted)]">vs</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>
          <CompetidorSlot
            comp={combate.competidor_2}
            puntos={combate.puntos_c2}
            esGanador={ganador2}
            esPropia={c2EsPropia}
          />
        </>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BRACKET VISUALIZER (solo lectura)
// ─────────────────────────────────────────────────────────────
const BracketVisualizer: React.FC<{
  categoria:     CategoriaLive;
  nombreEscuela: string;
}> = ({ categoria, nombreEscuela }) => {
  if (!categoria.rondas.length) return (
    <p className="text-center text-[10px] font-black uppercase tracking-wider py-12 text-[var(--color-text-muted)]">
      Sin combates generados
    </p>
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-5 min-w-max items-start">
        {categoria.rondas.map((ronda, ri) => (
          <div key={ronda.ronda} className="flex flex-col gap-4" style={{ minWidth: 220 }}>

            {/* Header ronda */}
            <div className="text-center px-3 py-2 rounded-2xl"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)]">
                {ronda.nombre_ronda}
              </p>
              <p className="text-[7px] font-black uppercase tracking-wider mt-0.5 text-[var(--color-text-muted)]">
                {ronda.combates.filter(c => c.estatus === 'finalizado').length}/{ronda.combates.length} completados
              </p>
            </div>

            {/* Combates */}
            <div className="flex flex-col"
              style={{ gap: ri === 0 ? 12 : `${Math.pow(2, ri) * 12 + 60}px` }}>
              {ronda.combates.map((combate, ci) => (
                <CombateCard
                  key={combate.idcombate}
                  combate={combate}
                  nombreEscuela={nombreEscuela}
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
                background: 'linear-gradient(135deg, #fbbf2415, #f9731610)',
                border: '1px solid #fbbf2440',
                boxShadow: '0 0 40px #fbbf2415',
              }}
            >
              <motion.div
                animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Crown size={32} style={{ color: '#fbbf24', margin: '0 auto 10px' }} />
              </motion.div>
              <p className="text-[7px] font-black uppercase tracking-widest mb-2 text-[#fbbf24]">
                🏆 Campeón
              </p>
              <p className="text-xs font-black uppercase italic tracking-tighter leading-tight text-[var(--color-text)]">
                {categoria.campeon.nombre}
              </p>
              <p className="text-[8px] font-bold mt-1 text-[var(--color-text-muted)]">
                {categoria.campeon.escuela}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full"
                  style={{ background: categoria.campeon.color_cinta || '#888' }} />
                <span className="text-[8px] font-bold text-[var(--color-text-muted)]">
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
//  VISTA DETALLE TORNEO
// ─────────────────────────────────────────────────────────────
const DetalleMisCombates: React.FC<{
  torneo:        Torneo;
  nombreEscuela: string;
  onVolver:      () => void;
}> = ({ torneo, nombreEscuela, onVolver }) => {
  const [live, setLive]               = useState<BracketLive | null>(null);
  const [catActiva, setCatActiva]     = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [ultimoUpdate, setUltimoUpdate] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarLive = useCallback(async () => {
    try {
      const data = await torneoService.bracketLive(torneo.idtorneo);
      // Filtrar solo categorías con combates de nuestra escuela
      const categoriasFiltradas = filtrarCategoriasEscuela(data.categorias, nombreEscuela);
      const dataFiltrada = { ...data, categorias: categoriasFiltradas };
      setLive(dataFiltrada);
      setUltimoUpdate(new Date().toLocaleTimeString('es-MX'));
      if (!catActiva && categoriasFiltradas.length > 0) {
        setCatActiva(categoriasFiltradas[0].idcategoria);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [torneo.idtorneo, nombreEscuela, catActiva]);

  useEffect(() => {
    cargarLive();
    intervalRef.current = setInterval(cargarLive, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cargarLive]);

  const categoriaActual = live?.categorias.find(c => c.idcategoria === catActiva) ?? null;
  const estatusTorneo   = ESTATUS_TORNEO[torneo.estatus] ?? { label: '?', color: 'var(--color-text-muted)' };

  // KPIs de nuestra escuela en este torneo
  const combatesTotales = live?.categorias.flatMap(c => c.rondas.flatMap(r => r.combates)) ?? [];
  const victorias  = combatesTotales.filter(c => {
    const norm = (s: string) => s.toLowerCase();
    const escN = norm(nombreEscuela);
    const g1   = c.ganador?.idinscripcion === c.competidor_1?.idinscripcion;
    const g2   = c.ganador?.idinscripcion === c.competidor_2?.idinscripcion;
    return (g1 && norm(c.competidor_1?.escuela ?? '').includes(escN)) ||
           (g2 && norm(c.competidor_2?.escuela ?? '').includes(escN));
  }).length;
  const pendientes = combatesTotales.filter(c => c.estatus !== 'finalizado' && !c.es_bye).length;
  const campeones  = live?.categorias.filter(c => {
    const norm = (s: string) => s.toLowerCase();
    return norm(c.campeon?.escuela ?? '').includes(norm(nombreEscuela));
  }).length ?? 0;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0 bg-[var(--color-card)] border border-[var(--color-border)]">
          <ChevronLeft size={16} className="text-[var(--color-text-muted)]" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black uppercase italic tracking-tighter truncate text-[var(--color-text)]">
            {torneo.nombre}
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
            {fmtFecha(torneo.fecha)} · {torneo.sede}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          {torneo.estatus === 2 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: '#22c55e15', border: '1px solid #22c55e30' }}>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[7px] font-black uppercase tracking-widest text-[#22c55e]">
                Live
              </span>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.88 }} onClick={cargarLive}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
            <RefreshCw size={13} className="text-[var(--color-text-muted)]" />
          </motion.button>
        </div>
      </div>

      {/* KPIs de la escuela */}
      {live && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Victorias',   value: victorias,                         color: '#22c55e', bg: '#22c55e15', icon: Trophy        },
            { label: 'Pendientes',  value: pendientes,                        color: '#f97316', bg: '#f9731615', icon: Clock         },
            { label: 'Campeones',   value: campeones,                         color: '#fbbf24', bg: '#fbbf2415', icon: Crown         },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-[1.5rem] p-3"
              style={{ background: item.bg, border: `1px solid ${item.color}30` }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `${item.color}20`, border: `1px solid ${item.color}30` }}>
                <item.icon size={13} style={{ color: item.color }} />
              </div>
              <p className="text-xl font-black tracking-tighter leading-none text-[var(--color-text)]">
                {item.value}
              </p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-1 text-[var(--color-text-muted)]">
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
          className="rounded-[2rem] p-5 bg-[var(--color-card)] border border-[var(--color-border)]"
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
                    background: isActive ? 'var(--color-primary)15' : 'var(--color-background)',
                    border: `1px solid ${isActive ? 'var(--color-primary)60' : 'var(--color-border)'}`,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                  {cat.nombre}
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: allDone ? '#22c55e' : cat.campeon ? '#fbbf24' : '#f97316' }} />
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
                    <p className="text-xl font-black tracking-tighter text-[#22c55e]">
                      {categoriaActual.finalizados}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Done</p>
                  </div>
                  <div className="w-px h-8 bg-[var(--color-border)]" />
                  <div className="text-center">
                    <p className="text-xl font-black tracking-tighter text-[#f97316]">
                      {categoriaActual.pendientes}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Pend.</p>
                  </div>
                  {categoriaActual.campeon && (
                    <>
                      <div className="w-px h-8 bg-[var(--color-border)]" />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                        style={{ background: '#fbbf2415', border: '1px solid #fbbf2430' }}>
                        <Crown size={10} style={{ color: '#fbbf24' }} />
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#fbbf24]">
                          {categoriaActual.campeon.nombre.split(' ')[0]}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {ultimoUpdate && (
                  <span className="text-[7px] font-bold text-[var(--color-text-muted)]">
                    ↻ {ultimoUpdate}
                  </span>
                )}
              </div>

              {/* Barra de progreso */}
              {categoriaActual.finalizados + categoriaActual.pendientes > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden mb-5 bg-[var(--color-border)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #22c55e, #06b6d4)' }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(categoriaActual.finalizados / (categoriaActual.finalizados + categoriaActual.pendientes)) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              )}

              <BracketVisualizer
                categoria={categoriaActual}
                nombreEscuela={nombreEscuela}
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
            style={{ background: 'var(--color-primary)15', border: '1px solid var(--color-primary)30' }}>
            <Swords size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-[var(--color-text-muted)]">
            No hay combates de tu escuela<br />en este torneo aún.
          </p>
        </motion.div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full"
            style={{ border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-primary)' }} />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse text-[var(--color-text-muted)]">
            Cargando brackets...
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TARJETA TORNEO
// ─────────────────────────────────────────────────────────────
const TorneoCard: React.FC<{
  torneo:  Torneo;
  delay?:  number;
  onVer:   (t: Torneo) => void;
}> = ({ torneo, delay = 0, onVer }) => {
  const estatus = ESTATUS_TORNEO[torneo.estatus] ?? { label: '?', color: 'var(--color-text-muted)' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onVer(torneo)}
      className="rounded-[2rem] p-5 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, var(--color-card), var(--color-background))`,
        border: `1px solid ${torneo.estatus === 2 ? '#f9731640' : 'var(--color-border)'}`,
        boxShadow: torneo.estatus === 2 ? '0 0 20px #f9731610' : 'none',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: torneo.estatus === 2 ? '#f9731620' : 'var(--color-primary)15',
            border: `1px solid ${torneo.estatus === 2 ? '#f9731640' : 'var(--color-primary)30'}`,
          }}>
          {torneo.estatus === 2
            ? <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Swords size={20} style={{ color: '#f97316' }} />
              </motion.div>
            : <Trophy size={20} style={{ color: 'var(--color-primary)' }} />
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

      <p className="text-sm font-black uppercase italic tracking-tighter leading-tight mb-1 text-[var(--color-text)]">
        {torneo.nombre}
      </p>
      <p className="text-[8px] font-black uppercase tracking-widest mb-4 text-[var(--color-text-muted)]">
        ID #{torneo.idtorneo}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Calendar size={9} style={{ color: '#06b6d4' }} />
          <span className="text-[9px] font-bold text-[var(--color-text-muted)]">
            {fmtFecha(torneo.fecha)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={9} style={{ color: '#f97316' }} />
          <span className="text-[9px] font-bold truncate max-w-[120px] text-[var(--color-text-muted)]">
            {torneo.sede}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end mt-3 pt-3"
        style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
          <span className="text-[9px] font-black uppercase tracking-wider">Ver Mis Combates</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const MisCombatesView: React.FC = () => {
  const [torneos, setTorneos]               = useState<Torneo[]>([]);
  const [loading, setLoading]               = useState(true);
  const [torneoDetalle, setTorneoDetalle]   = useState<Torneo | null>(null);
  const [filtro, setFiltro]                 = useState<'todos' | 'activos' | 'en_curso'>('en_curso');
  const [nombreEscuela, setNombreEscuela]   = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [data, escuela] = await Promise.all([
        torneoService.listar(),
        escuelaService.getMiEscuela(),
      ]);
      setTorneos(data);
      setNombreEscuela(escuela?.nombreescuela ?? '');
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
      <DetalleMisCombates
        torneo={torneoDetalle}
        nombreEscuela={nombreEscuela}
        onVolver={() => setTorneoDetalle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-lg font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">
            Mis Combates
          </p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1 text-[var(--color-text-muted)]">
            {nombreEscuela
              ? `Brackets de ${nombreEscuela}`
              : 'Torneos de tu academia'}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
          <RefreshCw size={14} className="text-[var(--color-text-muted)]" />
        </motion.button>
      </div>

      {/* Badge escuela */}
      {nombreEscuela && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--color-primary)10', border: '1px solid var(--color-primary)25' }}
        >
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-primary)20' }}>
            <Shield size={13} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="text-[7px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
              Filtrando por escuela
            </p>
            <p className="text-[10px] font-black uppercase italic tracking-tight text-[var(--color-primary)]">
              {nombreEscuela}
            </p>
          </div>
        </motion.div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {([
          { id: 'en_curso', label: 'En Curso'  },
          { id: 'activos',  label: 'Próximos'  },
          { id: 'todos',    label: 'Todos'     },
        ] as const).map(f => (
          <motion.button key={f.id} whileTap={{ scale: 0.92 }} onClick={() => setFiltro(f.id)}
            className="h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: filtro === f.id ? 'var(--color-primary)15' : 'var(--color-card)',
              border: `1px solid ${filtro === f.id ? 'var(--color-primary)60' : 'var(--color-border)'}`,
              color: filtro === f.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
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
            style={{ border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-primary)' }} />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse text-[var(--color-text-muted)]">
            Cargando torneos...
          </p>
        </div>
      ) : torneosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center"
            style={{ background: 'var(--color-primary)15', border: '1px solid var(--color-primary)40' }}>
            <Swords size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-[var(--color-text-muted)]">
            {filtro === 'en_curso'
              ? 'Sin torneos en curso actualmente.'
              : 'Sin torneos en este filtro'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneosFiltrados.map((t, i) => (
            <TorneoCard key={t.idtorneo} torneo={t} delay={i * 0.08} onVer={setTorneoDetalle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MisCombatesView;