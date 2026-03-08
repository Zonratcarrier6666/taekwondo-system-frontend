// ============================================================
//  src/views/escuela/TorneosEscuelaView.tsx
//  Flujo: ver torneos → elegir → seleccionar alumnos → inscribir
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, ChevronRight, X, Check, AlertCircle,
  Scale, Calendar, MapPin, DollarSign, ArrowLeft,
  UserCheck, Clock, ShieldAlert, Info, Loader,
} from 'lucide-react';

import { inscripcionService } from '../../services/inscripcion.service';
import type {
  TorneoResumen, AlumnoElegible, AlumnoNoElegible,
} from '../../types/inscripcion.types';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const ESTATUS_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Activo',     color: '#10b981' },
  2: { label: 'En Curso',   color: '#f97316' },
  3: { label: 'Finalizado', color: '#6b7280' },
};

const fmtFecha = (f: string) =>
  new Date(f + 'T12:00:00').toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

// ─────────────────────────────────────────────────────────────
//  BADGE DE CINTA
// ─────────────────────────────────────────────────────────────
const CintaBadge: React.FC<{ cinta: string; color: string }> = ({ cinta, color }) => (
  <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider"
    style={{ background: `${color}25`, color, border: `1px solid ${color}40` }}>
    {cinta}
  </span>
);

// ─────────────────────────────────────────────────────────────
//  CARD DE TORNEO
// ─────────────────────────────────────────────────────────────
const TorneoCard: React.FC<{
  torneo: TorneoResumen;
  onSeleccionar: (t: TorneoResumen) => void;
}> = ({ torneo, onSeleccionar }) => {
  const est = ESTATUS_LABEL[torneo.estatus] ?? { label: 'Desconocido', color: '#888' };
  const disabled = torneo.estatus !== 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled ? { y: -3 } : {}}
      onClick={() => !disabled && onSeleccionar(torneo)}
      className="rounded-[2rem] p-5 flex flex-col gap-3"
      style={{
        background: 'linear-gradient(135deg, var(--color-card), var(--color-surface))',
        border: '1px solid var(--color-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${est.color}20`, border: `1px solid ${est.color}30` }}>
            <Trophy size={18} style={{ color: est.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black uppercase italic tracking-tighter leading-tight truncate"
              style={{ color: 'var(--color-text)' }}>{torneo.nombre}</p>
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-1 inline-block"
              style={{ background: `${est.color}18`, color: est.color }}>
              {est.label}
            </span>
          </div>
        </div>
        {!disabled && <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 4 }} />}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Calendar, text: fmtFecha(torneo.fecha) },
          { icon: MapPin,   text: `${torneo.sede}${torneo.ciudad ? `, ${torneo.ciudad}` : ''}` },
          { icon: DollarSign, text: torneo.monto_inscripcion ? `$${torneo.monto_inscripcion.toLocaleString('es-MX')} MXN` : 'Sin costo' },
          { icon: Users,    text: torneo.total_inscritos !== undefined ? `${torneo.total_inscritos} inscritos` : 'Cupo abierto' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <Icon size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <span className="text-[9px] font-bold truncate" style={{ color: 'var(--color-text-muted)' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Requisitos */}
      {(torneo.cinta_minima || torneo.edad_minima || torneo.peso_minimo) && (
        <div className="flex flex-wrap gap-1.5 pt-2"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          {torneo.cinta_minima && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              🥋 Cinta {torneo.cinta_minima}–{torneo.cinta_maxima ?? '∞'}
            </span>
          )}
          {torneo.edad_minima && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              🎂 {torneo.edad_minima}–{torneo.edad_maxima ?? '∞'} años
            </span>
          )}
          {torneo.peso_minimo && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              ⚖️ {torneo.peso_minimo}–{torneo.peso_maximo ?? '∞'} kg
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  FILA DE ALUMNO ELEGIBLE
// ─────────────────────────────────────────────────────────────
const AlumnoRow: React.FC<{
  alumno: AlumnoElegible;
  seleccionado: boolean;
  onToggle: () => void;
  peso: string;
  onPeso: (v: string) => void;
}> = ({ alumno, seleccionado, onToggle, peso, onPeso }) => (
  <motion.div
    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
    className="rounded-2xl p-3 flex items-center gap-3"
    style={{
      background: seleccionado
        ? 'linear-gradient(135deg, var(--color-primary)15, var(--color-primary)05)'
        : 'var(--color-surface)',
      border: `1px solid ${seleccionado ? 'var(--color-primary)50' : 'var(--color-border)'}`,
      opacity: alumno.ya_inscrito ? 0.5 : 1,
    }}>

    {/* Checkbox */}
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => !alumno.ya_inscrito && onToggle()}
      disabled={alumno.ya_inscrito}
      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: seleccionado ? 'var(--color-primary)' : 'var(--color-card)',
        border: `2px solid ${seleccionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
        cursor: alumno.ya_inscrito ? 'not-allowed' : 'pointer',
      }}>
      {seleccionado && <Check size={12} color="#fff" />}
      {alumno.ya_inscrito && <UserCheck size={10} style={{ color: '#10b981' }} />}
    </motion.button>

    {/* Avatar */}
    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
      style={{ background: 'var(--color-primary)20', color: 'var(--color-primary)', border: '1px solid var(--color-primary)25' }}>
      {alumno.nombres[0]}{alumno.apellidopaterno[0]}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-black uppercase italic tracking-tighter truncate"
        style={{ color: 'var(--color-text)' }}>
        {alumno.nombres} {alumno.apellidopaterno}
      </p>
      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
        <CintaBadge cinta={alumno.cinta} color={alumno.color_cinta} />
        <span className="text-[8px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
          {alumno.edad} años
        </span>
        {alumno.ya_inscrito && (
          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg"
            style={{ background: '#10b98120', color: '#10b981' }}>
            Ya inscrito
          </span>
        )}
      </div>
    </div>

    {/* Input peso — solo si seleccionado */}
    <AnimatePresence>
      {seleccionado && (
        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            value={peso}
            onChange={e => onPeso(e.target.value)}
            placeholder="kg"
            className="w-16 text-center text-[11px] font-black rounded-xl py-1.5 px-2 outline-none"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <Scale size={10} style={{ color: 'var(--color-text-muted)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  MODAL INSCRIPCIÓN
// ─────────────────────────────────────────────────────────────
const ModalInscripcion: React.FC<{
  torneo: TorneoResumen;
  onClose: () => void;
  onExito: (inscritos: number) => void;
}> = ({ torneo, onClose, onExito }) => {
  const [elegibles, setElegibles]   = useState<AlumnoElegible[]>([]);
  const [noEleg, setNoEleg]         = useState<AlumnoNoElegible[]>([]);
  const [loading, setLoading]       = useState(true);
  const [enviando, setEnviando]     = useState(false);
  const [error, setError]           = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [pesos, setPesos]           = useState<Record<number, string>>({});
  const [tab, setTab]               = useState<'elegibles' | 'no_elegibles'>('elegibles');
  const [resultado, setResultado]   = useState<{ inscritos: number; errores: any[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await inscripcionService.alumnosElegibles(torneo.idtorneo);
        setElegibles(data.elegibles);
        setNoEleg(data.no_elegibles);
      } catch {
        setError('No se pudieron cargar los alumnos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [torneo.idtorneo]);

  const toggleAlumno = (id: number) => {
    setSeleccionados(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleTodos = () => {
    const disponibles = elegibles.filter(a => !a.ya_inscrito).map(a => a.idalumno);
    if (seleccionados.size === disponibles.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(disponibles));
    }
  };

  const handleInscribir = async () => {
    if (seleccionados.size === 0) {
      setError('Selecciona al menos un alumno.');
      return;
    }
    try {
      setEnviando(true);
      setError('');
      // peso_actual es opcional — solo lo mandamos si el usuario lo capturó
      const alumnos = Array.from(seleccionados).map(id => {
        const item: any = { idalumno: id };
        if (pesos[id] && pesos[id].trim() !== '') {
          item.peso_actual = parseFloat(pesos[id]);
        }
        return item;
      });
      const res = await inscripcionService.inscribirConPeso(torneo.idtorneo, { alumnos });
      // la respuesta puede venir como { ok, inscritos, errores } o { ok, resultados }
      const inscritos = res.inscritos ?? res.resultados?.filter((r: any) => r.ok)?.length ?? 0;
      const errores   = res.errores   ?? res.resultados?.filter((r: any) => !r.ok) ?? [];
      setResultado({ inscritos, errores });
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(' · '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Error al inscribir. Intenta de nuevo.');
      }
      setEnviando(false);
    } finally {
      setEnviando(false);
    }
  };

  const disponibles = elegibles.filter(a => !a.ya_inscrito);

  return createPortal(
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.93, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-lg flex flex-col"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '2rem',
          maxHeight: 'calc(100dvh - 40px)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)20', border: '1px solid var(--color-primary)40' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter leading-tight"
                style={{ color: 'var(--color-text)' }}>Inscribir Alumnos</p>
              <p className="text-[8px] font-black uppercase tracking-widest truncate max-w-[200px]"
                style={{ color: 'var(--color-text-muted)' }}>{torneo.nombre}</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </motion.button>
        </div>

        {/* ── RESULTADO EXITOSO ── */}
        {resultado ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center"
              style={{ background: '#10b98120', border: '2px solid #10b98140' }}>
              <Check size={36} color="#10b981" />
            </motion.div>
            <div className="text-center space-y-1">
              <p className="text-xl font-black uppercase italic tracking-tighter"
                style={{ color: 'var(--color-text)' }}>
                {resultado.inscritos} alumno{resultado.inscritos !== 1 ? 's' : ''} inscrito{resultado.inscritos !== 1 ? 's' : ''}
              </p>
              <p className="text-[9px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                Se generó un pago pendiente para cada alumno y se notificó al tutor.
              </p>
            </div>

            {resultado.errores.length > 0 && (
              <div className="w-full rounded-2xl p-3 space-y-1"
                style={{ background: '#f9731615', border: '1px solid #f9731630' }}>
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#f97316' }}>
                  {resultado.errores.length} con error:
                </p>
                {resultado.errores.map((e: any) => (
                  <p key={e.idalumno} className="text-[9px] font-bold" style={{ color: '#f97316' }}>
                    • Alumno #{e.idalumno}: {e.error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
                className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                style={{ background: 'var(--color-primary)', color: '#fff' }}>
                Cerrar
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* ── TABS ── */}
            <div className="flex px-5 pt-4 gap-2 flex-shrink-0">
              {[
                { id: 'elegibles',    label: `Elegibles (${elegibles.length})` },
                { id: 'no_elegibles', label: `No elegibles (${noEleg.length})` },
              ].map(t => (
                <motion.button key={t.id} whileTap={{ scale: 0.95 }}
                  onClick={() => setTab(t.id as any)}
                  className="flex-1 h-8 rounded-xl text-[9px] font-black uppercase tracking-wider"
                  style={{
                    background: tab === t.id ? 'var(--color-primary)22' : 'var(--color-surface)',
                    border: `1px solid ${tab === t.id ? 'var(--color-primary)60' : 'var(--color-border)'}`,
                    color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                  {t.label}
                </motion.button>
              ))}
            </div>

            {/* ── HINT DE PESO ── */}
            {tab === 'elegibles' && !loading && elegibles.length > 0 && (
              <div className="mx-5 mt-3 flex items-start gap-2 p-3 rounded-2xl flex-shrink-0"
                style={{ background: 'var(--color-primary)10', border: '1px solid var(--color-primary)20' }}>
                <Info size={12} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[9px] font-bold leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  Selecciona a los alumnos e ingresa su <strong style={{ color: 'var(--color-primary)' }}>peso actual</strong> para un matchmaking más justo. El peso es opcional pero recomendado.
                </p>
              </div>
            )}

            {/* ── LISTA SCROLLEABLE ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
              style={{ overscrollBehavior: 'contain' }}>

              {loading ? (
                <div className="flex justify-center py-10">
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 rounded-full"
                    style={{ border: '2px solid var(--color-border)', borderTop: '2px solid var(--color-primary)' }} />
                </div>

              ) : tab === 'elegibles' ? (
                elegibles.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Users size={28} style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-[10px] font-black uppercase tracking-wider text-center"
                      style={{ color: 'var(--color-text-muted)' }}>
                      Ningún alumno cumple los requisitos
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Seleccionar todos */}
                    {disponibles.length > 0 && (
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={toggleTodos}
                        className="w-full flex items-center justify-between p-3 rounded-2xl mb-1"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <span className="text-[9px] font-black uppercase tracking-wider"
                          style={{ color: 'var(--color-text-muted)' }}>
                          {seleccionados.size === disponibles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg"
                          style={{ background: 'var(--color-primary)20', color: 'var(--color-primary)' }}>
                          {seleccionados.size}/{disponibles.length}
                        </span>
                      </motion.button>
                    )}
                    {elegibles.map((a, i) => (
                      <motion.div key={a.idalumno} transition={{ delay: i * 0.03 }}>
                        <AlumnoRow
                          alumno={a}
                          seleccionado={seleccionados.has(a.idalumno)}
                          onToggle={() => toggleAlumno(a.idalumno)}
                          peso={pesos[a.idalumno] ?? ''}
                          onPeso={v => setPesos(p => ({ ...p, [a.idalumno]: v }))}
                        />
                      </motion.div>
                    ))}
                  </>
                )

              ) : (
                // No elegibles
                noEleg.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Check size={28} style={{ color: '#10b981' }} />
                    <p className="text-[10px] font-black uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}>
                      Todos los alumnos son elegibles
                    </p>
                  </div>
                ) : (
                  noEleg.map((a, i) => (
                    <motion.div key={a.idalumno}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-2xl p-3 flex items-center gap-3"
                      style={{ background: 'var(--color-surface)', border: '1px solid #f9731625' }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#f9731620', border: '1px solid #f9731630' }}>
                        <ShieldAlert size={12} color="#f97316" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase italic tracking-tighter"
                          style={{ color: 'var(--color-text)' }}>
                          {a.nombres} {a.apellidopaterno}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {a.razones_no_elegible.map(r => (
                            <span key={r} className="text-[8px] font-bold px-1.5 py-0.5 rounded-lg"
                              style={{ background: '#f9731615', color: '#f97316' }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <CintaBadge cinta={a.cinta} color={a.color_cinta} />
                    </motion.div>
                  ))
                )
              )}
            </div>

            {/* ── ERROR ── */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mx-5 flex items-center gap-2 p-3 rounded-2xl flex-shrink-0"
                  style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
                  <AlertCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                  <p className="text-[9px] font-bold" style={{ color: '#ef4444' }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── BOTONES ── */}
            <div className="flex gap-3 px-5 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid var(--color-border)' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
                className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                Cancelar
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleInscribir}
                disabled={enviando || seleccionados.size === 0}
                className="flex-[2] h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, var(--color-primary)))`,
                  color: '#fff',
                  opacity: enviando || seleccionados.size === 0 ? 0.6 : 1,
                }}>
                {enviando
                  ? <><Loader size={12} className="animate-spin" /> Inscribiendo...</>
                  : <>Inscribir {seleccionados.size > 0 ? `(${seleccionados.size})` : ''}</>
                }
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const TorneosEscuelaView: React.FC<{
  onAbrirCheckin?: (idtorneo: number) => void;
}> = ({ onAbrirCheckin }) => {
  const [torneos, setTorneos]           = useState<TorneoResumen[]>([]);
  const [loading, setLoading]           = useState(true);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<TorneoResumen | null>(null);
  const [exito, setExito]               = useState<{ torneo: string; inscritos: number } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inscripcionService.listarTorneos();
      // Ordenar: activos primero
      setTorneos(data.sort((a, b) => a.estatus - b.estatus));
    } catch {
      setTorneos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleExito = (inscritos: number) => {
    if (!torneoSeleccionado) return;
    setExito({ torneo: torneoSeleccionado.nombre, inscritos });
    setTorneoSeleccionado(null);
    cargar(); // refrescar conteos
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-black uppercase italic tracking-tighter leading-none"
            style={{ color: 'var(--color-text)' }}>Torneos</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1"
            style={{ color: 'var(--color-text-muted)' }}>
            Inscribe a tus alumnos
          </p>
        </div>
      </div>

      {/* Banner de éxito */}
      <AnimatePresence>
        {exito && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: '#10b98115', border: '1px solid #10b98130' }}>
            <Check size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase italic tracking-tighter"
                style={{ color: '#10b981' }}>
                ¡{exito.inscritos} alumno{exito.inscritos !== 1 ? 's' : ''} inscrito{exito.inscritos !== 1 ? 's' : ''}!
              </p>
              <p className="text-[9px] font-bold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {exito.torneo} — Se generó pago pendiente y se notificó al tutor.
              </p>
            </div>
            <button onClick={() => setExito(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de torneos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full"
            style={{ border: '2px solid var(--color-border)', borderTop: '2px solid var(--color-primary)' }} />
        </div>
      ) : torneos.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 rounded-[2rem]"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <Trophy size={32} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-[10px] font-black uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}>
            No hay torneos disponibles
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {torneos.map((t, i) => (
            <motion.div key={t.idtorneo} transition={{ delay: i * 0.06 }}>
              <TorneoCard torneo={t} onSeleccionar={setTorneoSeleccionado} />
              {/* Botón check-in solo para torneos en curso (estatus 2) */}
              {t.estatus === 2 && onAbrirCheckin && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAbrirCheckin(t.idtorneo)}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider -mt-1"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981',
                  }}>
                  <UserCheck size={12} /> Check-in Día del Torneo
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {torneoSeleccionado && (
          <ModalInscripcion
            torneo={torneoSeleccionado}
            onClose={() => setTorneoSeleccionado(null)}
            onExito={handleExito}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TorneosEscuelaView;