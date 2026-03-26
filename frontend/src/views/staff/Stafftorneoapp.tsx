// ============================================================
//  src/views/staff/StaffTorneoApp.tsx
//  Dashboard del Staff — Check-in, báscula, lista completa,
//  descarga de gafete.
//  Patrón idéntico a JuezDashboard (tema T, framer-motion,
//  lucide-react, torneoAreasService)
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, UserCheck, Users, FileDown,
  LogOut, Sun, Moon, Search, RefreshCw,
  CheckCircle2, Clock, XCircle, AlertTriangle,
  LayoutDashboard, Loader2, ChevronRight,
  Weight, Printer, Filter, Activity, Swords,
  QrCode, X, Check, School, ChevronLeft,
} from 'lucide-react';

// @ts-ignore
import { useAuth } from '../../context/AuthContext';
import {
  torneoAreasService,
  type CompetidorCheckin,
  type CheckinListaCompletaResponse,
  type CheckinResponse,
} from '../../services/torneo_areas.service';
import { torneoService } from '../../services/torneo.service';
import type { Torneo } from '../../types/torneo.types';
import api from '../../api/axios';

// ─────────────────────────────────────────────────────────────
//  VENTANILLA — tipos y service local
// ─────────────────────────────────────────────────────────────
interface EscuelaResumen {
  idescuela:       number;
  nombreescuela:   string;
  total_inscritos: number;
  con_checkin:     number;
  pendientes:      number;
}

// Descarga un PDF con el token JWT de Axios (evita "Not authenticated" en window.open)
const descargarPdfAutenticado = async (url: string, filename: string) => {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
};

const ventanillaService = {
  listarEscuelas: async (idtorneo: number): Promise<EscuelaResumen[]> => {
    const { data } = await api.get(`/torneos-v2/torneos/${idtorneo}/checkin/escuelas`);
    return data.escuelas ?? [];
  },
  descargarGafetesEscuela: async (
    idtorneo: number,
    idescuela: number,
    hacerCheckin: boolean,
    nombreEscuela: string,
  ) => {
    const url = `/torneos-v2/torneos/${idtorneo}/checkin/gafetes-escuela` +
      `?idescuela=${idescuela}&hacer_checkin=${hacerCheckin}`;
    await descargarPdfAutenticado(url, `Gafetes_${nombreEscuela.replace(/ /g,'_')}_${idtorneo}.pdf`);
  },
};

// ─────────────────────────────────────────────────────────────
//  TEMA — idéntico al resto del sistema
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
//  NAV
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'panel',      label: 'Panel',    icon: LayoutDashboard },
  { id: 'checkin',    label: 'Check-in', icon: UserCheck       },
  { id: 'lista',      label: 'Lista',    icon: Users           },
  { id: 'ventanilla', label: 'Gafetes',  icon: Printer         },
];

// ─────────────────────────────────────────────────────────────
//  BOTTOM NAV
// ─────────────────────────────────────────────────────────────
const BottomNav: React.FC<{
  active:   string;
  onChange: (id: string) => void;
  T:        Tema;
}> = ({ active, onChange, T }) => (
  <motion.nav
    initial={{ y: 80 }} animate={{ y: 0 }}
    transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 26 }}
    className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 px-4 pointer-events-none"
  >
    <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-[2rem] pointer-events-auto"
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
            className="relative flex flex-col items-center justify-center px-3 sm:px-4 py-2 rounded-2xl"
            style={{ minWidth: 52 }}>
            {isActive && (
              <motion.div layoutId="staffNavPill"
                className="absolute inset-0 rounded-2xl"
                style={{ background: T.orangeLo, border: `1px solid ${T.orange}40` }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
              />
            )}
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div key="a"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="relative flex flex-col items-center gap-0.5">
                  <Icon size={18} style={{ color: T.orange }} strokeWidth={2.5} />
                  <span className="text-[7px] font-black uppercase tracking-wider"
                    style={{ color: T.orange }}>{label}</span>
                </motion.div>
              ) : (
                <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
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
//  BADGE de estado del competidor
// ─────────────────────────────────────────────────────────────
const EstadoBadge: React.FC<{ checkin: boolean; tienePago: boolean; T: Tema }> = ({ checkin, tienePago, T }) => {
  if (checkin)    return (
    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
      style={{ background: T.greenLo, color: T.green, border: `1px solid ${T.green}30` }}>
      ✓ OK
    </span>
  );
  if (tienePago)  return (
    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
      style={{ background: T.orangeLo, color: T.orange, border: `1px solid ${T.orange}30` }}>
      Pagado
    </span>
  );
  return (
    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
      style={{ background: T.redLo, color: T.red, border: `1px solid ${T.red}30` }}>
      Pend.
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
//  MODAL CHECK-IN INDIVIDUAL
// ─────────────────────────────────────────────────────────────
const ModalCheckin: React.FC<{
  competidor:  CompetidorCheckin;
  idtorneo:    number;
  onClose:     () => void;
  onSuccess:   (res: CheckinResponse) => void;
  T:           Tema;
}> = ({ competidor, idtorneo, onClose, onSuccess, T }) => {
  const [peso, setPeso]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const confirmar = async () => {
    const pesoNum = parseFloat(peso.replace(',', '.'));
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setError('Ingresa un peso válido (ej: 62.5)'); return;
    }
    setLoading(true); setError(null);
    try {
      const res = await torneoAreasService.hacerCheckin(idtorneo, competidor.idinscripcion, pesoNum);
      onSuccess(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Error al hacer check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="w-full max-w-sm rounded-[2rem] p-6 space-y-5"
        style={{ background: T.card, border: `1px solid ${T.border}` }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.orange }}>
              Staff · Check-in
            </p>
            <p className="text-base font-black uppercase italic tracking-tighter mt-0.5" style={{ color: T.text }}>
              {competidor.nombre_alumno}
            </p>
            <p className="text-[9px] font-bold mt-0.5" style={{ color: T.textDim }}>
              {competidor.escuela} · {competidor.categoria}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <X size={14} style={{ color: T.textDim }} />
          </motion.button>
        </div>

        {/* Info del competidor */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Edad',          val: `${competidor.edad} años` },
            { label: 'Cinta',         val: competidor.cinta         },
            { label: 'Peso declarado', val: competidor.peso_declarado ? `${competidor.peso_declarado} kg` : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] font-black" style={{ color: T.text }}>{val}</p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-0.5" style={{ color: T.textDim }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Peso báscula */}
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: T.textDim }}>
            Peso en báscula (kg)
          </p>
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.orange}40` }}>
            <Weight size={20} style={{ color: T.orange, flexShrink: 0 }} />
            <input
              type="number" min="0" step="0.1" autoFocus
              value={peso}
              onChange={e => setPeso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmar()}
              placeholder="62.5"
              className="flex-1 bg-transparent text-2xl font-black outline-none tracking-tighter"
              style={{ color: T.orange }}
            />
            <span className="text-sm font-black" style={{ color: T.textDim }}>kg</span>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-2xl"
              style={{ background: T.redLo, border: `1px solid ${T.red}30` }}>
              <AlertTriangle size={13} style={{ color: T.red }} />
              <p className="text-[9px] font-bold" style={{ color: T.red }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones */}
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 h-12 rounded-2xl text-[9px] font-black uppercase tracking-wider"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
            Cancelar
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={confirmar} disabled={loading}
            className="flex-1 h-12 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${T.orange}, #ef4444)`,
              color: '#fff',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <><Check size={14} /> Confirmar</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MODAL ÉXITO CHECK-IN (muestra token QR + botón gafete)
// ─────────────────────────────────────────────────────────────
const ModalExito: React.FC<{
  res:      CheckinResponse;
  idtorneo: number;
  onClose:  () => void;
  T:        Tema;
}> = ({ res, idtorneo, onClose, T }) => {
  const handleDescargarGafete = async () => {
    const url = `/torneos-v2/torneos/${idtorneo}/checkin/${res.datos_gafete.idinscripcion}/gafete-pdf`;
    await descargarPdfAutenticado(url, `Gafete_${res.datos_gafete.nombre_alumno.replace(/ /g,'_')}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <motion.div
        initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="w-full max-w-sm rounded-[2rem] p-6 space-y-5 text-center"
        style={{ background: T.card, border: `1px solid ${T.green}40` }}>

        {/* Icono éxito */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto"
          style={{ background: T.greenLo, border: `2px solid ${T.green}50` }}>
          <CheckCircle2 size={36} style={{ color: T.green }} />
        </motion.div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.green }}>
            ¡Check-in completo!
          </p>
          <p className="text-lg font-black uppercase italic tracking-tighter mt-1" style={{ color: T.text }}>
            {res.datos_gafete.nombre_alumno}
          </p>
          {res.ya_existia && (
            <p className="text-[9px] font-bold mt-1" style={{ color: T.yellow }}>
              ⚠ Ya tenía check-in previo
            </p>
          )}
        </div>

        {/* QR token */}
        <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <QrCode size={12} style={{ color: T.textDim, margin: '0 auto 6px' }} />
          <p className="text-[8px] font-mono font-bold break-all" style={{ color: T.textMid }}>
            {res.token_qr}
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={handleDescargarGafete}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider"
            style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.violet})`, color: '#fff' }}>
            <Printer size={14} /> Imprimir Gafete PDF
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-wider"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
            Cerrar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VENTANILLA ESCUELA — entrega de gafetes por escuela
// ─────────────────────────────────────────────────────────────

const PasoEscuela: React.FC<{
  T:             Tema;
  idtorneo:      number;
  onSeleccionar: (esc: EscuelaResumen) => void;
}> = ({ T, idtorneo, onSeleccionar }) => {
  const [escuelas, setEscuelas] = useState<EscuelaResumen[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ventanillaService.listarEscuelas(idtorneo)
      .then(setEscuelas)
      .finally(() => setLoading(false));
    inputRef.current?.focus();
  }, [idtorneo]);

  const filtradas = escuelas.filter(e =>
    e.nombreescuela.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.orange }}>
          Ventanilla · Paso 1 de 2
        </p>
        <p className="text-lg font-black uppercase italic tracking-tighter mt-0.5" style={{ color: T.text }}>
          ¿De qué escuela son?
        </p>
        <p className="text-[9px] font-bold mt-1" style={{ color: T.textDim }}>
          Selecciona la escuela del profesor para ver y registrar a sus competidores.
        </p>
      </div>

      <div className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ background: T.card, border: `1px solid ${T.border}`, height: 48 }}>
        <Search size={15} style={{ color: T.textDim }} />
        <input ref={inputRef} type="text" value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar escuela…"
          className="flex-1 bg-transparent text-sm outline-none font-bold"
          style={{ color: T.text }} />
        {busqueda && (
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setBusqueda('')}>
            <X size={13} style={{ color: T.textDim }} />
          </motion.button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full"
            style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.orange}` }} />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 rounded-[2rem]"
          style={{ background: T.card, border: `1px dashed ${T.border}` }}>
          <School size={28} style={{ color: T.textDim }} />
          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
            {busqueda ? 'Sin resultados' : 'No hay escuelas registradas'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((esc, i) => {
            const listo  = esc.pendientes === 0;
            const accent = listo ? T.green : T.orange;
            return (
              <motion.button key={esc.idescuela}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSeleccionar(esc)}
                className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] text-left"
                style={{ background: T.card, border: `1px solid ${T.border}` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = accent + '60')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                  <School size={18} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                    {esc.nombreescuela}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[8px] font-bold" style={{ color: T.textDim }}>
                      <span style={{ color: T.cyan }}>{esc.total_inscritos}</span> inscritos
                    </span>
                    <span className="text-[8px] font-bold" style={{ color: T.textDim }}>
                      <span style={{ color: T.green }}>{esc.con_checkin}</span> check-in
                    </span>
                    {esc.pendientes > 0 && (
                      <span className="text-[8px] font-bold" style={{ color: T.orange }}>
                        <span style={{ color: T.orange }}>{esc.pendientes}</span> pendientes
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {listo ? (
                    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
                      style={{ background: T.greenLo, color: T.green, border: `1px solid ${T.green}30` }}>
                      ✓ Listo
                    </span>
                  ) : (
                    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
                      style={{ background: T.orangeLo, color: T.orange, border: `1px solid ${T.orange}30` }}>
                      {esc.pendientes} pend.
                    </span>
                  )}
                  <ChevronRight size={14} style={{ color: T.textDim }} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PasoCompetidoresVentanilla: React.FC<{
  T:        Tema;
  idtorneo: number;
  escuela:  EscuelaResumen;
  onVolver: () => void;
}> = ({ T, idtorneo, escuela, onVolver }) => {
  const [inscritos,   setInscritos]   = useState<CompetidorCheckin[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [procesando,  setProcesando]  = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [descIndiv,   setDescIndiv]   = useState<number | null>(null);
  const [resultado,   setResultado]   = useState<{ exitosos: number; fallidos: number } | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await torneoAreasService.listaCompletaCheckin(idtorneo, escuela.idescuela);
      const pagados = (data.inscritos ?? []).filter(
        i => i.estatus_pago === 'Pagado' || i.estatus_pago === 'pagado'
      );
      setInscritos(pagados);
    } finally { setLoading(false); }
  }, [idtorneo, escuela.idescuela]);

  useEffect(() => { cargar(); }, [cargar]);

  const pendientes = inscritos.filter(i => !i.estatus_checkin);
  const conCheckin = inscritos.filter(i =>  i.estatus_checkin);
  const todoListo  = pendientes.length === 0 && inscritos.length > 0;

  const hacerCheckinLote = async () => {
    if (!pendientes.length) return;
    setProcesando(true);
    try {
      const res = await torneoAreasService.checkinLote(idtorneo, pendientes.map(i => i.idinscripcion));
      setResultado({ exitosos: res.exitosos, fallidos: res.fallidos });
      await cargar();
    } finally { setProcesando(false); }
  };

  const descargarTodos = async () => {
    setDescargando(true);
    try {
      await ventanillaService.descargarGafetesEscuela(
        idtorneo, escuela.idescuela, pendientes.length > 0, escuela.nombreescuela
      );
      await cargar();
    } catch (e: any) {
      console.error('Error descargando gafetes:', e);
    } finally {
      setDescargando(false);
    }
  };

  const descargarIndividual = async (idinscripcion: number) => {
    setDescIndiv(idinscripcion);
    try {
      const url = `/torneos-v2/torneos/${idtorneo}/checkin/${idinscripcion}/gafete-pdf`;
      await descargarPdfAutenticado(url, `Gafete_${idinscripcion}.pdf`);
    } catch (e: any) {
      console.error('Error descargando gafete:', e);
    } finally {
      setDescIndiv(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onVolver}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <ChevronLeft size={16} style={{ color: T.textDim }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.orange }}>
            Ventanilla · Paso 2 de 2
          </p>
          <p className="text-sm font-black uppercase italic tracking-tighter leading-tight" style={{ color: T.text }}>
            {escuela.nombreescuela}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <RefreshCw size={13} style={{ color: T.textDim }} />
        </motion.button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: inscritos.length,  label: 'Total',    color: T.cyan   },
          { val: conCheckin.length, label: 'Check-in', color: T.green  },
          { val: pendientes.length, label: 'Faltan',   color: T.orange },
        ].map(({ val, label, color }) => (
          <div key={label} className="rounded-2xl p-3 text-center"
            style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `2px solid ${color}` }}>
            <p className="text-2xl font-black tracking-tighter" style={{ color }}>{val}</p>
            <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: T.textDim }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Feedback check-in lote */}
      <AnimatePresence>
        {resultado && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{
              background: resultado.fallidos > 0 ? T.orangeLo : T.greenLo,
              border: `1px solid ${resultado.fallidos > 0 ? T.orange : T.green}30`,
            }}>
            {resultado.fallidos > 0
              ? <AlertTriangle size={15} style={{ color: T.orange, flexShrink: 0 }} />
              : <CheckCircle2 size={15} style={{ color: T.green, flexShrink: 0 }} />}
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase italic tracking-tighter"
                style={{ color: resultado.fallidos > 0 ? T.orange : T.green }}>
                {resultado.exitosos} check-in{resultado.exitosos !== 1 ? 's' : ''} registrado{resultado.exitosos !== 1 ? 's' : ''}
              </p>
              {resultado.fallidos > 0 && (
                <p className="text-[9px] font-bold mt-0.5" style={{ color: T.textDim }}>
                  {resultado.fallidos} no se pudieron registrar — verifica el pago
                </p>
              )}
            </div>
            <button onClick={() => setResultado(null)}><X size={12} style={{ color: T.textDim }} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones principales */}
      {!loading && inscritos.length > 0 && (
        <div className="space-y-3">
          {/* BOTÓN ESTRELLA */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={descargarTodos} disabled={descargando}
            className="w-full flex items-center justify-between p-5 rounded-[2rem]"
            style={{
              background: todoListo
                ? `linear-gradient(135deg, ${T.greenLo}, ${T.cyanLo})`
                : `linear-gradient(135deg, ${T.orangeLo}, ${T.redLo})`,
              border: `1px solid ${todoListo ? T.green : T.orange}50`,
            }}>
            <div className="flex items-center gap-4">
              <motion.div
                animate={descargando ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${todoListo ? T.green : T.orange}, ${todoListo ? T.cyan : '#ef4444'})` }}>
                {descargando ? <Loader2 size={22} color="#fff" /> : <Printer size={22} color="#fff" />}
              </motion.div>
              <div className="text-left">
                <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                  {todoListo ? 'Imprimir todos los gafetes' : 'Check-in + imprimir gafetes'}
                </p>
                <p className="text-[8px] font-black uppercase tracking-wider mt-0.5"
                  style={{ color: todoListo ? T.green : T.orange }}>
                  {todoListo
                    ? `${inscritos.length} gafete${inscritos.length !== 1 ? 's' : ''} listos · PDF en un clic`
                    : `${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''} · se registran automáticamente`}
                </p>
              </div>
            </div>
            <FileDown size={18} style={{ color: todoListo ? T.green : T.orange }} />
          </motion.button>

          {/* Solo check-in sin PDF */}
          {pendientes.length > 0 && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={hacerCheckinLote} disabled={procesando}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider"
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: procesando ? T.textDim : T.text }}>
              {procesando
                ? <><Loader2 size={14} className="animate-spin" /> Registrando…</>
                : <><UserCheck size={14} /> Solo hacer check-in ({pendientes.length})</>}
            </motion.button>
          )}
        </div>
      )}

      {/* Lista de competidores */}
      {loading ? (
        <div className="flex justify-center py-10">
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full"
            style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.orange}` }} />
        </div>
      ) : inscritos.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 rounded-[2rem]"
          style={{ background: T.card, border: `1px dashed ${T.border}` }}>
          <Users size={28} style={{ color: T.textDim }} />
          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
            Sin inscritos pagados en esta escuela
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
            Competidores ({inscritos.length})
          </p>
          {inscritos.map((comp, i) => (
            <motion.div key={comp.idinscripcion}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25) }}
              className="flex items-center gap-3 p-3 rounded-[1.5rem]"
              style={{ background: T.card, border: `1px solid ${comp.estatus_checkin ? T.green + '30' : T.border}` }}>
              {/* Avatar */}
              {comp.foto ? (
                <img src={comp.foto} alt="" className="w-10 h-10 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: `1px solid ${T.border}` }} />
              ) : (
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                  style={{ background: `${comp.estatus_checkin ? T.green : T.orange}15`, color: comp.estatus_checkin ? T.green : T.orange }}>
                  {comp.nombre_alumno.charAt(0)}
                </div>
              )}
              {/* Datos — flex-1 con min-w-0 para que truncate funcione */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase italic tracking-tighter leading-tight truncate" style={{ color: T.text }}>
                  {comp.nombre_alumno}
                </p>
                <p className="text-[9px] font-bold mt-0.5 truncate" style={{ color: T.textDim }}>
                  {comp.categoria} · {comp.edad} a · {comp.cinta}
                </p>
                {comp.peso_bascula ? (
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: T.cyan }}>⚖ {comp.peso_bascula} kg</p>
                ) : comp.peso_declarado ? (
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: T.textDim }}>Dec: {comp.peso_declarado} kg</p>
                ) : null}
              </div>
              {/* Acciones — columna compacta */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {comp.estatus_checkin ? (
                  <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
                    style={{ background: T.greenLo, color: T.green, border: `1px solid ${T.green}30` }}>✓ OK</span>
                ) : (
                  <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
                    style={{ background: T.orangeLo, color: T.orange, border: `1px solid ${T.orange}30` }}>Pend.</span>
                )}
                {comp.estatus_checkin && (
                  <motion.button whileTap={{ scale: 0.88 }}
                    onClick={() => descargarIndividual(comp.idinscripcion)}
                    disabled={descIndiv === comp.idinscripcion}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl text-[8px] font-black uppercase"
                    style={{ background: T.cyanLo, color: T.cyan, border: `1px solid ${T.cyan}30` }}>
                    {descIndiv === comp.idinscripcion ? <Loader2 size={9} className="animate-spin" /> : <FileDown size={9} />}
                    PDF
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const TabVentanilla: React.FC<{
  T:        Tema;
  idtorneo: number | null;
}> = ({ T, idtorneo }) => {
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<EscuelaResumen | null>(null);

  if (!idtorneo) return (
    <div className="flex flex-col items-center py-20 gap-4 rounded-[2rem]"
      style={{ background: T.card, border: `1px dashed ${T.border}` }}>
      <Printer size={28} style={{ color: T.textDim }} />
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
        No hay torneos en curso
      </p>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {!escuelaSeleccionada ? (
        <motion.div key="paso1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <PasoEscuela T={T} idtorneo={idtorneo} onSeleccionar={setEscuelaSeleccionada} />
        </motion.div>
      ) : (
        <motion.div key="paso2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <PasoCompetidoresVentanilla
            T={T} idtorneo={idtorneo}
            escuela={escuelaSeleccionada}
            onVolver={() => setEscuelaSeleccionada(null)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const PanelHome: React.FC<{
  T:              Tema;
  torneoActivo:   Torneo | null;
  stats:          CheckinListaCompletaResponse | null;
  user:           any;
  onIrCheckin:    () => void;
  onIrLista:      () => void;
  onIrVentanilla: () => void;
}> = ({ T, torneoActivo, stats, user, onIrCheckin, onIrLista, onIrVentanilla }) => (
  <div className="space-y-6">

    {/* Bienvenida */}
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] p-5"
      style={{
        background: `linear-gradient(135deg, ${T.orangeLo}, ${T.redLo})`,
        border: `1px solid ${T.orange}30`,
      }}>
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ boxShadow: [`0 0 0px ${T.orange}00`, `0 0 20px ${T.orange}60`, `0 0 0px ${T.orange}00`] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 text-xl font-black"
          style={{ background: `linear-gradient(135deg, ${T.orange}, #ef4444)`, color: '#fff' }}>
          {(user?.nombre || user?.username || 'S')[0].toUpperCase()}
        </motion.div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: T.orange }}>
            Staff · TKW System
          </p>
          <p className="text-base font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
            {user?.nombre || user?.username || 'Staff'}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full" style={{ background: T.green }} />
            <span className="text-[8px] font-bold" style={{ color: T.textMid }}>En línea</span>
          </div>
        </div>
      </div>
    </motion.div>

    {/* Torneo activo */}
    {torneoActivo && (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-[1.75rem] p-4"
        style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: T.textDim }}>
          Torneo en curso
        </p>
        <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
          {torneoActivo.nombre}
        </p>
        <p className="text-[8px] font-bold mt-0.5" style={{ color: T.textDim }}>
          {torneoActivo.sede} · {torneoActivo.fecha}
        </p>
      </motion.div>
    )}

    {/* KPIs */}
    {stats && (
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Inscritos"   value={stats.total}       icon={Users}        accent={T.cyan}   accentLo={T.cyanLo}   delay={0.05} T={T} />
        <StatCard label="Con Check-in"      value={stats.con_checkin} icon={UserCheck}    accent={T.green}  accentLo={T.greenLo}  delay={0.1}  T={T} />
        <StatCard label="Pagados/Pendientes" value={stats.pagados}    icon={ClipboardList} accent={T.orange} accentLo={T.orangeLo} delay={0.15} T={T}
          sub={`${stats.pendientes_pago} sin pago`} />
        <StatCard label="Pendientes Check-in" value={stats.pagados - stats.con_checkin}
          icon={Clock} accent={T.yellow} accentLo={T.yellowLo} delay={0.2} T={T}
          sub={stats.pagados - stats.con_checkin > 0 ? 'Por registrar' : 'Al día ✓'} />
      </div>
    )}

    {/* CTAs rápidos */}
    <div className="space-y-3">
      {[
        {
          label: 'Registrar Check-in', sub: 'Báscula + generar QR', icon: UserCheck,
          color: T.orange, colorLo: T.orangeLo, action: onIrCheckin,
        },
        {
          label: 'Ventanilla Gafetes', sub: 'Check-in por escuela · PDF en lote', icon: Printer,
          color: T.violet, colorLo: T.violetLo, action: onIrVentanilla,
        },
        {
          label: 'Ver Lista Completa', sub: 'Estados + descargar gafetes', icon: Users,
          color: T.cyan, colorLo: T.cyanLo, action: onIrLista,
        },
      ].map(({ label, sub, icon: Icon, color, colorLo, action }, i) => (
        <motion.button key={label}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.05 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={action}
          className="w-full flex items-center justify-between p-5 rounded-[2rem]"
          style={{
            background: `linear-gradient(135deg, ${colorLo}, ${T.card})`,
            border: `1px solid ${color}40`,
          }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
              <Icon size={22} color="#fff" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                {label}
              </p>
              <p className="text-[8px] font-black uppercase tracking-wider mt-0.5" style={{ color }}>
                {sub}
              </p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color }} />
        </motion.button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  TAB CHECK-IN — busca un inscrito y registra peso
// ─────────────────────────────────────────────────────────────
const TabCheckin: React.FC<{
  T:          Tema;
  idtorneo:   number | null;
  onRefresh:  () => void;
}> = ({ T, idtorneo, onRefresh }) => {
  const [busqueda,   setBusqueda]   = useState('');
  const [resultados, setResultados] = useState<CompetidorCheckin[]>([]);
  const [buscando,   setBuscando]   = useState(false);
  const [sinPago,    setSinPago]    = useState(false);
  const [seleccionado, setSeleccionado] = useState<CompetidorCheckin | null>(null);
  const [exitoRes,   setExitoRes]   = useState<CheckinResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const buscar = useCallback(async () => {
    if (!idtorneo || !busqueda.trim()) return;
    setBuscando(true); setResultados([]); setSinPago(false);
    try {
      const data = await torneoAreasService.listaCompletaCheckin(idtorneo, undefined, busqueda.trim());
      // Solo mostramos los pagados (pueden hacer check-in)
      const pagados = data.inscritos.filter(i => i.estatus_pago === 'Pagado' || i.estatus_pago === 'pagado');
      setResultados(pagados);
      if (pagados.length === 0) setSinPago(true);
    } catch {
      setSinPago(true);
    } finally {
      setBuscando(false);
    }
  }, [idtorneo, busqueda]);

  const handleSuccess = (res: CheckinResponse) => {
    setSeleccionado(null);
    setExitoRes(res);
    setResultados([]);
    setBusqueda('');
    onRefresh();
  };

  if (!idtorneo) return (
    <div className="flex flex-col items-center py-20 gap-4 rounded-[2rem]"
      style={{ background: T.card, border: `1px dashed ${T.border}` }}>
      <Activity size={28} style={{ color: T.textDim }} />
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
        No hay torneos en curso
      </p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.orange }}>
          Staff · Estación
        </p>
        <p className="text-lg font-black uppercase italic tracking-tighter mt-0.5" style={{ color: T.text }}>
          Check-in & Báscula
        </p>
      </div>

      {/* Buscador */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 rounded-2xl"
          style={{ background: T.card, border: `1px solid ${T.border}`, height: 48 }}>
          <Search size={15} style={{ color: T.textDim, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Nombre, escuela o folio…"
            className="flex-1 bg-transparent text-sm outline-none font-bold"
            style={{ color: T.text }}
          />
          {busqueda && (
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => { setBusqueda(''); setResultados([]); }}>
              <X size={13} style={{ color: T.textDim }} />
            </motion.button>
          )}
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={buscar} disabled={buscando}
          className="w-12 h-12 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${T.orange}, #ef4444)` }}>
          {buscando
            ? <Loader2 size={16} color="#fff" className="animate-spin" />
            : <Search size={16} color="#fff" />}
        </motion.button>
      </div>

      {/* Sin resultados */}
      <AnimatePresence>
        {sinPago && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: T.redLo, border: `1px solid ${T.red}30` }}>
            <XCircle size={16} style={{ color: T.red }} />
            <p className="text-[10px] font-bold" style={{ color: T.red }}>
              No se encontró ningún inscrito pagado con ese criterio.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      <AnimatePresence>
        {resultados.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2">
            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
              {resultados.length} resultado{resultados.length > 1 ? 's' : ''}
            </p>
            {resultados.map((comp, i) => (
              <motion.div key={comp.idinscripcion}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-[1.5rem] cursor-pointer"
                style={{ background: T.card, border: `1px solid ${T.border}` }}
                whileHover={{ borderColor: T.orange + '60', backgroundColor: T.cardHover }}
                onClick={() => !comp.estatus_checkin && setSeleccionado(comp)}>

                {/* Avatar */}
                {comp.foto ? (
                  <img src={comp.foto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover flex-shrink-0"
                    style={{ border: `2px solid ${T.border}` }} />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                    style={{ background: `${T.orange}15`, color: T.orange, border: `2px solid ${T.orange}25` }}>
                    {comp.nombre_alumno.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase italic tracking-tighter truncate" style={{ color: T.text }}>
                    {comp.nombre_alumno}
                  </p>
                  <p className="text-[9px] font-bold mt-0.5 truncate" style={{ color: T.textDim }}>
                    {comp.escuela} · {comp.categoria}
                  </p>
                  <p className="text-[9px] font-bold mt-0.5 truncate" style={{ color: T.textDim }}>
                    {comp.edad} a · {comp.cinta}
                    {comp.peso_declarado ? ` · ${comp.peso_declarado} kg` : ''}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <EstadoBadge checkin={comp.estatus_checkin} tienePago T={T} />
                  {!comp.estatus_checkin && (
                    <motion.div whileTap={{ scale: 0.9 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-wide"
                      style={{ background: T.orangeLo, color: T.orange, border: `1px solid ${T.orange}40` }}>
                      <Weight size={9} /> Pesar
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instrucción inicial */}
      {resultados.length === 0 && !sinPago && !buscando && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center py-16 gap-4 rounded-[2rem]"
          style={{ background: T.card, border: `1px dashed ${T.border}` }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center"
            style={{ background: T.orangeLo, border: `1px solid ${T.orange}30` }}>
            <Search size={28} style={{ color: T.orange }} />
          </motion.div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
              Busca al competidor
            </p>
            <p className="text-[9px] font-bold mt-1" style={{ color: T.textDim }}>
              por nombre, escuela o número de folio
            </p>
          </div>
        </motion.div>
      )}

      {/* Modales */}
      <AnimatePresence>
        {seleccionado && (
          <ModalCheckin
            competidor={seleccionado}
            idtorneo={idtorneo}
            onClose={() => setSeleccionado(null)}
            onSuccess={handleSuccess}
            T={T}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exitoRes && (
          <ModalExito
            res={exitoRes}
            idtorneo={idtorneo}
            onClose={() => setExitoRes(null)}
            T={T}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  TAB LISTA COMPLETA
// ─────────────────────────────────────────────────────────────
type FiltroEstado = 'todos' | 'checkin' | 'pagado' | 'pendiente';

const TabLista: React.FC<{
  T:        Tema;
  idtorneo: number | null;
  stats:    CheckinListaCompletaResponse | null;
  onRefresh: () => void;
}> = ({ T, idtorneo, stats, onRefresh }) => {
  const [inscritos,  setInscritos]  = useState<CompetidorCheckin[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [busqueda,   setBusqueda]   = useState('');
  const [filtro,     setFiltro]     = useState<FiltroEstado>('todos');
  const [descargando, setDescargando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!idtorneo) return;
    setLoading(true);
    try {
      const data = await torneoAreasService.listaCompletaCheckin(idtorneo);
      setInscritos(data.inscritos ?? []);
    } catch {
      setInscritos([]);
    } finally {
      setLoading(false);
    }
  }, [idtorneo]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleRefresh = () => { cargar(); onRefresh(); };

  const filtrados = inscritos.filter(i => {
    const matchTexto = `${i.nombre_alumno} ${i.escuela} ${i.categoria}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const matchFiltro =
      filtro === 'todos'     ? true :
      filtro === 'checkin'   ? i.estatus_checkin :
      filtro === 'pagado'    ? (!i.estatus_checkin && (i.estatus_pago === 'Pagado' || i.estatus_pago === 'pagado')) :
      /* pendiente */           (i.estatus_pago !== 'Pagado' && i.estatus_pago !== 'pagado');
    return matchTexto && matchFiltro;
  });

  const descargarGafete = async (comp: CompetidorCheckin) => {
    if (!idtorneo) return;
    setDescargando(comp.idinscripcion);
    try {
      const url = `/torneos-v2/torneos/${idtorneo}/checkin/${comp.idinscripcion}/gafete-pdf`;
      await descargarPdfAutenticado(url, `Gafete_${comp.nombre_alumno.replace(/ /g,'_')}.pdf`);
    } catch (e: any) {
      console.error('Error descargando gafete:', e);
    } finally {
      setDescargando(null);
    }
  };

  const FILTROS: { id: FiltroEstado; label: string; color: string }[] = [
    { id: 'todos',    label: 'Todos',     color: T.textDim },
    { id: 'checkin',  label: 'Check-in',  color: T.green   },
    { id: 'pagado',   label: 'Pagado',    color: T.orange  },
    { id: 'pendiente',label: 'Pendiente', color: T.red     },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.cyan }}>
            Staff · Registro
          </p>
          <p className="text-lg font-black uppercase italic tracking-tighter mt-0.5" style={{ color: T.text }}>
            Lista Completa
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={handleRefresh}
          className="w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <RefreshCw size={14} style={{ color: T.textDim }} />
        </motion.button>
      </div>

      {/* Resumen rápido */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: stats.total,       label: 'Total',    color: T.cyan   },
            { val: stats.con_checkin, label: 'Check-in', color: T.green  },
            { val: stats.pagados,     label: 'Pagados',  color: T.orange },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `2px solid ${color}` }}>
              <p className="text-2xl font-black tracking-tighter" style={{ color }}>{val}</p>
              <p className="text-[7px] font-black uppercase tracking-widest mt-0.5" style={{ color: T.textDim }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + búsqueda */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 rounded-2xl"
          style={{ background: T.card, border: `1px solid ${T.border}`, height: 44 }}>
          <Search size={14} style={{ color: T.textDim }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar nombre, escuela, categoría…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: T.text }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(({ id, label, color }) => (
            <motion.button key={id} whileTap={{ scale: 0.92 }}
              onClick={() => setFiltro(id)}
              className="h-8 px-3 rounded-xl text-[8px] font-black uppercase tracking-wider"
              style={{
                background: filtro === id ? `${color}18` : T.surface,
                border: `1px solid ${filtro === id ? color + '50' : T.border}`,
                color: filtro === id ? color : T.textDim,
              }}>
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-10">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full"
            style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.cyan}` }} />
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
            {filtrados.length} de {inscritos.length} registros
          </p>

          {filtrados.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 rounded-[2rem]"
              style={{ background: T.card, border: `1px dashed ${T.border}` }}>
              <Filter size={24} style={{ color: T.textDim }} />
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
                Sin resultados
              </p>
            </div>
          )}

          {filtrados.map((comp, i) => {
            const tienePago = comp.estatus_pago === 'Pagado' || comp.estatus_pago === 'pagado';
            const puedeGafete = comp.estatus_checkin;
            return (
              <motion.div key={comp.idinscripcion}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 p-3 rounded-[1.5rem]"
                style={{ background: T.card, border: `1px solid ${T.border}` }}>

                {/* Avatar */}
                {comp.foto ? (
                  <img src={comp.foto} alt="" className="w-10 h-10 rounded-2xl object-cover flex-shrink-0"
                    style={{ border: `1px solid ${T.border}` }} />
                ) : (
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                    style={{
                      background: `${comp.estatus_checkin ? T.green : T.orange}15`,
                      color: comp.estatus_checkin ? T.green : T.orange,
                    }}>
                    {comp.nombre_alumno.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase italic tracking-tighter leading-tight truncate"
                    style={{ color: T.text }}>
                    {comp.nombre_alumno}
                  </p>
                  <p className="text-[9px] font-bold truncate mt-0.5" style={{ color: T.textDim }}>
                    {comp.escuela} · {comp.categoria}
                  </p>
                  {comp.peso_bascula && (
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: T.cyan }}>
                      ⚖ {comp.peso_bascula} kg
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <EstadoBadge checkin={comp.estatus_checkin} tienePago={tienePago} T={T} />
                  {puedeGafete && (
                    <motion.button whileTap={{ scale: 0.88 }}
                      onClick={() => descargarGafete(comp)}
                      disabled={descargando === comp.idinscripcion}
                      className="flex items-center gap-1 px-2 py-1 rounded-xl text-[8px] font-black uppercase"
                      style={{ background: T.cyanLo, color: T.cyan, border: `1px solid ${T.cyan}30` }}>
                      {descargando === comp.idinscripcion
                        ? <Loader2 size={9} className="animate-spin" />
                        : <FileDown size={9} />}
                      PDF
                    </motion.button>
                  )}
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
//  PARTICLE BG
// ─────────────────────────────────────────────────────────────
const ParticleBg: React.FC<{ T: Tema; isDark: boolean }> = ({ T, isDark }) => {
  const particles = React.useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i, size: Math.random() * 2.5 + 1,
      x: Math.random() * 100, y: Math.random() * 100,
      duration: Math.random() * 12 + 8, delay: Math.random() * 6,
    })), []);

  if (!isDark) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: p.id % 3 === 0 ? T.orange : p.id % 3 === 1 ? T.cyan : T.green,
            opacity: 0.25,
          }}
          animate={{ y: [0, -28, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.04]"
        style={{ background: T.orange, filter: 'blur(80px)' }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────
export const StaffTorneoApp: React.FC = () => {
  const { user, logout }          = useAuth();
  const [activeTab, setActiveTab] = useState('panel');
  const [isDark, setIsDark]       = useState(true);
  const [torneos, setTorneos]     = useState<Torneo[]>([]);
  const [idtorneoActivo, setIdtorneoActivo] = useState<number | null>(null);
  const [stats, setStats]         = useState<CheckinListaCompletaResponse | null>(null);
  const [loading, setLoading]     = useState(true);

  const T = isDark ? DARK : LIGHT;

  const torneoActivo = torneos.find(t => t.idtorneo === idtorneoActivo) ?? null;

  const handleLogout = () => { logout(); window.location.href = '/auth/login'; };

  const cargarStats = useCallback(async (idtorneo: number) => {
    try {
      const data = await torneoAreasService.listaCompletaCheckin(idtorneo);
      setStats(data);
    } catch { /* silencioso */ }
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await torneoService.listar();
      const activos = data.filter(t => t.estatus === 2 || t.estatus === 1);
      setTorneos(data);
      if (activos.length > 0) {
        const id = activos[0].idtorneo;
        setIdtorneoActivo(id);
        await cargarStats(id);
      }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [cargarStats]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const PAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
    panel:      { label: 'Panel',             icon: LayoutDashboard },
    checkin:    { label: 'Check-in',          icon: UserCheck       },
    lista:      { label: 'Lista',             icon: Users           },
    ventanilla: { label: 'Ventanilla Gafetes',icon: Printer         },
  };
  const current = PAGE_META[activeTab] ?? PAGE_META['panel'];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: T.bg }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 rounded-full"
        style={{ border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}`,
          boxShadow: `0 0 24px ${T.orange}40` }} />
      <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse" style={{ color: T.textDim }}>
        Cargando panel del staff…
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
                background: `linear-gradient(135deg, ${T.orangeLo}, ${T.redLo})`,
                border: `1px solid ${T.orange}55`,
                boxShadow: `0 0 16px ${T.orange}30`,
              }}>
              <Swords size={18} style={{ color: T.orange }} />
            </motion.div>
            <div>
              <p className="text-xs font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
                TKW System
              </p>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] mt-0.5 leading-none" style={{ color: T.orange }}>
                Staff
              </p>
            </div>
          </div>

          {/* Nombre página */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}
              className="hidden md:flex items-center gap-2">
              <current.icon size={12} style={{ color: T.orange }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: T.textDim }}>
                {current.label}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Selector de torneo si hay varios — oculto en móvil muy pequeño */}
            {torneos.filter(t => t.estatus === 2 || t.estatus === 1).length > 1 && (
              <select
                value={idtorneoActivo ?? ''}
                onChange={e => {
                  const id = Number(e.target.value);
                  setIdtorneoActivo(id);
                  cargarStats(id);
                }}
                className="hidden sm:block h-9 px-2 rounded-xl text-[9px] font-black outline-none max-w-[120px] truncate"
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid }}>
                {torneos.filter(t => t.estatus === 2 || t.estatus === 1).map(t => (
                  <option key={t.idtorneo} value={t.idtorneo}>{t.nombre}</option>
                ))}
              </select>
            )}

            {/* Toggle dark/light */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <AnimatePresence mode="wait">
                {isDark
                  ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Sun size={15} style={{ color: T.yellow }} />
                    </motion.div>
                  : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Moon size={15} style={{ color: T.violet }} />
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>

            {/* User badge — compacto en móvil, expandido en sm+ */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${T.orange}, #ef4444)`, color: '#fff' }}>
                {(user?.nombre || user?.username || 'S')[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[9px] font-black uppercase italic tracking-tighter leading-none max-w-[80px] truncate" style={{ color: T.text }}>
                  {user?.nombre || user?.username || 'Staff'}
                </p>
                <p className="text-[7px] font-bold uppercase tracking-widest mt-0.5 leading-none" style={{ color: T.orange }}>
                  Staff
                </p>
              </div>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
            </div>

            {/* Logout */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleLogout}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.redLo)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = T.surface)}>
              <LogOut size={15} style={{ color: T.textDim }} />
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
                torneoActivo={torneoActivo}
                stats={stats}
                user={user}
                onIrCheckin={() => setActiveTab('checkin')}
                onIrLista={() => setActiveTab('lista')}
                onIrVentanilla={() => setActiveTab('ventanilla')}
              />
            )}

            {activeTab === 'checkin' && (
              <TabCheckin
                T={T}
                idtorneo={idtorneoActivo}
                onRefresh={() => idtorneoActivo && cargarStats(idtorneoActivo)}
              />
            )}

            {activeTab === 'lista' && (
              <TabLista
                T={T}
                idtorneo={idtorneoActivo}
                stats={stats}
                onRefresh={() => idtorneoActivo && cargarStats(idtorneoActivo)}
              />
            )}

            {activeTab === 'ventanilla' && (
              <TabVentanilla T={T} idtorneo={idtorneoActivo} />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAV ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} T={T} />
    </motion.div>
  );
};

export default StaffTorneoApp;