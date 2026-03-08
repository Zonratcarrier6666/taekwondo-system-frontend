// ============================================================
//  src/views/juez/EscaneoQRView.tsx
//  Juez escanea QR del gafete → ve pantalla Juan vs Pepe
//  → registra ganador (competencia: puntos / local: botón)
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Swords, Trophy, AlertTriangle, CheckCircle2,
  X, ChevronLeft, Loader2, RotateCcw, Shield, Zap,
  Clock, Award, Ban, Minus, Plus,
} from 'lucide-react';

import {
  torneoAreasService,
  type EscaneoQRResult,
} from '../../services/torneo_areas.service';

// ─────────────────────────────────────────────────────────────
//  TEMA — recibe T del dashboard padre o usa defaults
// ─────────────────────────────────────────────────────────────
const DEFAULT_T = {
  bg: '#06060a', surface: '#0d0d14', card: '#111118',
  border: '#1e1e2e', violet: '#7c3aed', violetLo: '#7c3aed22',
  violetHi: '#a855f7', cyan: '#06b6d4', cyanLo: '#06b6d422',
  green: '#10b981', greenLo: '#10b98122', orange: '#f97316',
  orangeLo: '#f9731622', red: '#ef4444', redLo: '#ef444422',
  yellow: '#eab308', text: '#e2e8f0', textMid: '#94a3b8', textDim: '#475569',
};
type Tema = typeof DEFAULT_T;

// ─────────────────────────────────────────────────────────────
//  PANTALLA DE COMBATE — Juan vs Pepe
// ─────────────────────────────────────────────────────────────
const PantallaCombate: React.FC<{
  comp_a:      EscaneoQRResult;
  comp_b:      EscaneoQRResult | null;
  idcombate:   number | null;
  tipoTorneo:  string;
  onGanador:   (idinscA: number, idinscB: number, ganadorId: number) => void;
  onReset:     () => void;
  registrando: boolean;
  T: Tema;
}> = ({ comp_a, comp_b, idcombate, tipoTorneo, onGanador, onReset, registrando, T }) => {
  const [puntosA, setPuntosA] = useState(0);
  const [puntosB, setPuntosB] = useState(0);
  const esLocal = tipoTorneo === 'local';

  const handleGanador = (ganadorId: number) => {
    if (!comp_a.idinscripcion || !comp_b?.idinscripcion) return;
    onGanador(comp_a.idinscripcion, comp_b.idinscripcion, ganadorId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      {/* Header combate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: '#f9731615', border: '1px solid #f9731630' }}>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} />
          <span className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: '#f97316' }}>
            {idcombate ? `Combate #${idcombate}` : 'Combate activo'}
          </span>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
          style={{
            background: esLocal ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.12)',
            color: esLocal ? '#8b5cf6' : '#06b6d4',
            border: `1px solid ${esLocal ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.25)'}`,
          }}>
          {esLocal ? 'Local' : 'Competencia'}
        </span>
      </div>

      {/* Tarjetas de los dos competidores */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { data: comp_a, puntos: puntosA, setPuntos: setPuntosA, lado: 'A' },
          { data: comp_b,  puntos: puntosB, setPuntos: setPuntosB, lado: 'B' },
        ] as const).map(({ data, puntos, setPuntos, lado }) => (
          <motion.div key={lado}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: lado === 'A' ? 0 : 0.1 }}
            className="rounded-[1.75rem] p-4 flex flex-col items-center gap-3"
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              minHeight: 200,
            }}>

            {/* Foto / avatar */}
            {data?.foto ? (
              <img src={data.foto} alt=""
                className="w-16 h-16 rounded-2xl object-cover"
                style={{ border: `2px solid ${T.border}` }} />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                style={{
                  background: `${lado === 'A' ? T.cyan : '#06b6d4'}18`,
                  color: lado === 'A' ? T.cyan : '#06b6d4',
                  border: `2px solid ${lado === 'A' ? T.cyan : '#06b6d4'}25`,
                }}>
                {data?.nombre_alumno?.charAt(0) ?? '?'}
              </div>
            )}

            {/* Nombre */}
            <div className="text-center">
              <p className="text-[11px] font-black uppercase italic tracking-tighter leading-tight"
                style={{ color: T.text }}>
                {data?.nombre_alumno ?? '—'}
              </p>
              <p className="text-[8px] font-bold mt-0.5" style={{ color: T.textDim }}>
                {data?.escuela ?? ''}
              </p>
              {data?.cinta && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase"
                  style={{
                    background: `${data.color_cinta || '#888'}18`,
                    color: data.color_cinta || '#888',
                    border: `1px solid ${data.color_cinta || '#888'}30`,
                  }}>
                  {data.cinta}
                </span>
              )}
            </div>

            {/* Puntos (solo modalidad competencia) */}
            {!esLocal && (
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setPuntos(Math.max(0, puntos - 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <Minus size={12} style={{ color: T.textDim }} />
                </motion.button>
                <motion.span
                  key={puntos}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  className="text-2xl font-black w-10 text-center"
                  style={{ color: T.text }}>
                  {puntos}
                </motion.span>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setPuntos(puntos + 1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${T.cyan}15`, border: `1px solid ${T.cyan}30` }}>
                  <Plus size={12} style={{ color: T.cyan }} />
                </motion.button>
              </div>
            )}

            {/* Botón ganador */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => data?.idinscripcion && handleGanador(data.idinscripcion)}
              disabled={registrando || (!esLocal && puntosA === puntosB && puntosA > 0) || !data}
              className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
              style={{
                background: lado === 'A'
                  ? `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`
                  : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#fff',
                opacity: registrando ? 0.6 : 1,
              }}>
              {registrando
                ? <Loader2 size={12} className="animate-spin" />
                : <><Trophy size={11} /> Ganó</>}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* VS */}
      <div className="flex items-center justify-center -mt-1">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-4 py-2 rounded-2xl"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <span className="text-sm font-black uppercase tracking-widest"
            style={{ color: T.textDim }}>VS</span>
        </motion.div>
      </div>

      {/* Advertencia empate */}
      {!esLocal && puntosA > 0 && puntosA === puntosB && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-2xl"
          style={{ background: '#f9731615', border: '1px solid #f9731630' }}>
          <AlertTriangle size={13} color="#f97316" />
          <span className="text-[9px] font-bold" style={{ color: '#f97316' }}>
            No puede haber empate. Ajusta los puntos.
          </span>
        </motion.div>
      )}

      {/* Reiniciar */}
      <motion.button whileTap={{ scale: 0.95 }} onClick={onReset}
        className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>
        <RotateCcw size={12} /> Escanear otro QR
      </motion.button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  INPUT QR (manual o simulación de cámara)
// ─────────────────────────────────────────────────────────────
const InputQR: React.FC<{
  onEscanear: (token: string) => void;
  cargando:   boolean;
  idarea:     number | null;
  T: Tema;
}> = ({ onEscanear, cargando, idarea, T }) => {
  const [token, setToken] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-foco para escáneres físicos (actúan como teclado)
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => {
    if (token.trim()) {
      onEscanear(token.trim());
      setToken('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Animación QR */}
      <div className="flex justify-center py-6">
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-28 h-28 rounded-[2rem] flex items-center justify-center"
          style={{ background: `${T.cyan}12`, border: `2px solid ${T.cyan}30` }}>
          <QrCode size={52} style={{ color: T.cyan }} />
          {/* Línea de escaneo */}
          <motion.div
            animate={{ top: ['20%', '80%', '20%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-4 right-4 h-0.5 rounded-full"
            style={{ background: T.cyan, boxShadow: `0 0 8px ${T.cyan}` }} />
        </motion.div>
      </div>

      <p className="text-center text-[10px] font-black uppercase tracking-[0.2em]"
        style={{ color: T.textDim }}>
        Escanea o ingresa el código QR
      </p>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Token QR del gafete..."
          className="flex-1 h-12 px-4 rounded-2xl text-sm font-bold outline-none"
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            color: T.text,
          }}
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleSubmit}
          disabled={cargando || !token.trim()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: T.cyan,
            opacity: !token.trim() ? 0.5 : 1,
          }}>
          {cargando
            ? <Loader2 size={16} color="#fff" className="animate-spin" />
            : <Zap size={16} color="#fff" />}
        </motion.button>
      </div>

      {idarea && (
        <div className="flex items-center gap-2 p-3 rounded-2xl"
          style={{ background: `${T.cyan}08`, border: `1px solid ${T.cyan}20` }}>
          <Shield size={12} style={{ color: T.cyan }} />
          <span className="text-[9px] font-bold" style={{ color: T.textDim }}>
            Área asignada: <strong style={{ color: T.cyan }}>#{idarea}</strong>
            {' '}— Los QR de otras áreas mostrarán advertencia.
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  RESULTADO CARD (éxito / error de escaneo)
// ─────────────────────────────────────────────────────────────
const ResultadoCard: React.FC<{
  resultado: EscaneoQRResult;
  onDismiss: () => void;
}> = ({ resultado, onDismiss }) => {
  const ok = resultado.valido && resultado.en_area_correcta !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: ok ? '#10b98112' : '#ef444412',
        border: `1px solid ${ok ? '#10b98130' : '#ef444430'}`,
      }}>
      {ok ? (
        <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
      ) : (
        resultado.valido === false ? (
          <Ban size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
        ) : (
          <AlertTriangle size={18} color="#f97316" style={{ flexShrink: 0, marginTop: 1 }} />
        )
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase italic tracking-tighter"
          style={{ color: ok ? '#10b981' : resultado.valido === false ? '#ef4444' : '#f97316' }}>
          {resultado.mensaje}
        </p>
        {resultado.area_correcta && (
          <p className="text-[9px] font-bold mt-1" style={{ color: T.textDim }}>
            Redirigir a: <strong>{resultado.area_correcta}</strong>
          </p>
        )}
        {resultado.lugar_obtenido && (
          <p className="text-[9px] font-bold mt-1" style={{ color: '#fbbf24' }}>
            🏅 Lugar obtenido: {resultado.lugar_obtenido}°
          </p>
        )}
      </div>
      <button onClick={onDismiss}>
        <X size={13} style={{ color: T.textDim }} />
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
interface EscaneoQRViewProps {
  idtorneo:  number;
  idarea?:   number;
  onVolver?: () => void;
  T?:        Tema;
}

const EscaneoQRView: React.FC<EscaneoQRViewProps> = ({
  idtorneo,
  idarea,
  onVolver,
  T: TProp,
}) => {
  const T = TProp ?? DEFAULT_T;
  const [fase, setFase] = useState<
    'scan_a' | 'scan_b' | 'combate' | 'resultado_final'
  >('scan_a');
  const [cargando,   setCargando]   = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [compA,      setCompA]      = useState<EscaneoQRResult | null>(null);
  const [compB,      setCompB]      = useState<EscaneoQRResult | null>(null);
  const [ultimoScan, setUltimoScan] = useState<EscaneoQRResult | null>(null);
  const [idcombate,  setIdcombate]  = useState<number | null>(null);
  const [resultadoFinal, setResultadoFinal] = useState<{
    ganador: string; esLocal: boolean; lugar?: number;
  } | null>(null);
  const [historial, setHistorial]   = useState<
    { nombre: string; resultado: 'victoria' | 'derrota' | 'bye' }[]
  >([]);

  const tipoTorneo = compA?.tipo_torneo ?? 'competencia';

  const handleEscanear = async (token: string) => {
    setCargando(true);
    setUltimoScan(null);
    try {
      const res = await torneoAreasService.escanearQR(token, idarea);

      if (!res.valido) {
        setUltimoScan(res);
        return;
      }

      if (!res.en_area_correcta && res.en_area_correcta !== null) {
        // Área incorrecta — mostrar advertencia pero no avanzar
        setUltimoScan(res);
        return;
      }

      if (fase === 'scan_a') {
        setCompA(res);
        // Si el competidor ya tiene combate activo asignado, tomar ese idcombate
        if (res.combate_activo?.idcombate) {
          setIdcombate(res.combate_activo.idcombate);
        }
        setFase('scan_b');
      } else if (fase === 'scan_b') {
        // Verificar que no sea el mismo que A
        if (res.idinscripcion === compA?.idinscripcion) {
          setUltimoScan({
            ...res,
            valido: false,
            mensaje: '⚠️ Este es el mismo competidor que ya escaneaste. Escanea al rival.',
          });
          return;
        }
        setCompB(res);
        setFase('combate');
      }
    } catch (e: any) {
      setUltimoScan({
        ok: false, valido: false, en_area_correcta: null,
        nombre_alumno: null, foto: null, escuela: null,
        cinta: null, color_cinta: null, idinscripcion: null,
        tipo_torneo: null, num_combates_realizados: null, max_combates: null,
        mensaje: e?.response?.data?.detail ?? 'Error al escanear el QR',
        area_correcta: null, area_escaneada: null, combate_activo: null,
      });
    } finally {
      setCargando(false);
    }
  };

  const handleGanador = async (
    idinscA: number,
    idinscB: number,
    ganadorId: number,
  ) => {
    if (!idcombate) {
      setUltimoScan({
        ok: false, valido: false, en_area_correcta: null,
        nombre_alumno: null, foto: null, escuela: null,
        cinta: null, color_cinta: null, idinscripcion: null,
        tipo_torneo: null, num_combates_realizados: null, max_combates: null,
        mensaje: 'No hay combate asignado. Asigna el combate desde el panel de áreas.',
        area_correcta: null, area_escaneada: null, combate_activo: null,
      });
      return;
    }

    setRegistrando(true);
    try {
      if (tipoTorneo === 'local') {
        await torneoAreasService.resultadoLocal(idcombate, ganadorId);
      } else {
        // En competencia, calculamos puntos automáticamente desde la UI
        // el backend también acepta el ganador directamente en resultado-local
        await torneoAreasService.resultadoLocal(idcombate, ganadorId);
      }

      const perdedorId = ganadorId === idinscA ? idinscB : idinscA;
      const ganadorNombre = ganadorId === idinscA
        ? compA?.nombre_alumno : compB?.nombre_alumno;

      // Invalidar QR del perdedor
      await torneoAreasService.invalidarQR(perdedorId);

      // Actualizar historial
      setHistorial(prev => [
        { nombre: ganadorNombre ?? 'Desconocido', resultado: 'victoria' },
        ...prev.slice(0, 9),
      ]);

      setResultadoFinal({ ganador: ganadorNombre ?? '', esLocal: tipoTorneo === 'local' });
      setFase('resultado_final');
    } catch (e: any) {
      setUltimoScan({
        ok: false, valido: false, en_area_correcta: null,
        nombre_alumno: null, foto: null, escuela: null,
        cinta: null, color_cinta: null, idinscripcion: null,
        tipo_torneo: null, num_combates_realizados: null, max_combates: null,
        mensaje: e?.response?.data?.detail ?? 'Error al registrar resultado',
        area_correcta: null, area_escaneada: null, combate_activo: null,
      });
    } finally {
      setRegistrando(false);
    }
  };

  const reset = () => {
    setFase('scan_a');
    setCompA(null);
    setCompB(null);
    setUltimoScan(null);
    setIdcombate(null);
    setResultadoFinal(null);
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        {onVolver && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
            className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <ChevronLeft size={16} style={{ color: T.textDim }} />
          </motion.button>
        )}
        <div className="flex-1">
          <p className="text-sm font-black uppercase italic tracking-tighter"
            style={{ color: T.text }}>
            {fase === 'scan_a' && 'Escanear Competidor A'}
            {fase === 'scan_b' && 'Escanear Competidor B'}
            {fase === 'combate' && '🥊 Combate'}
            {fase === 'resultado_final' && '🏆 Resultado'}
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: T.textDim }}>
            {idarea ? `Área #${idarea}` : 'Sin área asignada'} · Torneo #{idtorneo}
          </p>
        </div>

        {/* Paso */}
        <div className="flex items-center gap-1">
          {['scan_a', 'scan_b', 'combate'].map((f, i) => (
            <div key={f} className="w-2 h-2 rounded-full"
              style={{
                background: ['scan_a', 'scan_b', 'combate', 'resultado_final'].indexOf(fase) >= i
                  ? T.cyan : T.border,
              }} />
          ))}
        </div>
      </div>

      {/* Hint del paso actual */}
      {(fase === 'scan_a' || fase === 'scan_b') && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-2xl"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: fase === 'scan_a' ? `${T.violet}15` : `${T.cyan}15`,
              border: `1px solid ${fase === 'scan_a' ? T.violet + '30' : T.cyan + '30'}`,
            }}>
            <span className="text-xs font-black"
              style={{ color: fase === 'scan_a' ? T.cyan : '#06b6d4' }}>
              {fase === 'scan_a' ? 'A' : 'B'}
            </span>
          </div>
          <p className="text-[9px] font-bold" style={{ color: T.textDim }}>
            {fase === 'scan_a'
              ? 'Escanea el QR del primer competidor'
              : `${compA?.nombre_alumno} listo. Ahora escanea al rival.`}
          </p>
        </motion.div>
      )}

      {/* Alerta último escaneo */}
      <AnimatePresence>
        {ultimoScan && (
          <ResultadoCard resultado={ultimoScan} onDismiss={() => setUltimoScan(null)} />
        )}
      </AnimatePresence>

      {/* CONTENIDO POR FASE */}
      <AnimatePresence mode="wait">

        {(fase === 'scan_a' || fase === 'scan_b') && (
          <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InputQR onEscanear={handleEscanear} cargando={cargando} idarea={idarea ?? null} T={T} />
          </motion.div>
        )}

        {fase === 'combate' && compA && compB && (
          <motion.div key="combate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PantallaCombate
              comp_a={compA}
              comp_b={compB}
              idcombate={idcombate}
              tipoTorneo={tipoTorneo}
              onGanador={handleGanador}
              onReset={reset}
              registrando={registrando}
              T={T}
            />
          </motion.div>
        )}

        {fase === 'resultado_final' && resultadoFinal && (
          <motion.div key="final"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-8">

            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-[2rem] flex items-center justify-center"
              style={{ background: `${T.yellow}15`, border: `2px solid ${T.yellow}40` }}>
              <Trophy size={48} color="#fbbf24" />
            </motion.div>

            <div className="text-center space-y-2">
              <p className="text-[8px] font-black uppercase tracking-widest"
                style={{ color: T.textDim }}>
                🏆 Ganador
              </p>
              <p className="text-xl font-black uppercase italic tracking-tighter"
                style={{ color: T.text }}>
                {resultadoFinal.ganador}
              </p>
              <p className="text-[9px] font-bold" style={{ color: T.textDim }}>
                QR del perdedor invalidado. Resultado guardado.
              </p>
            </div>

            <motion.button whileTap={{ scale: 0.95 }} onClick={reset}
              className="flex items-center gap-2 px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider"
              style={{ background: T.cyan, color: '#fff' }}>
              <QrCode size={14} /> Siguiente Combate
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Historial rápido */}
      {historial.length > 0 && (
        <div className="rounded-[1.5rem] p-4 space-y-2"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <p className="text-[8px] font-black uppercase tracking-widest mb-3"
            style={{ color: T.textDim }}>
            Historial de este área
          </p>
          {historial.slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <Trophy size={10} color="#fbbf24" />
              <span className="text-[9px] font-bold" style={{ color: T.text }}>
                {h.nombre}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EscaneoQRView;