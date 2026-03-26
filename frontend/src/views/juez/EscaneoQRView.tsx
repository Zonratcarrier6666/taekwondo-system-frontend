// ============================================================
//  src/views/juez/EscaneoQRView.tsx  — v2
//  Juez escanea QR del gafete → ve pantalla Juan vs Pepe
//  → registra ganador · maneja área incorrecta · descalifica
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Trophy, AlertTriangle, CheckCircle2,
  X, ChevronLeft, Loader2, RotateCcw, Shield, Zap,
  Ban, Minus, Plus, MapPin, UserX, Camera, CameraOff,
  FlipHorizontal,
} from 'lucide-react';

import {
  torneoAreasService,
  type EscaneoQRResult,
} from '../../services/torneo_areas.service';

// ─────────────────────────────────────────────────────────────
//  TEMA
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

  const idA = comp_a.idinscripcion ?? comp_a.competidor?.idinscripcion;
  const idB = comp_b?.idinscripcion ?? comp_b?.competidor?.idinscripcion;

  const handleGanador = (ganadorId: number) => {
    if (!idA || !idB) return;
    onGanador(idA, idB, ganadorId);
  };

  const competidores = [
    {
      data:      comp_a,
      puntos:    puntosA,
      setPuntos: setPuntosA,
      lado:      'A' as const,
      id:        idA,
    },
    {
      data:      comp_b,
      puntos:    puntosB,
      setPuntos: setPuntosB,
      lado:      'B' as const,
      id:        idB,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5">

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
            color:      esLocal ? '#8b5cf6' : '#06b6d4',
            border:     `1px solid ${esLocal ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.25)'}`,
          }}>
          {esLocal ? 'Local' : 'Competencia'}
        </span>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-3">
        {competidores.map(({ data, puntos, setPuntos, lado, id }) => {
          const nombre = data?.nombre_alumno ?? data?.competidor?.nombre_alumno;
          const foto   = data?.foto          ?? data?.competidor?.foto;
          const escuela = data?.escuela      ?? data?.competidor?.escuela;
          const cinta   = data?.cinta        ?? data?.competidor?.cinta;
          const colorC  = data?.color_cinta  ?? data?.competidor?.color_cinta;

          return (
            <motion.div key={lado}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: lado === 'A' ? 0 : 0.1 }}
              className="rounded-[1.75rem] p-4 flex flex-col items-center gap-3"
              style={{ background: T.card, border: `1px solid ${T.border}`, minHeight: 200 }}>

              {/* Foto / avatar */}
              {foto ? (
                <img src={foto} alt=""
                  className="w-16 h-16 rounded-2xl object-cover"
                  style={{ border: `2px solid ${T.border}` }} />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                  style={{
                    background: `${lado === 'A' ? T.cyan : T.violet}18`,
                    color:       lado === 'A' ? T.cyan : T.violet,
                    border:      `2px solid ${lado === 'A' ? T.cyan : T.violet}25`,
                  }}>
                  {nombre?.charAt(0) ?? '?'}
                </div>
              )}

              {/* Nombre */}
              <div className="text-center">
                <p className="text-[11px] font-black uppercase italic tracking-tighter leading-tight"
                  style={{ color: T.text }}>
                  {nombre ?? '—'}
                </p>
                <p className="text-[8px] font-bold mt-0.5" style={{ color: T.textDim }}>
                  {escuela ?? ''}
                </p>
                {cinta && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase"
                    style={{
                      background: `${colorC || '#888'}18`,
                      color:       colorC || '#888',
                      border:      `1px solid ${colorC || '#888'}30`,
                    }}>
                    {cinta}
                  </span>
                )}
              </div>

              {/* Puntos (modalidad competencia) */}
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
                onClick={() => id && handleGanador(id)}
                disabled={registrando || (!esLocal && puntosA === puntosB && puntosA > 0) || !data}
                className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                style={{
                  background: lado === 'A'
                    ? `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`
                    : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color:   '#fff',
                  opacity: registrando ? 0.6 : 1,
                }}>
                {registrando
                  ? <Loader2 size={12} className="animate-spin" />
                  : <><Trophy size={11} /> Ganó</>}
              </motion.button>
            </motion.div>
          );
        })}
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
//  INPUT QR — manual + cámara con getUserMedia + jsQR
//  npm install jsqr
// ─────────────────────────────────────────────────────────────

type ModoInput = 'manual' | 'camara';
type FacingMode = 'environment' | 'user';

const InputQR: React.FC<{
  onEscanear: (token: string) => void;
  cargando:   boolean;
  idarea:     number | null;
  T: Tema;
}> = ({ onEscanear, cargando, idarea, T }) => {
  const [modo, setModo]               = useState<ModoInput>('manual');
  const [token, setToken]             = useState('');
  const [facing, setFacing]           = useState<FacingMode>('environment');
  const [camaraError, setCamaraError] = useState<string | null>(null);
  const [streamActivo, setStreamActivo] = useState(false);

  const inputRef      = useRef<HTMLInputElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number>(0);
  const procesandoRef = useRef(false);

  useEffect(() => {
    if (modo === 'manual') inputRef.current?.focus();
  }, [modo]);

  const ultimoAnalisisRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);

  // Inicializar BarcodeDetector (nativo en Chrome/Android) o fallback a jsQR
  const detenerCamara = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreamActivo(false);
    procesandoRef.current = false;
  }, []);

  const procesarFrame = useCallback(async (video: HTMLVideoElement) => {
    const texto = await (async () => {
      // ── Opción 1: BarcodeDetector nativo ──────────────────
      if (detectorRef.current) {
        try {
          const results = await detectorRef.current.detect(video);
          if (results?.length > 0) return results[0].rawValue as string;
        } catch (_e) {}
        return null;
      }

      // ── Opción 2: jsQR via canvas ──────────────────────────
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      const W = Math.min(video.videoWidth, 640);
      const H = Math.min(video.videoHeight, 480);
      canvas.width = W; canvas.height = H;
      ctx.drawImage(video, 0, 0, W, H);
      try {
        const jsQR = (await import('jsqr')).default;
        const img  = ctx.getImageData(0, 0, W, H);
        const r1   = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        const r2   = r1 ?? jsQR(img.data, img.width, img.height, { inversionAttempts: 'invertFirst' });
        return r2?.data ?? null;
      } catch (_e) { return null; }
    })();

    if (!texto) return;

    const partes       = texto.trim().split('/');
    const posibleToken = partes[partes.length - 1];
    const esUUID       = /^[0-9a-f-]{36}$/i.test(posibleToken);
    const tokenFinal   = esUUID ? posibleToken : texto.trim();
    detenerCamara();
    setModo('manual');
    onEscanear(tokenFinal);
  }, [onEscanear, detenerCamara]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ahora = Date.now();
    if (ahora - ultimoAnalisisRef.current < 250) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    ultimoAnalisisRef.current = ahora;

    if (!procesandoRef.current) {
      procesandoRef.current = true;
      procesarFrame(video).finally(() => {
        procesandoRef.current = false;
        // Solo re-encolar si la cámara sigue activa
        if (streamRef.current) {
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      });
    } else {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  }, [procesarFrame]); // eslint-disable-line react-hooks/exhaustive-deps

  const iniciarCamara = useCallback(async () => {
    setCamaraError(null);
    setStreamActivo(false);
    procesandoRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setStreamActivo(true);
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        setCamaraError('Permiso de cámara denegado. Actívalo en ajustes del navegador.');
      } else if (e?.name === 'NotFoundError') {
        setCamaraError('No se encontró cámara en este dispositivo.');
      } else {
        setCamaraError('No se pudo iniciar la cámara. Usa el modo manual.');
      }
    }
  }, [facing, scanFrame]);

  const initDetector = useCallback(async () => {
    if ('BarcodeDetector' in window) {
      try {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        console.log('[QR] Usando BarcodeDetector nativo');
        return;
      } catch (_e) {}
    }
    // Fallback: jsQR
    detectorRef.current = null;
    console.log('[QR] Usando jsQR como fallback');
  }, []);

  useEffect(() => { initDetector(); }, [initDetector]);

  useEffect(() => {
    if (modo === 'camara') iniciarCamara();
    else detenerCamara();
    return () => { detenerCamara(); };
  }, [modo, facing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cargando) setToken('');
  }, [cargando]);

  const handleSubmit = () => {
    if (token.trim() && !cargando) onEscanear(token.trim());
  };

  const toggleFacing = () => {
    detenerCamara();
    setFacing(f => f === 'environment' ? 'user' : 'environment');
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Selector de modo */}
      <div className="flex gap-2">
        {([
          { id: 'manual', label: 'Manual',  icon: Zap    },
          { id: 'camara', label: 'Cámara',  icon: Camera },
        ] as { id: ModoInput; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModo(id)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: modo === id ? `${T.cyan}18` : T.surface,
              border:     `1px solid ${modo === id ? T.cyan + '50' : T.border}`,
              color:       modo === id ? T.cyan : T.textDim,
            }}>
            <Icon size={13} />
            {label}
          </motion.button>
        ))}
      </div>

      {/* ── MODO CÁMARA ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {modo === 'camara' && (
          <motion.div
            key="camara"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3">

            {/* Visor */}
            <div
              className="relative rounded-[1.5rem] overflow-hidden"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                aspectRatio: '4/3',
              }}>

              {/* Video */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
                style={{ display: camaraError ? 'none' : 'block' }}
              />

              {/* Overlay de escaneo */}
              {!camaraError && streamActivo && (
                <>
                  {/* Marco de enfoque */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-48 h-48 rounded-2xl"
                      style={{
                        border: `2px solid ${T.cyan}`,
                        boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`,
                      }}>
                      {/* Línea de escaneo animada */}
                      <motion.div
                        animate={{ top: ['8%', '88%', '8%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-2 right-2 h-0.5 rounded-full"
                        style={{
                          background:  T.cyan,
                          boxShadow:   `0 0 10px ${T.cyan}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Esquinas decorativas */}
                  {(['tl','tr','bl','br'] as const).map(pos => (
                    <div
                      key={pos}
                      className="absolute w-5 h-5 pointer-events-none"
                      style={{
                        top:    pos.startsWith('t') ? '25%' : undefined,
                        bottom: pos.startsWith('b') ? '25%' : undefined,
                        left:   pos.endsWith('l')   ? '18%' : undefined,
                        right:  pos.endsWith('r')   ? '18%' : undefined,
                        borderTop:    pos.startsWith('t') ? `2px solid ${T.cyan}` : undefined,
                        borderBottom: pos.startsWith('b') ? `2px solid ${T.cyan}` : undefined,
                        borderLeft:   pos.endsWith('l')   ? `2px solid ${T.cyan}` : undefined,
                        borderRight:  pos.endsWith('r')   ? `2px solid ${T.cyan}` : undefined,
                        borderRadius: pos === 'tl' ? '4px 0 0 0'
                          : pos === 'tr' ? '0 4px 0 0'
                          : pos === 'bl' ? '0 0 0 4px'
                          : '0 0 4px 0',
                      }}
                    />
                  ))}

                  {/* Etiqueta */}
                  <div
                    className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <div
                      className="px-3 py-1.5 rounded-xl"
                      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                      <p className="text-[8px] font-black uppercase tracking-widest"
                        style={{ color: T.cyan }}>
                        Apunta al QR del gafete
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Error de cámara */}
              {camaraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <CameraOff size={32} style={{ color: T.textDim }} />
                  <p className="text-[9px] font-bold" style={{ color: T.textDim }}>
                    {camaraError}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCamaraError(null); iniciarCamara(); }}
                    className="px-4 h-8 rounded-xl text-[8px] font-black uppercase tracking-wider"
                    style={{ background: `${T.cyan}18`, border: `1px solid ${T.cyan}40`, color: T.cyan }}>
                    Reintentar
                  </motion.button>
                </div>
              )}

              {/* Cargando cámara */}
              {!camaraError && !streamActivo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin" style={{ color: T.cyan }} />
                </div>
              )}
            </div>

            {/* Controles de cámara */}
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={toggleFacing}
                className="flex items-center gap-2 px-4 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider flex-1"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  color: T.textDim,
                }}>
                <FlipHorizontal size={13} />
                {facing === 'environment' ? 'Cambiar a frontal' : 'Cambiar a trasera'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setModo('manual')}
                className="w-9 h-9 flex items-center justify-center rounded-2xl"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <X size={13} style={{ color: T.textDim }} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── MODO MANUAL ──────────────────────────────────── */}
        {modo === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4">

            {/* Animación icono QR */}
            <div className="flex justify-center py-4">
              <motion.div
                animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative w-24 h-24 rounded-[2rem] flex items-center justify-center"
                style={{ background: `${T.cyan}12`, border: `2px solid ${T.cyan}30` }}>
                <QrCode size={44} style={{ color: T.cyan }} />
                <motion.div
                  animate={{ top: ['20%', '80%', '20%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-4 right-4 h-0.5 rounded-full"
                  style={{ background: T.cyan, boxShadow: `0 0 8px ${T.cyan}` }} />
              </motion.div>
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: T.textDim }}>
              Ingresa el código QR manualmente
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
                style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSubmit}
                disabled={cargando || !token.trim()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: T.cyan, opacity: !token.trim() ? 0.5 : 1 }}>
                {cargando
                  ? <Loader2 size={16} color="#fff" className="animate-spin" />
                  : <Zap size={16} color="#fff" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info área */}
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
//  RESULTADO CARD — estado del escaneo
// ─────────────────────────────────────────────────────────────
const ResultadoCard: React.FC<{
  resultado:  EscaneoQRResult;
  idtorneo:   number;
  onDismiss:  () => void;
  onDescalificar?: (idinscripcion: number) => void;
  T: Tema;
}> = ({ resultado, onDismiss, onDescalificar, T }) => {
  const estado = resultado.estado;
  const esAreaIncorrecta = estado === 'area_incorrecta';
  const esValido         = resultado.valido && estado === 'listo';
  const esWarning        = esAreaIncorrecta || estado === 'limite_combates';

  const color = esValido
    ? '#10b981'
    : esWarning
    ? '#f97316'
    : '#ef4444';

  const Icon = esValido
    ? CheckCircle2
    : esWarning
    ? AlertTriangle
    : Ban;

  const idinscripcion =
    resultado.idinscripcion
    ?? resultado.competidor?.idinscripcion
    ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
      }}>

      <div className="flex items-start gap-3">
        <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase italic tracking-tighter"
            style={{ color }}>
            {resultado.mensaje}
          </p>

          {/* Área incorrecta: mostrar dónde le toca */}
          {esAreaIncorrecta && resultado.area_correcta && (
            <div className="flex items-center gap-1.5 mt-2 p-2 rounded-xl"
              style={{ background: `${T.orange}10`, border: `1px solid ${T.orange}25` }}>
              <MapPin size={11} color={T.orange} />
              <span className="text-[10px] font-black" style={{ color: T.orange }}>
                Su combate es en: <strong>{resultado.area_correcta}</strong>
              </span>
            </div>
          )}

          {/* Lugar obtenido */}
          {resultado.lugar_obtenido && (
            <p className="text-[9px] font-bold mt-1" style={{ color: T.yellow }}>
              🏅 Lugar obtenido: {resultado.lugar_obtenido}°
            </p>
          )}
        </div>
        <button onClick={onDismiss}>
          <X size={13} style={{ color: T.textDim }} />
        </button>
      </div>

      {/* Botón descalificar si no se presenta */}
      {!esValido && !esAreaIncorrecta && idinscripcion && onDescalificar && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onDescalificar(idinscripcion)}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider"
          style={{ background: `${T.red}15`, border: `1px solid ${T.red}30`, color: T.red }}>
          <UserX size={12} /> Descalificar por ausencia
        </motion.button>
      )}
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

  type Fase = 'scan_a' | 'scan_b' | 'combate' | 'resultado_final';
  const [fase,          setFase]          = useState<Fase>('scan_a');
  const [cargando,      setCargando]      = useState(false);
  const [registrando,   setRegistrando]   = useState(false);
  const [compA,         setCompA]         = useState<EscaneoQRResult | null>(null);
  const [compB,         setCompB]         = useState<EscaneoQRResult | null>(null);
  const [ultimoScan,    setUltimoScan]    = useState<EscaneoQRResult | null>(null);
  const [idcombate,     setIdcombate]     = useState<number | null>(null);
  const [resultadoFinal, setResultadoFinal] = useState<{
    ganador: string; esLocal: boolean;
  } | null>(null);
  const [historial, setHistorial] = useState<
    { nombre: string; resultado: 'victoria' }[]
  >([]);
  const [descalificando, setDescalificando] = useState(false);

  // Ref para guardar el idinscripcion del competidor A sincrónicamente
  const compAIdRef = useRef<number | null>(null);

  const tipoTorneo = compA?.tipo_torneo ?? compA?.competidor?.tipo_torneo ?? 'competencia';

  const handleEscanear = async (token: string) => {
    setCargando(true);
    setUltimoScan(null);
    try {
      const res = await torneoAreasService.escanearQR(token, idarea);

      // Área incorrecta — mostrar aviso con dónde le toca, no avanzar
      if (res.estado === 'area_incorrecta') {
        setUltimoScan(res);
        return;
      }

      // Cualquier otro estado inválido
      if (!res.valido || res.estado !== 'listo') {
        setUltimoScan(res);
        return;
      }

      if (fase === 'scan_a') {
        // Guardar el id en ref sincrónicamente — antes del setState
        compAIdRef.current = res.idinscripcion ?? res.competidor?.idinscripcion ?? null;
        setCompA(res);
        const combateId = res.combate_activo?.idcombate
          ?? res.competidor?.combate_activo?.idcombate
          ?? null;
        if (combateId) setIdcombate(combateId);
        setFase('scan_b');
      } else if (fase === 'scan_b') {
        const idA = compAIdRef.current; // leer del ref — siempre actualizado
        const idR = res.idinscripcion ?? res.competidor?.idinscripcion;

        if (idR !== null && idR === idA) {
          setUltimoScan({
            ...res,
            valido:  false,
            estado:  'invalido',
            mensaje: '⚠️ Ese es el mismo competidor. Escanea el QR del rival.',
          });
          return;
        }
        setCompB(res);
        setTimeout(() => setFase('combate'), 50);
      }
    } catch (e: any) {
      setUltimoScan({
        ok:      false,
        valido:  false,
        estado:  'invalido',
        mensaje: e?.response?.data?.detail ?? 'Error al escanear el QR',
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
        ok:      false,
        valido:  false,
        estado:  'invalido',
        mensaje: 'No hay combate asignado. Asigna el combate desde el panel de áreas.',
      });
      return;
    }

    setRegistrando(true);
    try {
      await torneoAreasService.resultadoLocal(idcombate, ganadorId);

      const perdedorId = ganadorId === idinscA ? idinscB : idinscA;
      await torneoAreasService.invalidarQR(perdedorId);

      const ganadorNombre = ganadorId === idinscA
        ? (compA?.nombre_alumno ?? compA?.competidor?.nombre_alumno)
        : (compB?.nombre_alumno ?? compB?.competidor?.nombre_alumno);

      setHistorial(prev => [
        { nombre: ganadorNombre ?? 'Desconocido', resultado: 'victoria' },
        ...prev.slice(0, 9),
      ]);

      setResultadoFinal({ ganador: ganadorNombre ?? '', esLocal: tipoTorneo === 'local' });
      setFase('resultado_final');
    } catch (e: any) {
      setUltimoScan({
        ok:      false,
        valido:  false,
        estado:  'invalido',
        mensaje: e?.response?.data?.detail ?? 'Error al registrar resultado',
      });
    } finally {
      setRegistrando(false);
    }
  };

  const handleDescalificar = async (idinscripcion: number) => {
    if (descalificando) return;
    setDescalificando(true);
    try {
      await torneoAreasService.descalificarCompetidor(
        idtorneo,
        idinscripcion,
        'No se presentó al área de combate',
      );
      setUltimoScan(null);
    } catch {
      // silencioso — el QR ya quedó invalidado en la mayoría de los casos
    } finally {
      setDescalificando(false);
    }
  };

  const reset = () => {
    setFase('scan_a');
    setCompA(null);
    setCompB(null);
    setUltimoScan(null);
    setIdcombate(null);
    setResultadoFinal(null);
    compAIdRef.current = null;
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
            {fase === 'scan_a'         && 'Escanear Competidor A'}
            {fase === 'scan_b'         && 'Escanear Competidor B'}
            {fase === 'combate'        && '🥊 Combate'}
            {fase === 'resultado_final' && '🏆 Resultado'}
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: T.textDim }}>
            {idarea ? `Área #${idarea}` : 'Sin área asignada'} · Torneo #{idtorneo}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1">
          {(['scan_a', 'scan_b', 'combate'] as Fase[]).map((f, i) => (
            <div key={f} className="w-2 h-2 rounded-full"
              style={{
                background: (['scan_a', 'scan_b', 'combate', 'resultado_final'] as Fase[]).indexOf(fase) >= i
                  ? T.cyan
                  : T.border,
              }} />
          ))}
        </div>
      </div>

      {/* Hint del paso */}
      {(fase === 'scan_a' || fase === 'scan_b') && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-2xl"
          style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${fase === 'scan_a' ? T.violet : T.cyan}15`,
              border:     `1px solid ${fase === 'scan_a' ? T.violet : T.cyan}30`,
            }}>
            <span className="text-xs font-black"
              style={{ color: fase === 'scan_a' ? T.violet : T.cyan }}>
              {fase === 'scan_a' ? 'A' : 'B'}
            </span>
          </div>
          <p className="text-[9px] font-bold" style={{ color: T.textDim }}>
            {fase === 'scan_a'
              ? 'Escanea el QR del primer competidor'
              : `${compA?.nombre_alumno ?? compA?.competidor?.nombre_alumno ?? '...'} listo. Ahora escanea al rival.`}
          </p>
        </motion.div>
      )}

      {/* Alerta último escaneo */}
      <AnimatePresence>
        {ultimoScan && (
          <ResultadoCard
            resultado={ultimoScan}
            idtorneo={idtorneo}
            onDismiss={() => setUltimoScan(null)}
            onDescalificar={handleDescalificar}
            T={T}
          />
        )}
      </AnimatePresence>

      {/* Contenido por fase */}
      <AnimatePresence mode="wait">

        {(fase === 'scan_a' || fase === 'scan_b') && (
          <motion.div key="scanner"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InputQR onEscanear={handleEscanear} cargando={cargando} idarea={idarea ?? null} T={T} />
          </motion.div>
        )}

        {fase === 'combate' && compA && compB && (
          <motion.div key="combate"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

      {/* Historial */}
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