// ============================================================
//  src/views/superadmin/AreasMatchmakingView.tsx
//  SuperAdmin gestiona áreas/rings, asigna jueces,
//  edita matchmaking antes de confirmar, y ve podio local
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Edit3, Trash2, X, Check, ChevronLeft,
  Users, AlertTriangle, RefreshCw, Swords, Crown,
  ArrowLeftRight, Loader2, MapPin, Trophy, AlertCircle,
  ChevronRight, User, Scale, Star,
} from 'lucide-react';

import {
  torneoAreasService,
  type AreaCombate,
  type MatchmakingPreview,
} from '../../services/torneo_areas.service';

// ─────────────────────────────────────────────────────────────
//  TEMA
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
//  MODAL: CREAR / EDITAR ÁREA
// ─────────────────────────────────────────────────────────────
const ModalArea: React.FC<{
  idtorneo:  number;
  area?:     AreaCombate | null;
  onClose:   () => void;
  onGuardar: () => void;
  T:         Tema;
}> = ({ idtorneo, area, onClose, onGuardar, T }) => {
  const [nombre,    setNombre]    = useState(area?.nombre_area ?? '');
  const [idJuez,    setIdJuez]    = useState<string>(area?.idjuez_asignado?.toString() ?? '');
  const [estatus,   setEstatus]   = useState(area?.estatus ?? 'disponible');
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState('');

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre del área es obligatorio'); return; }
    setCargando(true);
    setError('');
    try {
      const juez = idJuez ? parseInt(idJuez) : undefined;
      if (area) {
        await torneoAreasService.editarArea(idtorneo, area.idarea, {
          nombre_area: nombre,
          idjuez_asignado: juez ?? null,
          estatus: estatus as any,
        });
      } else {
        await torneoAreasService.crearArea(idtorneo, { nombre_area: nombre, idjuez_asignado: juez ?? null });
      }
      onGuardar();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Error al guardar el área');
    } finally {
      setCargando(false);
    }
  };

  return createPortal(
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-sm rounded-[2rem] overflow-hidden"
        style={{ background: T.card, border: `1px solid ${T.border}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: `${T.violet}15`, border: `1px solid ${T.violetHi}30` }}>
              <Shield size={16} style={{ color: T.violetHi }} />
            </div>
            <p className="text-sm font-black uppercase italic tracking-tighter"
              style={{ color: T.text }}>
              {area ? 'Editar Área' : 'Nueva Área'}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <X size={13} style={{ color: T.textDim }} />
          </motion.button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: T.textDim }}>
              Nombre del área *
            </label>
            <input type="text" value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Área 1, Ring A..."
              className="w-full h-11 px-4 rounded-2xl text-sm font-bold outline-none"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
              }} />
          </div>

          {/* ID Juez */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: T.textDim }}>
              ID del Juez asignado
            </label>
            <input type="number" value={idJuez}
              onChange={e => setIdJuez(e.target.value)}
              placeholder="idusuario del juez"
              className="w-full h-11 px-4 rounded-2xl text-sm font-bold outline-none"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
              }} />
            <p className="text-[8px] font-bold" style={{ color: T.textDim }}>
              Debe tener rol Juez o SuperAdmin
            </p>
          </div>

          {/* Estatus (solo al editar) */}
          {area && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: T.textDim }}>
                Estatus
              </label>
              <div className="flex gap-2">
                {(['disponible', 'en_combate', 'inactiva'] as const).map(s => (
                  <motion.button key={s} whileTap={{ scale: 0.93 }}
                    onClick={() => setEstatus(s)}
                    className="flex-1 h-9 rounded-xl text-[8px] font-black uppercase tracking-wider"
                    style={{
                      background: estatus === s ? `${T.violet}15` : T.surface,
                      border: `1px solid ${estatus === s ? `${T.violet}50` : T.border}`,
                      color: estatus === s ? T.violetHi : T.textDim,
                    }}>
                    {s === 'disponible' ? '✓' : s === 'en_combate' ? '⚔️' : '—'}&nbsp;{s.replace('_', ' ')}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl"
              style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
              <AlertCircle size={12} color="#ef4444" />
              <span className="text-[9px] font-bold" style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
              className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-wider"
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
              Cancelar
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleGuardar}
              disabled={cargando}
              className="flex-[2] h-11 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
              style={{ background: T.violetHi, color: '#fff', opacity: cargando ? 0.7 : 1 }}>
              {cargando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {area ? 'Guardar Cambios' : 'Crear Área'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────
//  CARD DE ÁREA
// ─────────────────────────────────────────────────────────────
const AreaCard: React.FC<{
  area:       AreaCombate;
  idtorneo:   number;
  onEditar:   (a: AreaCombate) => void;
  onEliminar: (a: AreaCombate) => void;
  T:          Tema;
}> = ({ area, idtorneo, onEditar, onEliminar, T }) => {
  const ESTATUS_COLOR: Record<string, string> = {
    disponible: '#10b981',
    en_combate: '#f97316',
    inactiva:   '#94a3b8',
  };
  const color = ESTATUS_COLOR[area.estatus] ?? '#888';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] p-4 flex items-center gap-4"
      style={{ background: T.card, border: `1px solid ${T.border}` }}>

      {/* Ícono */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Shield size={20} style={{ color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[12px] font-black uppercase italic tracking-tighter"
            style={{ color: T.text }}>
            {area.nombre_area}
          </p>
          <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg"
            style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
            {area.estatus.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {area.juez_username ? (
            <div className="flex items-center gap-1">
              <User size={9} style={{ color: T.violetHi }} />
              <span className="text-[8px] font-bold" style={{ color: T.textDim }}>
                Juez: <strong style={{ color: T.violetHi }}>{area.juez_username}</strong>
              </span>
            </div>
          ) : (
            <span className="text-[8px] font-bold" style={{ color: '#f97316' }}>
              Sin juez asignado
            </span>
          )}
          {area.combates_pendientes > 0 && (
            <span className="text-[8px] font-bold" style={{ color: '#f97316' }}>
              {area.combates_pendientes} combate{area.combates_pendientes !== 1 ? 's' : ''} pendiente{area.combates_pendientes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => onEditar(area)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <Edit3 size={13} style={{ color: T.textDim }} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => onEliminar(area)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: '#ef444412', border: '1px solid #ef444425' }}>
          <Trash2 size={13} color="#ef4444" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MATCHMAKING PREVIEW + REASIGNACIÓN
// ─────────────────────────────────────────────────────────────
const MatchmakingPanel: React.FC<{ idtorneo: number; T: Tema }> = ({ idtorneo, T }) => {
  const [preview,    setPreview]    = useState<MatchmakingPreview | null>(null);
  const [cargando,   setCargando]   = useState(false);
  const [modoSwap,   setModoSwap]   = useState(false);
  const [swapA,      setSwapA]      = useState<number | null>(null);
  const [swapBusy,   setSwapBusy]   = useState(false);
  const [mensaje,    setMensaje]    = useState('');
  const [catActiva,  setCatActiva]  = useState<number | null>(null);

  const cargar = useCallback(async (autoConfirmar = false) => {
    setCargando(true);
    try {
      // Si se pide auto-confirmar (primera carga), guardar combates en BD primero
      if (autoConfirmar) {
        try { await torneoAreasService.confirmarMatchmaking(idtorneo); } catch { /* ya hay combates */ }
      }
      const data = await torneoAreasService.matchmakingPreview(idtorneo);
      setPreview(data);
      setCatActiva(prev => prev ?? (data.categorias.length > 0 ? data.categorias[0].idcategoria : null));
    } catch {
      /* silencioso */
    } finally {
      setCargando(false);
    }
  }, [idtorneo]);

  const cargarRef = useRef(cargar);
  useEffect(() => { cargarRef.current = cargar; }, [cargar]);

  // Primera carga: auto-confirmar para guardar combates en BD
  useEffect(() => { cargarRef.current(true); }, []);

  const handleSwap = async (idinscripcion: number) => {
    if (!modoSwap) return;
    if (!swapA) {
      setSwapA(idinscripcion);
      setMensaje('Ahora selecciona el rival a intercambiar.');
      return;
    }
    if (swapA === idinscripcion) {
      setSwapA(null);
      setMensaje('');
      return;
    }
    setSwapBusy(true);
    try {
      await torneoAreasService.reasignarMatchmaking(idtorneo, { idinscripcion_a: swapA, idinscripcion_b: idinscripcion });
      setMensaje('✓ Competidores intercambiados');
      setSwapA(null);
      await cargarRef.current(false);
    } catch (e: any) {
      setMensaje(e?.response?.data?.detail ?? 'Error al intercambiar');
    } finally {
      setSwapBusy(false);
    }
  };

  const categoriaActiva = preview?.categorias.find(c => c.idcategoria === catActiva);

  return (
    <div className="space-y-4">
      {/* Header panel */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: T.textDim }}>
          Matchmaking
        </p>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setModoSwap(!modoSwap); setSwapA(null); setMensaje(''); }}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-[8px] font-black uppercase tracking-wider"
            style={{
              background: modoSwap ? `${T.violet}15` : T.surface,
              border: `1px solid ${modoSwap ? `${T.violet}50` : T.border}`,
              color: modoSwap ? T.violetHi : T.textDim,
            }}>
            <ArrowLeftRight size={11} />
            {modoSwap ? 'Cancelar swap' : 'Editar orden'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => cargar()}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <RefreshCw size={12} style={{ color: T.textDim }} />
          </motion.button>
        </div>
      </div>

      {/* Mensaje de estado swap */}
      <AnimatePresence>
        {modoSwap && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-2xl"
            style={{ background: `${T.violet}10`, border: `1px solid ${T.violet}25` }}>
            <ArrowLeftRight size={12} style={{ color: T.violetHi }} />
            <span className="text-[9px] font-bold" style={{ color: T.textDim }}>
              {swapA
                ? mensaje || 'Selecciona con quién intercambiar...'
                : 'Selecciona el primer competidor a mover.'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {mensaje && !modoSwap && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-3 rounded-2xl text-[9px] font-bold"
          style={{ background: '#10b98112', color: '#10b981', border: '1px solid #10b98125' }}>
          {mensaje}
        </motion.div>
      )}

      {cargando ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin" style={{ color: T.violetHi }} />
        </div>
      ) : !preview || preview.categorias.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3"
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '1.5rem' }}>
          <Swords size={24} style={{ color: T.textDim }} />
          <p className="text-[9px] font-black uppercase tracking-wider text-center"
            style={{ color: T.textDim }}>
            Sin asistentes con check-in aún.<br />Realiza el check-in para ver el matchmaking.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs categorías */}
          {preview.categorias.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {preview.categorias.map(cat => (
                <motion.button key={cat.idcategoria} whileTap={{ scale: 0.93 }}
                  onClick={() => setCatActiva(cat.idcategoria)}
                  className="px-3 h-8 rounded-xl text-[8px] font-black uppercase tracking-wider"
                  style={{
                    background: catActiva === cat.idcategoria ? `${T.violet}15` : T.surface,
                    border: `1px solid ${catActiva === cat.idcategoria ? `${T.violet}50` : T.border}`,
                    color: catActiva === cat.idcategoria ? T.violetHi : T.textDim,
                  }}>
                  {cat.nombre_categoria} ({cat.total})
                </motion.button>
              ))}
            </div>
          )}

          {/* Enfrentamientos */}
          {categoriaActiva && (
            <div className="space-y-3">
              {categoriaActiva.enfrentamientos.map((enf, i) => (
                <motion.div key={enf.posicion}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-[1.5rem] p-4"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                  }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[8px] font-black uppercase tracking-widest"
                      style={{ color: T.textDim }}>
                      Combate {enf.posicion}
                    </span>
                    {enf.advertencia && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                        style={{ background: '#f9731612', border: '1px solid #f9731625' }}>
                        <AlertTriangle size={9} color="#f97316" />
                        <span className="text-[7px] font-bold" style={{ color: '#f97316' }}>
                          {enf.advertencia}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Competidor A */}
                    <CompetidorChip
                      comp={enf.competidor_a}
                      lado="A"
                      seleccionado={swapA === enf.competidor_a?.idinscripcion}
                      modoSwap={modoSwap}
                      onClick={() => modoSwap && enf.competidor_a && handleSwap(enf.competidor_a.idinscripcion)}
                      busy={swapBusy}
                      T={T}
                    />

                    {/* VS */}
                    <div className="flex-shrink-0 text-[8px] font-black"
                      style={{ color: T.textDim }}>
                      {enf.es_bye ? 'BYE' : 'vs'}
                    </div>

                    {/* Competidor B */}
                    {enf.competidor_b ? (
                      <CompetidorChip
                        comp={enf.competidor_b}
                        lado="B"
                        seleccionado={swapA === enf.competidor_b?.idinscripcion}
                        modoSwap={modoSwap}
                        onClick={() => modoSwap && enf.competidor_b && handleSwap(enf.competidor_b.idinscripcion)}
                        busy={swapBusy}
                        T={T}
                      />
                    ) : (
                      <div className="flex-1 rounded-xl h-12 flex items-center justify-center"
                        style={{ background: T.surface, border: '1px dashed ${T.border}' }}>
                        <span className="text-[8px] font-bold" style={{ color: T.textDim }}>BYE</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CompetidorChip: React.FC<{
  comp:        any;
  lado:        'A' | 'B';
  seleccionado: boolean;
  modoSwap:    boolean;
  onClick:     () => void;
  busy:        boolean;
  T:           Tema;
}> = ({ comp, lado, seleccionado, modoSwap, onClick, busy, T }) => (
  <motion.div
    whileTap={modoSwap && !busy ? { scale: 0.95 } : {}}
    onClick={onClick}
    className="flex-1 rounded-xl p-2.5 flex items-center gap-2"
    style={{
      background: seleccionado
        ? `${T.violet}15`
        : modoSwap
        ? T.surface
        : T.surface,
      border: `1px solid ${seleccionado ? `${T.violet}50` : T.border}`,
      cursor: modoSwap && !busy ? 'pointer' : 'default',
      transition: 'all 0.15s',
    }}>
    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0"
      style={{
        background: `${lado === 'A' ? T.violetHi : '#06b6d4'}18`,
        color: lado === 'A' ? T.violetHi : '#06b6d4',
      }}>
      {comp?.nombre?.charAt(0) ?? '?'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-black uppercase italic tracking-tight truncate"
        style={{ color: T.text }}>
        {comp?.nombre ?? '—'}
      </p>
      <p className="text-[7px] font-bold truncate" style={{ color: T.textDim }}>
        {comp?.escuela ?? ''}{comp?.peso ? ` · ${comp.peso}kg` : ''}
      </p>
    </div>
    {seleccionado && <ArrowLeftRight size={11} style={{ color: T.violetHi, flexShrink: 0 }} />}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
interface AreasMatchmakingViewProps {
  idtorneo: number;
  onVolver: () => void;
  T:        Tema;
}

const AreasMatchmakingView: React.FC<AreasMatchmakingViewProps> = ({ idtorneo, onVolver, T }) => {
  const [areas,        setAreas]       = useState<AreaCombate[]>([]);
  const [cargando,     setCargando]    = useState(true);
  const [tab,          setTab]         = useState<'areas' | 'matchmaking'>('areas');
  const [modalArea,    setModalArea]   = useState<AreaCombate | null | undefined>(undefined);
  const [confirmDel,   setConfirmDel]  = useState<AreaCombate | null>(null);
  const [delCargando,  setDelCargando] = useState(false);
  const [errorMsg,     setErrorMsg]    = useState('');

  const cargarAreas = useCallback(async () => {
    setCargando(true);
    try {
      const data = await torneoAreasService.listarAreas(idtorneo);
      setAreas(data);
    } catch {
      setErrorMsg('Error al cargar las áreas');
    } finally {
      setCargando(false);
    }
  }, [idtorneo]);

  useEffect(() => { cargarAreas(); }, [cargarAreas]);

  const handleEliminar = async (area: AreaCombate) => {
    setDelCargando(true);
    try {
      await torneoAreasService.eliminarArea(idtorneo, area.idarea);
      setConfirmDel(null);
      await cargarAreas();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail ?? 'Error al eliminar');
    } finally {
      setDelCargando(false);
    }
  };

  const disponibles   = areas.filter(a => a.estatus === 'disponible').length;
  const en_combate    = areas.filter(a => a.estatus === 'en_combate').length;
  const sin_juez      = areas.filter(a => !a.idjuez_asignado).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <ChevronLeft size={16} style={{ color: T.textDim }} />
        </motion.button>
        <div className="flex-1">
          <p className="text-sm font-black uppercase italic tracking-tighter"
            style={{ color: T.text }}>
            Áreas y Matchmaking
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: T.textDim }}>
            Torneo #{idtorneo}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => setModalArea(null)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider"
          style={{ background: T.violetHi, color: '#fff' }}>
          <Plus size={13} /> Nueva Área
        </motion.button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', val: areas.length, color: T.violetHi, icon: Shield },
          { label: 'En combate', val: en_combate, color: '#f97316', icon: Swords },
          { label: 'Sin juez', val: sin_juez, color: sin_juez > 0 ? '#ef4444' : '#10b981', icon: User },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="rounded-[1.5rem] p-3"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <Icon size={13} style={{ color, marginBottom: 6 }} />
            <p className="text-xl font-black tracking-tighter" style={{ color }}>{val}</p>
            <p className="text-[7px] font-black uppercase tracking-widest mt-0.5"
              style={{ color: T.textDim }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-2xl"
            style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
            <AlertCircle size={12} color="#ef4444" />
            <span className="text-[9px] font-bold flex-1" style={{ color: '#ef4444' }}>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}><X size={12} color="#ef4444" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'areas',       label: `Áreas (${areas.length})` },
          { id: 'matchmaking', label: 'Matchmaking' },
        ].map(t => (
          <motion.button key={t.id} whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t.id as any)}
            className="flex-1 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: tab === t.id ? `${T.violet}15` : T.card,
              border: `1px solid ${tab === t.id ? `${T.violet}60` : T.border}`,
              color: tab === t.id ? T.violetHi : T.textDim,
            }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* TAB ÁREAS */}
      {tab === 'areas' && (
        cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: T.violetHi }} />
          </div>
        ) : areas.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-14 gap-4 rounded-[2rem]"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center"
              style={{ background: `${T.violet}15`, border: `1px solid ${T.violetHi}30` }}>
              <MapPin size={24} style={{ color: T.violetHi }} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-center"
              style={{ color: T.textDim }}>
              No hay áreas creadas.<br />Crea las áreas/rings de la sede.
            </p>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setModalArea(null)}
              className="flex items-center gap-2 px-4 h-10 rounded-2xl text-[9px] font-black uppercase tracking-wider"
              style={{ background: T.violetHi, color: '#fff' }}>
              <Plus size={13} /> Crear primera área
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {areas.map((a, i) => (
              <motion.div key={a.idarea} transition={{ delay: i * 0.04 }}>
                <AreaCard
                  area={a}
                  idtorneo={idtorneo}
                  onEditar={setModalArea}
                  onEliminar={setConfirmDel}
                  T={T}
                />
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* TAB MATCHMAKING */}
      {tab === 'matchmaking' && (
        <MatchmakingPanel idtorneo={idtorneo} T={T} />
      )}

      {/* Modal crear / editar área */}
      <AnimatePresence>
        {modalArea !== undefined && (
          <ModalArea
            key="modal-area"
            idtorneo={idtorneo}
            area={modalArea}
            onClose={() => setModalArea(undefined)}
            onGuardar={cargarAreas}
            T={T}
          />
        )}
      </AnimatePresence>

      {/* Confirmar eliminar */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center pb-8 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setConfirmDel(null)}>
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              className="w-full max-w-sm rounded-[2rem] p-5 space-y-4"
              style={{ background: T.card, border: '1px solid #ef444430' }}
              onClick={e => e.stopPropagation()}>
              <p className="text-sm font-black uppercase italic tracking-tighter"
                style={{ color: '#ef4444' }}>
                ¿Eliminar {confirmDel.nombre_area}?
              </p>
              <p className="text-[9px] font-bold" style={{ color: T.textDim }}>
                Solo se puede eliminar si el área no tiene combates asignados.
              </p>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDel(null)}
                  className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-wider"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
                  Cancelar
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => handleEliminar(confirmDel)}
                  disabled={delCargando}
                  className="flex-[2] h-11 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{ background: '#ef4444', color: '#fff', opacity: delCargando ? 0.7 : 1 }}>
                  {delCargando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Eliminar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AreasMatchmakingView;