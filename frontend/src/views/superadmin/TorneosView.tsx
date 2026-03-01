// ============================================================
//  src/views/superadmin/TorneosView.tsx
//  Lista, creación y detalle de torneos — SIN brackets
//  (los brackets están en CombatesView)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Plus, ChevronRight, Calendar, MapPin, Users,
  CheckCircle, AlertCircle, RotateCcw, X, Play,
  ChevronLeft, Search, Target, DollarSign, Clock,
  FileText, Zap,
} from 'lucide-react';

import { torneoService } from '../../services/torneo.service';
import type { Torneo, CrearTorneoDTO, InscripcionTorneo } from '../../types/torneo.types';

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
//  HELPERS
// ─────────────────────────────────────────────────────────────
const ESTATUS_LABEL: Record<number, { label: string; color: string; icon: React.ElementType }> = {
  1: { label: 'Activo',     color: '#10b981', icon: CheckCircle },
  2: { label: 'En Curso',   color: '#f97316', icon: Play        },
  3: { label: 'Finalizado', color: '#94a3b8', icon: Trophy      },
};

function fmtFecha(iso: string) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

// ─────────────────────────────────────────────────────────────
//  BADGE ESTATUS
// ─────────────────────────────────────────────────────────────
const EstatusBadge: React.FC<{ estatus: number; T: Tema }> = ({ estatus, T }) => {
  const info = ESTATUS_LABEL[estatus] ?? { label: 'Desconocido', color: T.textDim, icon: AlertCircle };
  const Icon = info.icon;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
      style={{ background: `${info.color}18`, border: `1px solid ${info.color}30` }}>
      <Icon size={9} style={{ color: info.color }} />
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: info.color }}>
        {info.label}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MODAL CREAR TORNEO
// ─────────────────────────────────────────────────────────────
const ModalCrearTorneo: React.FC<{
  T: Tema;
  onClose: () => void;
  onCreado: (t: Torneo) => void;
}> = ({ T, onClose, onCreado }) => {
  const [form, setForm] = useState<CrearTorneoDTO>({
    nombre: '', fecha: '', sede: '', ciudad: '',
    descripcion: '', hora_inicio: '09:00',
    costo_inscripcion: 0, max_participantes: 0, genero: 'A',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k: keyof CrearTorneoDTO, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nombre || !form.fecha || !form.sede) {
      setError('Nombre, fecha y sede son requeridos.');
      return;
    }
    try {
      setLoading(true);
      const nuevo = await torneoService.crear(form);
      onCreado(nuevo);
      onClose();
    } catch {
      setError('Error al crear el torneo. Revisa los datos.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: '10px 14px',
    color: T.text, fontSize: 12, width: '100%', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    color: T.textDim, fontSize: 9, fontWeight: 900,
    textTransform: 'uppercase', letterSpacing: '0.2em',
    marginBottom: 4, display: 'block',
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-lg rounded-[2rem] p-6 overflow-y-auto max-h-[90vh]"
        style={{ background: T.card, border: `1px solid ${T.border}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: T.violetLo, border: `1px solid ${T.violet}40` }}>
              <Trophy size={18} style={{ color: T.violetHi }} />
            </div>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                Nuevo Torneo
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                Registro de evento
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <X size={14} style={{ color: T.textDim }} />
          </motion.button>
        </div>

        {/* Campos */}
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Nombre del torneo *</label>
            <input style={inputStyle} placeholder="Ej: Torneo Regional Guanajuato 2026"
              value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input type="date" style={inputStyle}
                value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Hora inicio</label>
              <input type="time" style={inputStyle}
                value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Sede *</label>
              <input style={inputStyle} placeholder="Gimnasio / Dojo"
                value={form.sede} onChange={e => set('sede', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input style={inputStyle} placeholder="León, Gto."
                value={form.ciudad} onChange={e => set('ciudad', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Costo inscripción ($)</label>
              <input type="number" style={inputStyle} placeholder="0"
                value={form.costo_inscripcion}
                onChange={e => set('costo_inscripcion', Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Máx. participantes</label>
              <input type="number" style={inputStyle} placeholder="0 = ilimitado"
                value={form.max_participantes}
                onChange={e => set('max_participantes', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Género</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.genero} onChange={e => set('genero', e.target.value)}>
              <option value="A">Ambos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea style={{ ...inputStyle, resize: 'none', height: 72 }}
              placeholder="Detalles del evento..."
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)} />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-center"
            style={{ color: T.red }}>{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid }}>
            Cancelar
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={loading}
            className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`,
              color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creando...' : 'Crear Torneo'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TARJETA TORNEO
// ─────────────────────────────────────────────────────────────
const TorneoCard: React.FC<{
  torneo: Torneo; T: Tema; delay?: number;
  onVerDetalle: (t: Torneo) => void;
}> = ({ torneo, T, delay = 0, onVerDetalle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    whileHover={{ y: -3 }}
    className="rounded-[2rem] p-5 cursor-pointer"
    style={{
      background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
      border: `1px solid ${T.border}`,
      boxShadow: `0 4px 20px rgba(0,0,0,0.12)`,
    }}
    onClick={() => onVerDetalle(torneo)}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: T.violetLo, border: `1px solid ${T.violet}30` }}>
        <Trophy size={20} style={{ color: T.violetHi }} />
      </div>
      <EstatusBadge estatus={torneo.estatus} T={T} />
    </div>

    <p className="text-sm font-black uppercase italic tracking-tighter leading-tight mb-1"
      style={{ color: T.text }}>{torneo.nombre}</p>
    <p className="text-[8px] font-black uppercase tracking-widest mb-4"
      style={{ color: T.textDim }}>ID #{torneo.idtorneo}</p>

    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2">
        <Calendar size={10} style={{ color: T.cyan }} />
        <span className="text-[10px] font-bold" style={{ color: T.textMid }}>
          {fmtFecha(torneo.fecha)}{torneo.hora_inicio && ` · ${torneo.hora_inicio}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={10} style={{ color: T.orange }} />
        <span className="text-[10px] font-bold truncate" style={{ color: T.textMid }}>
          {torneo.sede}{torneo.ciudad ? `, ${torneo.ciudad}` : ''}
        </span>
      </div>
      {(torneo.max_participantes ?? 0) > 0 && (
        <div className="flex items-center gap-2">
          <Users size={10} style={{ color: T.green }} />
          <span className="text-[10px] font-bold" style={{ color: T.textMid }}>
            Máx. {torneo.max_participantes} participantes
          </span>
        </div>
      )}
    </div>

    <div className="flex items-center justify-between pt-3"
      style={{ borderTop: `1px solid ${T.border}` }}>
      {(torneo.monto_inscripcion ?? 0) > 0 ? (
        <span className="text-sm font-black" style={{ color: T.green }}>
          ${torneo.monto_inscripcion?.toLocaleString('es-MX')}
        </span>
      ) : (
        <span className="text-[9px] font-black uppercase tracking-wider"
          style={{ color: T.textDim }}>Sin costo</span>
      )}
      <div className="flex items-center gap-1" style={{ color: T.violetHi }}>
        <span className="text-[9px] font-black uppercase tracking-wider">Ver detalle</span>
        <ChevronRight size={12} />
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  DETALLE TORNEO — info + inscritos + cerrar checkin
// ─────────────────────────────────────────────────────────────
const DetalleTorneo: React.FC<{
  torneo: Torneo; T: Tema; onVolver: () => void;
}> = ({ torneo, T, onVolver }) => {
  const [inscritos, setInscritos]         = useState<any[]>([]);
  const [loadingInsc, setLoadingInsc]     = useState(true);
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [errorCheckin, setErrorCheckin]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await torneoService.listarInscritos(torneo.idtorneo);
        setInscritos(data);
      } catch {
        // silencioso
      } finally {
        setLoadingInsc(false);
      }
    })();
  }, [torneo.idtorneo]);

  const handleCerrarCheckin = async () => {
    if (!confirm('¿Cerrar check-in y generar brackets? Esta acción no se puede deshacer.')) return;
    try {
      setLoadingCheckin(true);
      setErrorCheckin('');
      const res = await torneoService.cerrarCheckin(torneo.idtorneo);
      setCheckinResult(res);
    } catch (e: any) {
      setErrorCheckin(e?.response?.data?.detail || 'Error al cerrar check-in');
    } finally {
      setLoadingCheckin(false);
    }
  };

  const pagados   = inscritos.filter(i => i.estatus_pago === 'pagado').length;
  const checkin   = inscritos.filter(i => i.estatus_checkin).length;
  const pendientes = inscritos.filter(i => i.estatus_pago !== 'pagado').length;

  return (
    <div className="space-y-6">

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
        <EstatusBadge estatus={torneo.estatus} T={T} />
      </div>

      {/* Info general */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] p-5 space-y-3"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: T.textDim }}>
          Información del evento
        </p>
        {[
          { icon: Calendar,    label: 'Fecha',        value: `${fmtFecha(torneo.fecha)} · ${torneo.hora_inicio ?? '—'}`, color: T.cyan   },
          { icon: MapPin,      label: 'Sede',         value: `${torneo.sede}${torneo.ciudad ? ', ' + torneo.ciudad : ''}`,  color: T.orange },
          { icon: Users,       label: 'Participantes',value: `Máx. ${torneo.max_participantes ?? '∞'}`,                    color: T.green  },
          { icon: DollarSign,  label: 'Inscripción',  value: torneo.monto_inscripcion ? `$${torneo.monto_inscripcion}` : 'Sin costo', color: T.violet },
          { icon: Target,      label: 'Género',       value: torneo.genero === 'M' ? 'Masculino' : torneo.genero === 'F' ? 'Femenino' : 'Ambos', color: T.yellow },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}18`, border: `1px solid ${item.color}25` }}>
              <item.icon size={12} style={{ color: item.color }} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
                {item.label}
              </span>
              <span className="text-[10px] font-bold" style={{ color: T.text }}>{item.value}</span>
            </div>
          </div>
        ))}
        {torneo.descripcion && (
          <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${T.border}` }}>
            <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.textMid }}>
              {torneo.descripcion}
            </p>
          </div>
        )}
      </motion.div>

      {/* KPIs inscritos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Inscritos',  value: inscritos.length, icon: FileText, accent: T.violet, accentLo: T.violetLo },
          { label: 'Pagados',    value: pagados,           icon: CheckCircle, accent: T.green,  accentLo: T.greenLo  },
          { label: 'Check-in',   value: checkin,           icon: Zap,        accent: T.cyan,   accentLo: T.cyanLo   },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-[1.5rem] p-4"
            style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: item.accentLo, border: `1px solid ${item.accent}30` }}>
              <item.icon size={14} style={{ color: item.accent }} />
            </div>
            <p className="text-2xl font-black tracking-tighter" style={{ color: T.text }}>
              {loadingInsc ? '—' : item.value}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: T.textDim }}>
              {item.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Botón cerrar check-in — solo si el torneo está Activo */}
      {torneo.estatus === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] p-5"
          style={{ background: `linear-gradient(135deg, ${T.orangeLo}, ${T.yellowLo})`,
            border: `1px solid ${T.orange}30` }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: T.orangeLo, border: `1px solid ${T.orange}40` }}>
                <Zap size={18} style={{ color: T.orange }} />
              </div>
              <div>
                <p className="text-xs font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                  Cerrar Check-In
                </p>
                <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
                  Genera brackets automáticamente · {checkin} con check-in
                </p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCerrarCheckin}
              disabled={loadingCheckin || checkin < 2}
              className="h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{
                background: checkin >= 2 ? `linear-gradient(135deg, ${T.orange}, ${T.yellow})` : T.surface,
                color: checkin >= 2 ? '#fff' : T.textDim,
                border: checkin < 2 ? `1px solid ${T.border}` : 'none',
                opacity: loadingCheckin ? 0.7 : 1,
                cursor: checkin < 2 ? 'not-allowed' : 'pointer',
              }}>
              {loadingCheckin ? 'Generando...' : checkin < 2 ? 'Mín. 2 check-in' : '🚀 Generar Brackets'}
            </motion.button>
          </div>

          {/* Resultado */}
          <AnimatePresence>
            {checkinResult && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${T.border}` }}>
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.green }}>
                  ✅ {checkinResult.mensaje} — {checkinResult.combates_creados} combates creados
                </p>
                {checkinResult.categorias?.map((cat: any) => (
                  <div key={cat.idcategoria} className="flex items-center justify-between">
                    <span className="text-[9px] font-bold" style={{ color: T.textMid }}>{cat.nombre}</span>
                    <span className="text-[9px] font-black" style={{ color: cat.nota ? T.red : T.green }}>
                      {cat.nota ?? `${cat.combates_r1} combates · R${cat.total_rondas}`}
                    </span>
                  </div>
                ))}
                <p className="text-[8px] font-bold mt-2" style={{ color: T.textDim }}>
                  Ve a la sección <span style={{ color: T.cyan }}>Combates</span> para ver los brackets en vivo.
                </p>
              </motion.div>
            )}
            {errorCheckin && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 text-[9px] font-black uppercase tracking-wider"
                style={{ color: T.red }}>⚠️ {errorCheckin}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lista de inscritos */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[2rem] p-5"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: T.cyanLo, border: `1px solid ${T.cyan}30` }}>
            <Users size={14} style={{ color: T.cyan }} />
          </div>
          <div>
            <p className="text-xs font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
              Inscritos
            </p>
            <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
              {inscritos.length} registros
            </p>
          </div>
        </div>

        {loadingInsc ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full"
              style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.cyan}` }} />
          </div>
        ) : inscritos.length === 0 ? (
          <p className="text-center text-[10px] font-black uppercase tracking-wider py-6"
            style={{ color: T.textDim }}>Sin inscritos aún</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {inscritos.map((insc: any, i: number) => {
              const al = insc.alumnos ?? insc;
              const nombre = al.nombres
                ? `${al.nombres} ${al.apellidopaterno}`
                : insc.nombre_completo ?? `Inscripción #${insc.idinscripcion}`;
              const pagado = insc.estatus_pago === 'pagado';
              const chk    = insc.estatus_checkin;
              return (
                <motion.div key={insc.idinscripcion ?? i}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] flex-shrink-0"
                    style={{ background: `${T.violet}20`, color: T.violetHi, border: `1px solid ${T.violet}20` }}>
                    {nombre[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase italic tracking-tighter truncate"
                      style={{ color: T.text }}>{nombre}</p>
                    <p className="text-[7px] font-bold" style={{ color: T.textDim }}>
                      {insc.peso_declarado ? `${insc.peso_declarado} kg` : '—'}
                      {insc.edad_al_momento ? ` · ${insc.edad_al_momento} años` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider"
                      style={{ background: pagado ? `${T.green}20` : `${T.red}20`,
                        color: pagado ? T.green : T.red }}>
                      {pagado ? 'Pagado' : 'Pendiente'}
                    </span>
                    {chk && (
                      <span className="px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider"
                        style={{ background: `${T.cyan}20`, color: T.cyan }}>
                        ✓ Check
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const TorneosView: React.FC<{ T: Tema }> = ({ T }) => {
  const [torneos, setTorneos]             = useState<Torneo[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [torneoDetalle, setTorneoDetalle] = useState<Torneo | null>(null);
  const [filtro, setFiltro]               = useState<'todos' | 'activo' | 'en_curso' | 'finalizado'>('todos');
  const [busqueda, setBusqueda]           = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await torneoService.listar();
      setTorneos(data);
    } catch {
      setError('Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const torneosFiltrados = torneos.filter(t => {
    const matchFiltro =
      filtro === 'todos'      ? true :
      filtro === 'activo'     ? t.estatus === 1 :
      filtro === 'en_curso'   ? t.estatus === 2 :
      filtro === 'finalizado' ? t.estatus === 3 : true;
    const matchBusqueda = t.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  if (torneoDetalle) {
    return (
      <DetalleTorneo
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
            style={{ color: T.text }}>Torneos</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1"
            style={{ color: T.textDim }}>{torneos.length} eventos registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <RotateCcw size={14} style={{ color: T.textDim }} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`, color: '#fff' }}>
            <Plus size={14} /> Nuevo
          </motion.button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: T.textDim }} />
        <input placeholder="Buscar torneo..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-2xl text-xs font-bold outline-none"
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'activo', 'en_curso', 'finalizado'] as const).map(f => (
          <motion.button key={f} whileTap={{ scale: 0.92 }} onClick={() => setFiltro(f)}
            className="h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: filtro === f ? T.violetLo : T.surface,
              border: `1px solid ${filtro === f ? T.violet + '60' : T.border}`,
              color: filtro === f ? T.violetHi : T.textMid,
            }}>
            {f === 'todos' ? 'Todos' : f === 'en_curso' ? 'En Curso' : f.charAt(0).toUpperCase() + f.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full"
            style={{ border: `3px solid ${T.border}`, borderTop: `3px solid ${T.violet}`,
              boxShadow: `0 0 20px ${T.violet}40` }} />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse"
            style={{ color: T.textDim }}>Cargando torneos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-[2rem] flex items-center justify-center"
            style={{ background: T.redLo, border: `1px solid ${T.red}40` }}>
            <AlertCircle size={24} style={{ color: T.red }} />
          </div>
          <p className="text-sm font-bold italic" style={{ color: T.textMid }}>{error}</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={cargar}
            className="flex items-center gap-2 px-5 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: T.violetLo, border: `1px solid ${T.violet}50`, color: T.violetHi }}>
            <RotateCcw size={14} /> Reintentar
          </motion.button>
        </div>
      ) : torneosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-16 h-16 rounded-[2rem] flex items-center justify-center"
            style={{ background: T.violetLo, border: `1px solid ${T.violet}40` }}>
            <Trophy size={28} style={{ color: T.violetHi }} />
          </motion.div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: T.textDim }}>
            {busqueda ? 'Sin resultados' : 'Sin torneos registrados'}
          </p>
          {!busqueda && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{ background: T.violetLo, border: `1px solid ${T.violet}50`, color: T.violetHi }}>
              <Plus size={14} /> Crear primer torneo
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneosFiltrados.map((t, i) => (
            <TorneoCard key={t.idtorneo} torneo={t} T={T} delay={i * 0.08}
              onVerDetalle={setTorneoDetalle} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalCrearTorneo
            T={T}
            onClose={() => setShowModal(false)}
            onCreado={nuevo => setTorneos(prev => [nuevo, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TorneosView;