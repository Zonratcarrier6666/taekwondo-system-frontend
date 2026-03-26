// ============================================================
//  src/views/staff/VentanillaEscuela.tsx
//
//  Flujo ventanilla del staff el día del torneo:
//    1. Staff busca o selecciona la escuela del profe
//    2. Ve la lista de sus competidores con estado (pagado / check-in)
//    3. Con un botón hace check-in en lote + descarga todos los
//       gafetes en un solo PDF
//    4. También puede hacer check-in / gafete individual por fila
//
//  Props:
//    idtorneo  : number   — torneo activo
//    T         : Tema     — objeto de colores del sistema
//    onVolver  : () => void
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, School, Users, UserCheck, FileDown,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  AlertTriangle, Weight, Printer, X, Check,
  RefreshCw, Clock,
} from 'lucide-react';

import {
  torneoAreasService,
  type CompetidorCheckin,
  type CheckinResponse,
} from '../../services/torneo_areas.service';

// ─── Tipo del tema (igual que el resto del sistema) ──────────
type Tema = {
  bg: string; surface: string; card: string; cardHover: string;
  border: string; violet: string; violetLo: string; violetHi: string;
  cyan: string; cyanLo: string; green: string; greenLo: string;
  orange: string; orangeLo: string; red: string; redLo: string;
  yellow: string; yellowLo: string; text: string; textMid: string;
  textDim: string; navBg: string;
};

// ─── Tipo local para escuela ──────────────────────────────────
interface EscuelaResumen {
  idescuela:       number;
  nombreescuela:   string;
  total_inscritos: number;
  con_checkin:     number;
  pendientes:      number;
}

// ─────────────────────────────────────────────────────────────
//  SERVICE CALLS (usando torneoAreasService + fetch directo
//  para los endpoints nuevos)
// ─────────────────────────────────────────────────────────────
import api from '../../api/axios';

const ventanillaService = {
  /** Lista escuelas participantes del torneo */
  listarEscuelas: async (idtorneo: number): Promise<EscuelaResumen[]> => {
    const { data } = await api.get(`/torneos-v2/torneos/${idtorneo}/checkin/escuelas`);
    return data.escuelas ?? [];
  },

  /** PDF con todos los gafetes de la escuela (y check-in automático si hacer_checkin=true) */
  gafetesEscuelaPdfUrl: (
    idtorneo:     number,
    idescuela:    number,
    hacerCheckin: boolean,
  ): string =>
    `${api.defaults.baseURL}/torneos-v2/torneos/${idtorneo}/checkin/gafetes-escuela` +
    `?idescuela=${idescuela}&hacer_checkin=${hacerCheckin}`,
};

// ─────────────────────────────────────────────────────────────
//  BADGE estado
// ─────────────────────────────────────────────────────────────
const Badge: React.FC<{ checkin: boolean; T: Tema }> = ({ checkin, T }) =>
  checkin ? (
    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
      style={{ background: T.greenLo, color: T.green, border: `1px solid ${T.green}30` }}>
      ✓ OK
    </span>
  ) : (
    <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-xl whitespace-nowrap"
      style={{ background: T.orangeLo, color: T.orange, border: `1px solid ${T.orange}30` }}>
      Pend.
    </span>
  );

// ─────────────────────────────────────────────────────────────
//  PASO 1 — Seleccionar escuela
// ─────────────────────────────────────────────────────────────
const PasoEscuela: React.FC<{
  T:          Tema;
  idtorneo:   number;
  onSeleccionar: (esc: EscuelaResumen) => void;
}> = ({ T, idtorneo, onSeleccionar }) => {
  const [escuelas,  setEscuelas]  = useState<EscuelaResumen[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [busqueda,  setBusqueda]  = useState('');
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
          Ventanilla · Paso 1
        </p>
        <p className="text-lg font-black uppercase italic tracking-tighter mt-0.5" style={{ color: T.text }}>
          ¿De qué escuela son?
        </p>
        <p className="text-[9px] font-bold mt-1" style={{ color: T.textDim }}>
          Selecciona la escuela del profesor para ver y registrar a sus competidores.
        </p>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ background: T.card, border: `1px solid ${T.border}`, height: 48 }}>
        <Search size={15} style={{ color: T.textDim }} />
        <input
          ref={inputRef}
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar escuela…"
          className="flex-1 bg-transparent text-sm outline-none font-bold"
          style={{ color: T.text }}
        />
        {busqueda && (
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setBusqueda('')}>
            <X size={13} style={{ color: T.textDim }} />
          </motion.button>
        )}
      </div>

      {/* Lista */}
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
            const todoCheckin = esc.pendientes === 0;
            const accent = todoCheckin ? T.green : T.orange;
            return (
              <motion.button key={esc.idescuela}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSeleccionar(esc)}
                className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] text-left"
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = accent + '60')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>

                {/* Ícono */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                  <School size={18} style={{ color: accent }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black uppercase italic tracking-tighter"
                    style={{ color: T.text }}>
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

                {/* Indicador */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {todoCheckin ? (
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

// ─────────────────────────────────────────────────────────────
//  PASO 2 — Competidores de la escuela + check-in + gafetes
// ─────────────────────────────────────────────────────────────
const PasoCompetidores: React.FC<{
  T:         Tema;
  idtorneo:  number;
  escuela:   EscuelaResumen;
  onVolver:  () => void;
}> = ({ T, idtorneo, escuela, onVolver }) => {
  const [inscritos,    setInscritos]    = useState<CompetidorCheckin[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [procesando,   setProcesando]   = useState(false);   // check-in lote
  const [descargando,  setDescargando]  = useState(false);   // PDF lote
  const [descIndiv,    setDescIndiv]    = useState<number | null>(null); // PDF individual
  const [resultado,    setResultado]    = useState<{
    exitosos: number; fallidos: number;
  } | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await torneoAreasService.listaCompletaCheckin(
        idtorneo, escuela.idescuela
      );
      // Solo pagados
      const pagados = (data.inscritos ?? []).filter(
        i => i.estatus_pago === 'Pagado' || i.estatus_pago === 'pagado'
      );
      setInscritos(pagados);
    } finally {
      setLoading(false);
    }
  }, [idtorneo, escuela.idescuela]);

  useEffect(() => { cargar(); }, [cargar]);

  const pendientes  = inscritos.filter(i => !i.estatus_checkin);
  const conCheckin  = inscritos.filter(i => i.estatus_checkin);
  const todoListo   = pendientes.length === 0 && inscritos.length > 0;

  // ── Check-in en lote (solo los pendientes) ──────────────────
  const hacerCheckinLote = async () => {
    if (pendientes.length === 0) return;
    setProcesando(true);
    try {
      const res = await torneoAreasService.checkinLote(
        idtorneo,
        pendientes.map(i => i.idinscripcion),
      );
      setResultado({ exitosos: res.exitosos, fallidos: res.fallidos });
      await cargar();
    } finally {
      setProcesando(false);
    }
  };

  // ── Descargar PDF de todos (back hace check-in si falta) ────
  const descargarTodos = () => {
    setDescargando(true);
    const url = ventanillaService.gafetesEscuelaPdfUrl(
      idtorneo, escuela.idescuela, pendientes.length > 0
    );
    window.open(url, '_blank');
    setTimeout(() => { setDescargando(false); cargar(); }, 1500);
  };

  // ── Descargar gafete individual ─────────────────────────────
  const descargarIndividual = (idinscripcion: number) => {
    setDescIndiv(idinscripcion);
    const url = torneoAreasService.gafetePdfUrl(idtorneo, idinscripcion);
    window.open(url, '_blank');
    setTimeout(() => setDescIndiv(null), 1000);
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
            Ventanilla · Paso 2
          </p>
          <p className="text-sm font-black uppercase italic tracking-tighter leading-tight"
            style={{ color: T.text }}>
            {escuela.nombreescuela}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <RefreshCw size={13} style={{ color: T.textDim }} />
        </motion.button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { val: inscritos.length, label: 'Total',    color: T.cyan   },
          { val: conCheckin.length, label: 'Check-in', color: T.green  },
          { val: pendientes.length, label: 'Faltan',   color: T.orange },
        ].map(({ val, label, color }) => (
          <div key={label} className="rounded-2xl p-3 text-center"
            style={{ background: T.card, border: `1px solid ${T.border}`, borderTop: `2px solid ${color}` }}>
            <p className="text-2xl font-black tracking-tighter" style={{ color }}>{val}</p>
            <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: T.textDim }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Feedback resultado check-in lote */}
      <AnimatePresence>
        {resultado && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{
              background: resultado.fallidos > 0 ? T.orangeLo : T.greenLo,
              border: `1px solid ${resultado.fallidos > 0 ? T.orange : T.green}30`,
            }}>
            {resultado.fallidos > 0
              ? <AlertTriangle size={15} style={{ color: T.orange, flexShrink: 0 }} />
              : <CheckCircle2 size={15} style={{ color: T.green, flexShrink: 0 }} />}
            <div>
              <p className="text-[10px] font-black uppercase italic tracking-tighter"
                style={{ color: resultado.fallidos > 0 ? T.orange : T.green }}>
                {resultado.exitosos} check-in{resultado.exitosos > 1 ? 's' : ''} registrado{resultado.exitosos > 1 ? 's' : ''}
              </p>
              {resultado.fallidos > 0 && (
                <p className="text-[9px] font-bold mt-0.5" style={{ color: T.textDim }}>
                  {resultado.fallidos} no se pudieron registrar (revisa el pago)
                </p>
              )}
            </div>
            <button onClick={() => setResultado(null)} className="ml-auto">
              <X size={12} style={{ color: T.textDim }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTONES PRINCIPALES ── */}
      {!loading && inscritos.length > 0 && (
        <div className="space-y-3">

          {/* BOTÓN ESTRELLA: check-in en lote + descarga todos */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={descargarTodos}
            disabled={descargando}
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
                style={{
                  background: `linear-gradient(135deg, ${todoListo ? T.green : T.orange}, ${todoListo ? T.cyan : '#ef4444'})`,
                }}>
                {descargando
                  ? <Loader2 size={22} color="#fff" />
                  : <Printer size={22} color="#fff" />}
              </motion.div>
              <div className="text-left">
                <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                  {todoListo ? 'Imprimir todos los gafetes' : 'Check-in + imprimir gafetes'}
                </p>
                <p className="text-[8px] font-black uppercase tracking-wider mt-0.5"
                  style={{ color: todoListo ? T.green : T.orange }}>
                  {todoListo
                    ? `${inscritos.length} gafete${inscritos.length > 1 ? 's' : ''} listos`
                    : `${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''} · se registran automáticamente`}
                </p>
              </div>
            </div>
            <FileDown size={18} style={{ color: todoListo ? T.green : T.orange }} />
          </motion.button>

          {/* Check-in lote sin descargar (si hay pendientes y ya quieren el PDF separado) */}
          {pendientes.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={hacerCheckinLote}
              disabled={procesando}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: procesando ? T.textDim : T.text,
              }}>
              {procesando
                ? <><Loader2 size={14} className="animate-spin" /> Registrando…</>
                : <><UserCheck size={14} /> Solo hacer check-in ({pendientes.length})</>}
            </motion.button>
          )}
        </div>
      )}

      {/* ── LISTA DE COMPETIDORES ── */}
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
              style={{
                background: T.card,
                border: `1px solid ${comp.estatus_checkin ? T.green + '30' : T.border}`,
              }}>

              {/* Avatar */}
              {comp.foto ? (
                <img src={comp.foto} alt=""
                  className="w-10 h-10 rounded-2xl object-cover flex-shrink-0"
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

              {/* Datos */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase italic tracking-tighter leading-tight truncate"
                  style={{ color: T.text }}>
                  {comp.nombre_alumno}
                </p>
                <p className="text-[9px] font-bold mt-0.5 truncate" style={{ color: T.textDim }}>
                  {comp.categoria} · {comp.edad} a · {comp.cinta}
                </p>
                {comp.peso_bascula ? (
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: T.cyan }}>
                    ⚖ {comp.peso_bascula} kg
                  </p>
                ) : comp.peso_declarado ? (
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: T.textDim }}>
                    Dec: {comp.peso_declarado} kg
                  </p>
                ) : null}
              </div>

              {/* Acciones */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <Badge checkin={comp.estatus_checkin} T={T} />
                {comp.estatus_checkin && (
                  <motion.button whileTap={{ scale: 0.88 }}
                    onClick={() => descargarIndividual(comp.idinscripcion)}
                    disabled={descIndiv === comp.idinscripcion}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl text-[8px] font-black uppercase"
                    style={{ background: T.cyanLo, color: T.cyan, border: `1px solid ${T.cyan}30` }}>
                    {descIndiv === comp.idinscripcion
                      ? <Loader2 size={9} className="animate-spin" />
                      : <FileDown size={9} />}
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

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL — VentanillaEscuela
// ─────────────────────────────────────────────────────────────
interface VentanillaEscuelaProps {
  idtorneo: number;
  T:        Tema;
  onVolver?: () => void;
}

const VentanillaEscuela: React.FC<VentanillaEscuelaProps> = ({
  idtorneo,
  T,
  onVolver,
}) => {
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<EscuelaResumen | null>(null);

  return (
    <div className="space-y-5 max-w-lg mx-auto">

      {/* Header global */}
      <div className="flex items-center gap-3">
        {onVolver && !escuelaSeleccionada && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
            className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <ChevronLeft size={16} style={{ color: T.textDim }} />
          </motion.button>
        )}
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: T.orange }}>
            Staff · Ventanilla
          </p>
          <p className="text-lg font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
            Entrega de Gafetes
          </p>
        </div>
      </div>

      {/* Pasos */}
      <AnimatePresence mode="wait">
        {!escuelaSeleccionada ? (
          <motion.div key="paso1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}>
            <PasoEscuela
              T={T}
              idtorneo={idtorneo}
              onSeleccionar={setEscuelaSeleccionada}
            />
          </motion.div>
        ) : (
          <motion.div key="paso2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}>
            <PasoCompetidores
              T={T}
              idtorneo={idtorneo}
              escuela={escuelaSeleccionada}
              onVolver={() => setEscuelaSeleccionada(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VentanillaEscuela;