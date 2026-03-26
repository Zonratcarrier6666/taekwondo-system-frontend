// ============================================================
//  src/views/escuela/CheckinTorneoView.tsx  — v2
//  Staff confirma llegada → genera QR → imprime gafete
//  Roles: SuperAdmin, Staff, Escuela
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, UserCheck, Search, X, Check, AlertCircle,
  Printer, ChevronLeft, Users, Clock, Loader2,
  RefreshCw, Download,
} from 'lucide-react';
import {
  torneoAreasService,
  type CompetidorCheckin,
  type GafeteData,
} from '../../services/torneo_areas.service';
import { torneoService } from '../../services/torneo.service';
import type { Torneo } from '../../types/torneo.types';

// ─── URL del QR (sin dependencias extra) ─────────────────────
const qrUrl = (token: string, size = 160) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}&margin=6`;

// ─────────────────────────────────────────────────────────────
//  GAFETE IMPRIMIBLE
// ─────────────────────────────────────────────────────────────
const Gafete: React.FC<{ data: GafeteData }> = ({ data }) => (
  <div
    id={`gafete-${data.idinscripcion}`}
    className="w-[240px] rounded-[1.5rem] overflow-hidden flex-shrink-0"
    style={{
      background: 'white',
      border: '2px solid #e2e8f0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    {/* Header */}
    <div className="px-4 py-3 text-center"
      style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white opacity-70">
        {data.torneo}
      </p>
      <p className="text-[9px] font-black uppercase tracking-wider text-white mt-0.5">
        {data.fecha_torneo} · {data.sede}
      </p>
    </div>

    {/* Foto + nombre */}
    <div className="px-4 pt-4 pb-2 text-center">
      {data.foto ? (
        <img src={data.foto} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
          style={{ border: '2px solid #e2e8f0' }} />
      ) : (
        <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-black"
          style={{ background: '#e0e7ff', color: '#4338ca' }}>
          {data.nombre_alumno.charAt(0)}
        </div>
      )}
      <p className="text-[12px] font-black uppercase italic tracking-tighter leading-tight"
        style={{ color: '#1e1b4b' }}>
        {data.nombre_alumno}
      </p>
      <p className="text-[9px] font-bold mt-0.5" style={{ color: '#64748b' }}>
        {data.escuela}
      </p>
    </div>

    {/* Categoría */}
    <div className="mx-4 mb-3 px-3 py-1.5 rounded-xl text-center"
      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
      <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#475569' }}>
        {data.categoria}
      </p>
    </div>

    {/* QR */}
    <div className="flex justify-center pb-4">
      <div className="p-2 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <img src={qrUrl(data.token_qr, 100)} alt="QR" className="w-[100px] h-[100px]" />
        <p className="text-[6px] font-black uppercase tracking-widest text-center mt-1"
          style={{ color: '#94a3b8' }}>
          #{data.idinscripcion.toString().padStart(6, '0')}
        </p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  MODAL GAFETE
// ─────────────────────────────────────────────────────────────
const ModalGafete: React.FC<{
  gafetes:  GafeteData[];
  idtorneo: number;
  onClose:  () => void;
}> = ({ gafetes, idtorneo, onClose }) => {

  const handleImprimir = () => {
    const contenido = document.getElementById('zona-gafetes');
    if (!contenido) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Gafetes</title>
      <style>
        body { margin: 0; padding: 20px; background: white; }
        .gafetes { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
        @media print { body { padding: 0; } }
      </style></head>
      <body><div class="gafetes">${contenido.innerHTML}</div></body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDescargarPDF = (g: GafeteData) => {
    const url = torneoAreasService.gafetePdfUrl(idtorneo, g.idinscripcion);
    window.open(url, '_blank');
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-2xl flex flex-col rounded-[2rem] overflow-hidden"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          maxHeight: 'calc(100dvh - 40px)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)20' }}>
              <QrCode size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter"
                style={{ color: 'var(--color-text)' }}>
                Gafetes Generados
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>
                {gafetes.length} competidor{gafetes.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleImprimir}
              className="flex items-center gap-2 px-4 h-10 rounded-2xl text-[10px] font-black uppercase tracking-wider"
              style={{ background: 'var(--color-primary)', color: '#fff' }}>
              <Printer size={13} /> Imprimir todos
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </motion.button>
          </div>
        </div>

        {/* Gafetes */}
        <div className="flex-1 overflow-y-auto p-6">
          <div id="zona-gafetes" className="flex flex-wrap gap-4 justify-center">
            {gafetes.map(g => (
              <div key={g.idinscripcion} className="flex flex-col items-center gap-2">
                <Gafete data={g} />
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleDescargarPDF(g)}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-[8px] font-black uppercase tracking-wider"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <Download size={10} /> PDF
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────
//  FILA COMPETIDOR
// ─────────────────────────────────────────────────────────────
const CompetidorRow: React.FC<{
  comp:         CompetidorCheckin;
  seleccionado: boolean;
  onToggle:     () => void;
  peso:         string;
  onPeso:       (v: string) => void;
  cargando:     boolean;
  onCheckin:    () => void;
}> = ({ comp, seleccionado, onToggle, peso, onPeso, cargando, onCheckin }) => (
  <motion.div
    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
    className="rounded-2xl p-3 flex items-center gap-3"
    style={{
      background: comp.estatus_checkin
        ? 'rgba(16,185,129,0.08)'
        : seleccionado
        ? 'var(--color-primary)08'
        : 'var(--color-surface)',
      border: `1px solid ${
        comp.estatus_checkin ? '#10b98130'
        : seleccionado ? 'var(--color-primary)40'
        : 'var(--color-border)'
      }`,
    }}>

    {/* Checkbox */}
    {!comp.estatus_checkin ? (
      <motion.button whileTap={{ scale: 0.88 }} onClick={onToggle}
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: seleccionado ? 'var(--color-primary)' : 'var(--color-card)',
          border: `2px solid ${seleccionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
        }}>
        {seleccionado && <Check size={12} color="#fff" />}
      </motion.button>
    ) : (
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: '#10b98120', border: '1px solid #10b98140' }}>
        <UserCheck size={13} color="#10b981" />
      </div>
    )}

    {/* Foto / avatar */}
    {comp.foto ? (
      <img src={comp.foto} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        style={{ border: '1px solid var(--color-border)' }} />
    ) : (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: 'var(--color-primary)15', color: 'var(--color-primary)' }}>
        {comp.nombre_alumno.charAt(0)}
      </div>
    )}

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-black uppercase italic tracking-tighter truncate"
        style={{ color: 'var(--color-text)' }}>
        {comp.nombre_alumno}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg"
          style={{
            background: `${comp.color_cinta || '#888'}20`,
            color: comp.color_cinta || '#888',
            border: `1px solid ${comp.color_cinta || '#888'}30`,
          }}>
          {comp.cinta}
        </span>
        <span className="text-[8px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
          {comp.edad} años · {comp.categoria}
        </span>
        {comp.estatus_checkin && (
          <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg"
            style={{ background: '#10b98120', color: '#10b981' }}>
            ✓ Check-in
          </span>
        )}
      </div>
      <p className="text-[8px] font-bold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
        {comp.escuela}
      </p>
    </div>

    {/* Peso + acción individual */}
    {!comp.estatus_checkin && (
      <div className="flex items-center gap-2 flex-shrink-0">
        <input type="number" placeholder="kg" value={peso}
          onChange={e => onPeso(e.target.value)}
          className="w-14 text-center text-[10px] font-black rounded-xl py-1.5 px-2 outline-none"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }} />
        <motion.button whileTap={{ scale: 0.88 }} onClick={onCheckin}
          disabled={cargando}
          className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {cargando
            ? <Loader2 size={13} className="animate-spin" />
            : <QrCode size={13} />}
        </motion.button>
      </div>
    )}

    {/* Si ya tiene QR */}
    {comp.estatus_checkin && comp.tiene_qr && (
      <div className="flex-shrink-0 opacity-60">
        <QrCode size={16} style={{ color: '#10b981' }} />
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
interface CheckinTorneoViewProps {
  idtorneo: number;
  onVolver: () => void;
}

const CheckinTorneoView: React.FC<CheckinTorneoViewProps> = ({ idtorneo, onVolver }) => {
  const [torneo, setTorneo]               = useState<Torneo | null>(null);
  const [pendientes, setPendientes]       = useState<CompetidorCheckin[]>([]);
  const [conCheckin, setConCheckin]       = useState<CompetidorCheckin[]>([]);
  const [loading, setLoading]             = useState(true);
  const [buscar, setBuscar]               = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [pesos, setPesos]                 = useState<Record<number, string>>({});
  const [cargandoIndiv, setCargandoIndiv] = useState<Record<number, boolean>>({});
  const [cargandoLote, setCargandoLote]   = useState(false);
  const [tab, setTab]                     = useState<'pendientes' | 'checkin'>('pendientes');
  const [gafetes, setGafetes]             = useState<GafeteData[]>([]);
  const [modalAbierto, setModalAbierto]   = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [torneoData, checkinData] = await Promise.all([
        torneoService.obtener(idtorneo),
        torneoAreasService.pendientesCheckin(idtorneo),
      ]);
      setTorneo(torneoData);
      setPendientes(checkinData.pendientes ?? []);
      setConCheckin(checkinData.con_checkin ?? []);
    } catch {
      setErrorMsg('Error al cargar los datos del torneo');
    } finally {
      setLoading(false);
    }
  }, [idtorneo]);

  useEffect(() => { cargar(); }, [cargar]);

  // Check-in individual
  const handleCheckinIndividual = async (comp: CompetidorCheckin) => {
    setCargandoIndiv(p => ({ ...p, [comp.idinscripcion]: true }));
    setErrorMsg('');
    try {
      const pesoNum = pesos[comp.idinscripcion]
        ? parseFloat(pesos[comp.idinscripcion])
        : undefined;
      const res = await torneoAreasService.hacerCheckin(idtorneo, comp.idinscripcion, pesoNum);
      if (res.datos_gafete) {
        setGafetes(prev => {
          // evitar duplicados
          const existe = prev.some(g => g.idinscripcion === res.datos_gafete.idinscripcion);
          return existe ? prev : [...prev, res.datos_gafete];
        });
        setModalAbierto(true);
      }
      await cargar();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail ?? 'Error al hacer check-in');
    } finally {
      setCargandoIndiv(p => ({ ...p, [comp.idinscripcion]: false }));
    }
  };

  // Check-in en lote
  const handleCheckinLote = async () => {
    if (seleccionados.size === 0) return;
    setCargandoLote(true);
    setErrorMsg('');
    try {
      const ids = Array.from(seleccionados);
      await torneoAreasService.checkinLote(idtorneo, ids);
      await cargar();
      setSeleccionados(new Set());

      // Obtener lista actualizada y construir gafetes de los que acaban de hacer check-in
      const fresh = await torneoAreasService.pendientesCheckin(idtorneo);
      const nuevos = (fresh.con_checkin ?? []).filter(c => ids.includes(c.idinscripcion));

      // Construimos GafeteData mínimo con los datos disponibles
      // (sin token_qr completo — ofrecemos descarga PDF individual)
      if (nuevos.length > 0) {
        const gasetesLote: GafeteData[] = nuevos.map(c => ({
          nombre_alumno: c.nombre_alumno,
          foto:          c.foto,
          edad:          c.edad,
          escuela:       c.escuela,
          categoria:     c.categoria,
          torneo:        torneo?.nombre ?? '',
          fecha_torneo:  torneo?.fecha  ?? '',
          sede:          torneo?.sede   ?? '',
          token_qr:      '',          // vacío — usar descarga PDF
          idinscripcion: c.idinscripcion,
        }));
        setGafetes(prev => {
          const ids_prev = new Set(prev.map(g => g.idinscripcion));
          const nuevosUnicos = gasetesLote.filter(g => !ids_prev.has(g.idinscripcion));
          return [...prev, ...nuevosUnicos];
        });
        setModalAbierto(true);
      }
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail ?? 'Error al hacer check-in en lote');
    } finally {
      setCargandoLote(false);
    }
  };

  const toggleSeleccion = (id: number) =>
    setSeleccionados(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleTodos = () => {
    const ids = filtrados.map(c => c.idinscripcion);
    if (seleccionados.size === ids.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(ids));
  };

  const lista     = tab === 'pendientes' ? pendientes : conCheckin;
  const filtrados = lista.filter(c =>
    c.nombre_alumno.toLowerCase().includes(buscar.toLowerCase()) ||
    c.escuela.toLowerCase().includes(buscar.toLowerCase())
  );

  const totalPagados = pendientes.length + conCheckin.length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <ChevronLeft size={16} style={{ color: 'var(--color-text-muted)' }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black uppercase italic tracking-tighter truncate"
            style={{ color: 'var(--color-text)' }}>
            Check-in
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}>
            {torneo?.nombre ?? `Torneo #${idtorneo}`}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
          className="w-10 h-10 flex items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <RefreshCw size={13} style={{ color: 'var(--color-text-muted)' }} />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Pagados', val: totalPagados,      color: 'var(--color-primary)', icon: Users },
          { label: 'Check-in',      val: conCheckin.length, color: '#10b981',              icon: UserCheck },
          { label: 'Pendientes',    val: pendientes.length, color: '#f97316',              icon: Clock },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="rounded-[1.5rem] p-3"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-2"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-xl font-black tracking-tighter leading-none" style={{ color }}>
              {val}
            </p>
            <p className="text-[7px] font-black uppercase tracking-widest mt-1"
              style={{ color: 'var(--color-text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Barra progreso */}
      {totalPagados > 0 && (
        <div className="rounded-2xl p-3"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex justify-between mb-2">
            <span className="text-[8px] font-black uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}>Progreso check-in</span>
            <span className="text-[8px] font-black" style={{ color: '#10b981' }}>
              {Math.round((conCheckin.length / totalPagados) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(conCheckin.length / totalPagados) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-2xl"
            style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
            <AlertCircle size={13} color="#ef4444" />
            <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="ml-auto">
              <X size={12} color="#ef4444" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'pendientes', label: `Pendientes (${pendientes.length})` },
          { id: 'checkin',    label: `Con Check-in (${conCheckin.length})` },
        ].map(t => (
          <motion.button key={t.id} whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t.id as any)}
            className="flex-1 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: tab === t.id ? 'var(--color-primary)15' : 'var(--color-card)',
              border: `1px solid ${tab === t.id ? 'var(--color-primary)60' : 'var(--color-border)'}`,
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }} />
        <input type="text" placeholder="Buscar por nombre o escuela..."
          value={buscar} onChange={e => setBuscar(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl text-sm font-bold outline-none"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }} />
      </div>

      {/* Acción en lote (solo pestaña pendientes) */}
      {tab === 'pendientes' && filtrados.length > 0 && (
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleTodos}
            className="flex-1 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}>
            {seleccionados.size === filtrados.length ? 'Deseleccionar' : 'Seleccionar todos'}
            {seleccionados.size > 0 && ` (${seleccionados.size})`}
          </motion.button>
          {seleccionados.size > 0 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCheckinLote}
              disabled={cargandoLote}
              className="flex items-center gap-2 px-4 h-9 rounded-2xl text-[9px] font-black uppercase tracking-wider"
              style={{ background: 'var(--color-primary)', color: '#fff' }}>
              {cargandoLote
                ? <Loader2 size={12} className="animate-spin" />
                : <><QrCode size={12} /> Check-in ({seleccionados.size})</>}
            </motion.button>
          )}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 rounded-[2rem]"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <UserCheck size={28} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-[10px] font-black uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}>
            {tab === 'pendientes' ? '¡Todos han hecho check-in!' : 'Sin check-ins aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((comp, i) => (
            <motion.div key={comp.idinscripcion} transition={{ delay: i * 0.02 }}>
              <CompetidorRow
                comp={comp}
                seleccionado={seleccionados.has(comp.idinscripcion)}
                onToggle={() => toggleSeleccion(comp.idinscripcion)}
                peso={pesos[comp.idinscripcion] ?? ''}
                onPeso={v => setPesos(p => ({ ...p, [comp.idinscripcion]: v }))}
                cargando={!!cargandoIndiv[comp.idinscripcion]}
                onCheckin={() => handleCheckinIndividual(comp)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Botón ver gafetes generados */}
      <AnimatePresence>
        {gafetes.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalAbierto(true)}
            whileTap={{ scale: 0.96 }}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider"
            style={{ background: 'var(--color-primary)', color: '#fff' }}>
            <Printer size={14} />
            Ver e Imprimir {gafetes.length} Gafete{gafetes.length !== 1 ? 's' : ''}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal gafetes */}
      <AnimatePresence>
        {modalAbierto && gafetes.length > 0 && (
          <ModalGafete
            gafetes={gafetes}
            idtorneo={idtorneo}
            onClose={() => setModalAbierto(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckinTorneoView;