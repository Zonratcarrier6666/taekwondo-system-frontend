// ============================================================
//  src/components/CajaFinanzas.tsx
//  — Todo en un solo archivo —
//  Incluye: lista de pagos, filtros, ModalDetalleAlumno
//  (centrado), modal cobro, modal generar mensualidades,
//  modal ticket, subida de comprobante.
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Search, ArrowUpRight, ArrowDownLeft,
  DollarSign, Calendar, CreditCard, PlusCircle,
  Loader2, CheckCircle2, X, History, ShieldAlert,
  UserCircle, Printer, Image as ImageIcon, Receipt,
  AlertCircle, TrendingUp, FileText, Clock, AlertTriangle,
  ArrowLeft, Upload, ExternalLink, ChevronLeft, ChevronRight, Filter,
  Bell, BellRing,
} from 'lucide-react';

import { finanzasService } from '../../services/finanzas.service';
import { ModalReciboImpresion } from './ModalReciboImpresion';
import type {
  Pago, DesgloseItem, CobroRequestDTO,
  GenerarMensualidadDTO, ReciboImpresion,
  MetodoPago, ResumenAlumno,
} from '../../types/finanzas.types';
import type { PagoHistorial, HistorialResponse } from '../../types/historial.types';
import { TIPO_PAGO_LABEL, METODO_COLOR } from '../../types/historial.types';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function getMesActual(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}
function estatusColor(e: number) {
  return e === 0 ? 'var(--color-primary)' : e === 1 ? '#22c55e' : e === 2 ? '#6b7280' : '#ef4444';
}
function estatusLabel(e: number) {
  return ['Pendiente','Pagado','Cancelado','Vencido'][e] ?? '—';
}
function tipoPagoLabel(t: number) {
  return ['','Mensualidad','Inscripción','Examen','Torneo'][t] ?? 'Otro';
}

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTE: ModalDetalleAlumno
// ─────────────────────────────────────────────────────────────

interface ModalDetalleProps {
  pago:        Pago | null;
  todosPagos:  Pago[];
  onClose:     () => void;
  onCobrar:    (p: Pago) => void;
  onTicket:    (p: Pago) => void;
  onNotificar: (p: Pago) => void;
}

const ModalDetalleAlumno: React.FC<ModalDetalleProps> = ({
  pago, todosPagos, onClose, onCobrar, onTicket, onNotificar,
}) => {
  const [resumen, setResumen]               = useState<ResumenAlumno | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // Todos los pagos del alumno en pantalla
  const pagosAlumno = pago ? todosPagos.filter(p => p.idalumno === pago.idalumno) : [];

  // Aseguramos que el pago seleccionado siempre aparezca, aunque no esté en todosPagos
  const pagosConSelected = pago
    ? pagosAlumno.some(p => p.idpago === pago.idpago)
      ? pagosAlumno
      : [pago, ...pagosAlumno]
    : [];

  // Separar pendientes y no-pendientes para orden visual
  const pendientes = pagosConSelected.filter(p => (p.estatus ?? 0) === 0);
  const resto      = pagosConSelected.filter(p => (p.estatus ?? 0) !== 0);
  const pagosOrdenados = [...pendientes, ...resto];

  const nombreCompleto = pago
    ? `${pago.alumno?.nombres ?? ''} ${pago.alumno?.apellidopaterno ?? ''}`.trim()
    : '';

  useEffect(() => {
    if (!pago?.idalumno) return;
    setResumen(null);
    setLoadingResumen(true);
    finanzasService
      .resumenAlumno(pago.idalumno)
      .then(setResumen)
      .catch(() => setResumen(null))
      .finally(() => setLoadingResumen(false));
  }, [pago?.idalumno]);

  return (
    <AnimatePresence>
      {pago && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="bd-detalle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.90)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="md-detalle"
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3rem] border border-[var(--color-border)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div
              className="relative p-7 flex items-center gap-4 flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, var(--color-primary)))' }}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-4">
                <UserCircle size={130} />
              </div>
              <div className="w-14 h-14 rounded-2xl border flex items-center justify-center text-white flex-shrink-0 z-10" style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}>
                <UserCircle size={28} />
              </div>
              <div className="flex-1 min-w-0 z-10 text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white opacity-[0.60] leading-none mb-1">
                  Ficha de Alumno · ID {pago.idalumno}
                </p>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight">
                  {nombreCompleto}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="z-10 p-2 rounded-full transition-all text-white flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Resumen del backend */}
              {loadingResumen ? (
                <div className="flex items-center gap-3 px-4 py-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" size={18} />
                  <span className="text-xs font-bold opacity-50 text-[var(--color-text)]">Cargando resumen del ciclo...</span>
                </div>
              ) : resumen && (
                <div className="space-y-3">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] px-1">
                    Resumen del Ciclo
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4 text-left border"
                      style={{ backgroundColor: '#22c55e18', borderColor: '#22c55e40' }}>
                      <CheckCircle2 size={15} className="mb-2" style={{ color: '#22c55e' }} />
                      <p className="text-2xl font-black leading-none" style={{ color: '#22c55e' }}>{resumen.mensualidades_pagadas}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: '#22c55e' }}>Mensualidades pagadas</p>
                    </div>
                    <div className="rounded-2xl p-4 text-left border"
                      style={{ backgroundColor: 'var(--color-primary)15', borderColor: 'var(--color-primary)30' }}
                    >
                      <Clock size={15} style={{ color: 'var(--color-primary)' }} className="mb-2" />
                      <p className="text-2xl font-black leading-none" style={{ color: 'var(--color-primary)' }}>
                        {resumen.mensualidades_pendientes}
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mt-1" style={{ color: 'var(--color-primary)' }}>
                        Pendientes
                      </p>
                    </div>
                  </div>

                  {resumen.total_adeudo > 0 && (
                    <div className="rounded-2xl p-4 flex items-center gap-3 text-left border"
                      style={{ backgroundColor: '#ef444418', borderColor: '#ef444440' }}>
                      <AlertTriangle size={18} style={{ color: '#ef4444' }} className="flex-shrink-0" />
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#ef4444' }}>Adeudo Total</p>
                        <p className="text-xl font-black leading-none mt-0.5" style={{ color: '#ef4444' }}>
                          ${resumen.total_adeudo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3 text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-50 text-[var(--color-text)]">
                      Configuración de cobro
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold opacity-60 text-[var(--color-text)]">Mensualidad</span>
                      <span className="text-sm font-black text-[var(--color-text)]">
                        ${resumen.monto_mensualidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold opacity-60 text-[var(--color-text)]">Día de cobro</span>
                      <span className="text-sm font-black text-[var(--color-text)]">Día {resumen.dia_cobro}</span>
                    </div>
                    {resumen.inscripcion_ciclo_actual && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold opacity-60 text-[var(--color-text)]">Inscripción ciclo</span>
                        <span
                          className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: resumen.inscripcion_ciclo_actual === 'PAGADA' ? '#22c55e20' : 'var(--color-primary)20',
                            color: resumen.inscripcion_ciclo_actual === 'PAGADA' ? '#22c55e' : 'var(--color-primary)',
                          }}
                        >
                          {resumen.inscripcion_ciclo_actual}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Todos los cargos del alumno */}
              <div>
                <div className="flex items-center justify-between px-1 mb-3">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)]">
                    Cargos ({pagosOrdenados.length})
                  </p>
                  {pendientes.length > 0 && (
                    <span
                      className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}
                    >
                      {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {pagosOrdenados.map(p => (
                    <div
                      key={p.idpago}
                      className="rounded-2xl border p-4 space-y-3 text-left"
                      style={p.idpago === pago.idpago
                        ? { borderColor: 'var(--color-primary)50', backgroundColor: 'var(--color-primary)12' }
                        : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {p.idpago === pago.idpago && (
                              <span
                                className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'var(--color-primary)25', color: 'var(--color-primary)' }}
                              >
                                Seleccionado
                              </span>
                            )}
                            <span
                              className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${estatusColor(p.estatus ?? 0)}20`, color: estatusColor(p.estatus ?? 0) }}
                            >
                              {estatusLabel(p.estatus ?? 0)}
                            </span>
                            <span className="text-[8px] font-bold uppercase text-[var(--color-text-muted)]">
                              {tipoPagoLabel(p.id_tipo_pago)}
                            </span>
                          </div>
                          <p className="text-sm font-black text-[var(--color-text)] truncate leading-tight">
                            {p.concepto}
                          </p>
                          {p.mes_correspondiente && (
                            <p className="text-[9px] font-bold text-[var(--color-text-muted)] mt-0.5">{p.mes_correspondiente}</p>
                          )}
                          {p.metodo_pago && (
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                              <CreditCard size={10} /> {p.metodo_pago}
                            </p>
                          )}
                          {p.fecha_pago && (
                            <p className="text-[9px] font-bold text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                              <Calendar size={10} /> {new Date(p.fecha_pago).toLocaleDateString('es-MX')}
                            </p>
                          )}
                        </div>
                        <span className="text-xl font-black leading-none flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                          ${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Acciones por cargo */}
                      <div className="flex gap-2 pt-1">
                        {(p.estatus ?? 0) === 0 && (
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onCobrar(p)}
                            className="flex-1 h-11 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg"
                            style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 20px -4px var(--color-primary)60' }}
                          >
                            <TrendingUp size={15} /> Pagar ahora
                          </motion.button>
                        )}
                        {(p.estatus ?? 0) === 0 && (
                          <button
                            onClick={() => onNotificar(p)}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all flex-shrink-0"
                            style={{ backgroundColor: '#f9731615', borderColor: '#f9731640', color: '#f97316' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f97316'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f9731615'; e.currentTarget.style.color = '#f97316'; }}
                            title="Notificar al tutor"
                          >
                            <Bell size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onTicket(p)}
                          className={`h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${(p.estatus ?? 0) === 0 ? 'w-11 flex-shrink-0' : 'flex-1'}`}
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
                          onMouseEnter={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.backgroundColor = 'var(--color-primary)';
                            b.style.color = 'white';
                            b.style.borderColor = 'transparent';
                          }}
                          onMouseLeave={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.backgroundColor = 'transparent';
                            b.style.color = 'var(--color-text-muted)';
                            b.style.borderColor = 'var(--color-border)';
                          }}
                          title={(p.estatus ?? 0) === 0 ? 'Ver Cargo' : 'Ver Recibo'}
                        >
                          <FileText size={14} />
                          {(p.estatus ?? 0) !== 0 && ((p.estatus ?? 0) === 0 ? 'Ver Cargo' : 'Ver Recibo')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL: CajaFinanzas
// ─────────────────────────────────────────────────────────────

export const CajaFinanzas: React.FC = () => {
  const [pagos, setPagos]           = useState<Pago[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<0 | 1>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAlumno, setFiltroAlumno] = useState<string>('');
  const [idescuela, setIdescuela]   = useState<number | null>(null);
  const [escuelaInfo, setEscuelaInfo] = useState<{
    nombre: string; logo: string | null; ciudad: string; tel: string;
  }>({ nombre: '', logo: null, ciudad: '', tel: '' });
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [notificando, setNotificando] = useState<number | null>(null); // idpago en proceso

  // ── Historial ───────────────────────────────────────────────
  const [historial, setHistorial]           = useState<HistorialResponse | null>(null);
  const [histLoading, setHistLoading]       = useState(false);
  const [histBuscar, setHistBuscar]         = useState('');
  const [histEstatus, setHistEstatus]       = useState('');
  const [histTipo, setHistTipo]             = useState('');
  const [histMetodo, setHistMetodo]         = useState('');
  const [histDesde, setHistDesde]           = useState('');
  const [histHasta, setHistHasta]           = useState('');
  const [histPagina, setHistPagina]         = useState(1);
  const [histComprobante, setHistComprobante] = useState<string | null>(null);
  const [histFiltrosOpen, setHistFiltrosOpen] = useState(false);

  // ── Modal detalle ───────────────────────────────────────────
  const [detallePago, setDetallePago] = useState<Pago | null>(null);

  // ── Modal cobro ─────────────────────────────────────────────
  const [selectedPago, setSelectedPago]           = useState<Pago | null>(null);
  const [isCobrarModalOpen, setIsCobrarModalOpen] = useState(false);
  const [pasoRecibo, setPasoRecibo]               = useState<'form' | 'recibo'>('form');
  const [desglose, setDesglose]   = useState<DesgloseItem[]>([{ monto: 0, metodo: 'Efectivo' }]);
  const [notasCobro, setNotasCobro] = useState('');
  const [comprobanteFile, setComprobanteFile]     = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const comprobanteInputRef = useRef<HTMLInputElement>(null);

  // ── Modal ticket ────────────────────────────────────────────
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketData, setTicketData]               = useState<ReciboImpresion | null>(null);

  // ── Modal generar ───────────────────────────────────────────
  const [isGenerarModalOpen, setIsGenerarModalOpen] = useState(false);
  const [genMes, setGenMes]             = useState(getMesActual());
  const [genMonto, setGenMonto]         = useState('');
  const [genDiaCobro, setGenDiaCobro]   = useState('1');
  const [genSobrescribir, setGenSobrescribir] = useState(false);
  const [genError, setGenError]         = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Bootstrap: obtener escuela ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await import('../../api/axios').then(m =>
          m.default.get<any>('/escuelas/escuelas/mi-escuela')
        );
        const d = res.data;
        setIdescuela(d?.idescuela ?? d?.escuela?.idescuela ?? null);
        setEscuelaInfo({
          nombre: d?.nombreescuela ?? d?.escuela?.nombreescuela ?? 'Mi Escuela',
          logo:   d?.logo_url      ?? d?.escuela?.logo_url      ?? null,
          ciudad: d?.ciudad        ?? d?.escuela?.ciudad        ?? '',
          tel:    d?.telefono_oficina ?? d?.escuela?.telefono_oficina ?? '',
        });
      } catch {
        setErrorMsg('No se pudo obtener la escuela. Verifica tu sesión.');
      }
    })();
  }, []);

  // ── Carga de pagos ──────────────────────────────────────────
  const loadPagos = useCallback(async () => {
    if (idescuela === null) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await finanzasService.listarPagos(tab, idescuela);
      setPagos(Array.isArray(data) ? data : []);
    } catch {
      setErrorMsg('Error al cargar los pagos. Intenta de nuevo.');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [tab, idescuela]);

  useEffect(() => { loadPagos(); }, [loadPagos]);

  // ── Cargar historial (tab 1) ────────────────────────────────
  const loadHistorial = useCallback(async () => {
    if (!idescuela) return;
    setHistLoading(true);
    try {
      const p = new URLSearchParams();
      p.set('pagina',    String(histPagina));
      p.set('por_pagina', '20');
      if (histEstatus) p.set('estatus',      histEstatus);
      if (histTipo)    p.set('id_tipo_pago', histTipo);
      if (histMetodo)  p.set('metodo_pago',  histMetodo);
      if (histBuscar)  p.set('buscar',       histBuscar);
      if (histDesde)   p.set('fecha_desde',  histDesde);
      if (histHasta)   p.set('fecha_hasta',  histHasta);
      const res = await import('../../api/axios').then(m =>
        m.default.get<HistorialResponse>(`/finanzas/pagos/escuela/${idescuela}/historial?${p}`)
      );
      setHistorial(res.data);
    } catch (e) {
      console.error('Error historial:', e);
    } finally {
      setHistLoading(false);
    }
  }, [idescuela, histPagina, histEstatus, histTipo, histMetodo, histBuscar, histDesde, histHasta]);

  useEffect(() => {
    if (tab === 1) loadHistorial();
  }, [tab, loadHistorial]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3500);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Derivados ───────────────────────────────────────────────
  const totalMonto = useMemo(() => pagos.reduce((a, p) => a + (p.monto || 0), 0), [pagos]);

  const alumnosUnicos = useMemo(() => {
    const map = new Map<number, string>();
    pagos.forEach(p => {
      if (p.idalumno && p.alumno)
        map.set(p.idalumno, `${p.alumno.nombres ?? ''} ${p.alumno.apellidopaterno ?? ''}`.trim());
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [pagos]);

  const filteredPagos = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return pagos.filter(p => {
      const nombre = `${p.alumno?.nombres ?? ''} ${p.alumno?.apellidopaterno ?? ''}`.toLowerCase();
      return (nombre.includes(q) || (p.concepto ?? '').toLowerCase().includes(q))
        && (filtroAlumno === '' || String(p.idalumno) === filtroAlumno);
    });
  }, [pagos, searchTerm, filtroAlumno]);

  const totalDesglose      = desglose.reduce((a, d) => a + Number(d.monto || 0), 0);
  const diferenciaDesglose = selectedPago ? totalDesglose - selectedPago.monto : 0;

  // ── Handlers ────────────────────────────────────────────────
  const handleOpenCobro = (pago: Pago) => {
    setDetallePago(null);
    setSelectedPago(pago);
    setDesglose([{ monto: pago.monto, metodo: 'Efectivo' }]);
    setNotasCobro('');
    setPasoRecibo('form');
    setComprobanteFile(null);
    setComprobantePreview(null);
    setIsCobrarModalOpen(true);
  };

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprobanteFile(file);
    const reader = new FileReader();
    reader.onload = ev => setComprobantePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirmarConComprobante = async () => {
    if (!selectedPago || !comprobanteFile) return;
    setSaving(true);
    try {
      await finanzasService.registrarCobro(selectedPago.idpago, {
        desglose_pagos: desglose, notas: notasCobro,
      } as CobroRequestDTO);
      await finanzasService.subirComprobante(selectedPago.idpago, selectedPago.idalumno, comprobanteFile, notasCobro);
      setIsCobrarModalOpen(false);
      setSuccessMsg(`Cobro registrado — ${selectedPago.alumno?.nombres ?? 'Alumno'}`);
      loadPagos();
    } catch (err: any) {
      const d = err?.response?.data?.detail;
      alert(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg ?? JSON.stringify(x)).join(' · ') : err?.message ?? 'Error al procesar el cobro.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmarCobro = () => {
    if (!selectedPago) return;
    if (Math.abs(diferenciaDesglose) > 0.01) {
      alert(`El monto debe sumar exactamente $${selectedPago.monto}`);
      return;
    }
    // Avanzar al paso de recibo — el cobro se registra al subir comprobante
    setPasoRecibo('recibo');
  };

  const handleVerTicket = async (pago: Pago) => {
    setDetallePago(null);
    setSelectedPago(pago);
    setIsTicketModalOpen(true);
    setTicketData(null);
    try {
      setTicketData(await finanzasService.obtenerReciboImpresion(pago.idpago));
    } catch { /* silencioso */ }
  };

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedPago) return;
    setSaving(true);
    try {
      await finanzasService.subirComprobante(selectedPago.idpago, e.target.files[0]);
      setSuccessMsg('Comprobante subido correctamente');
      loadPagos();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Error al subir el comprobante.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerarMes = async () => {
    if (!idescuela) return;
    const monto = parseFloat(genMonto);
    const dia   = parseInt(genDiaCobro, 10);
    if (!genMes.match(/^\d{4}-\d{2}$/)) { setGenError('Formato de mes inválido'); return; }
    if (isNaN(monto) || monto <= 0)      { setGenError('El monto debe ser mayor a $0'); return; }
    if (isNaN(dia) || dia < 1 || dia > 28) { setGenError('El día debe estar entre 1 y 28'); return; }
    setGenError(null);
    setSaving(true);
    try {
      await finanzasService.generarMensualidadesMes({
        idescuela, mes_correspondiente: genMes,
        monto_default: monto, dia_cobro_default: dia,
        sobrescribir_existentes: genSobrescribir,
      } as GenerarMensualidadDTO);
      setIsGenerarModalOpen(false);
      setSuccessMsg(`Mensualidades generadas para ${genMes}`);
      loadPagos();
    } catch (err: any) {
      setGenError(err?.response?.data?.detail ?? 'Error al generar mensualidades.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificar = async (pago: Pago) => {
    if (notificando) return;
    setNotificando(pago.idpago);
    try {
      await import('../../api/axios').then(m =>
        m.default.post('/finanzas/pagos/notificar', {
          idalumno: pago.idalumno,
          idpago:   pago.idpago,
          tipo:     'pago_pendiente',
        })
      );
      setSuccessMsg(`Notificación enviada — ${pago.alumno?.nombres ?? 'Alumno'}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let msg = 'Error al enviar notificación';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((x: any) => x.msg ?? JSON.stringify(x)).join(' · ');
      } else if (detail) {
        msg = JSON.stringify(detail);
      }
      // Mostrar en toast de error en lugar de alert nativo
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setNotificando(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-[var(--color-text)] animate-in fade-in duration-500 pb-20">

      {/* Toast éxito */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border border-green-500"
            style={{ backgroundColor: '#16a34a', color: 'white' }}
          >
            <CheckCircle2 size={20} />
            <span className="text-sm font-black uppercase tracking-tight">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border border-red-500 max-w-sm"
            style={{ backgroundColor: '#dc2626', color: 'white' }}
          >
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="text-sm font-black tracking-tight">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-70 hover:opacity-100"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="bg-[var(--color-card)] backdrop-blur-2xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)] shadow-inner flex-shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Caja y Finanzas</h2>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-40 leading-none text-[var(--color-text-muted)]">Gestión Técnica de Ingresos</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setGenError(null); setIsGenerarModalOpen(true); }}
            className="w-full md:w-auto px-6 h-12 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg border transition-all hover:brightness-110"
            style={{ boxShadow: '0 8px 24px -4px var(--color-primary)40' }}
          >
            <PlusCircle size={18} />
            <span className="text-xs font-black uppercase italic tracking-tighter">Generar Mensualidades</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-[var(--color-background)] p-4 rounded-3xl border border-[var(--color-border)] flex flex-col items-start shadow-inner">
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest leading-none mb-2 text-[var(--color-text)]">
              {tab === 0 ? 'Total por Recaudar' : 'Total Recaudado'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={20} className="text-[var(--color-primary)]" />
              <span className="text-3xl font-black tracking-tighter leading-none text-[var(--color-primary)]">
                {totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="bg-[var(--color-background)] p-4 rounded-3xl border border-[var(--color-border)] flex flex-col items-start shadow-inner">
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest leading-none mb-2 text-[var(--color-text)]">Movimientos</span>
            <div className="flex items-center gap-2 mt-1">
              <History size={20} className="text-[var(--color-primary)]" />
              <span className="text-3xl font-black tracking-tighter leading-none text-[var(--color-text)]">{pagos.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex p-1.5 bg-[var(--color-card)] backdrop-blur-xl rounded-[1.8rem] border border-[var(--color-border)] shadow-xl mx-auto max-w-md">
        {(['Pendientes', 'Historial'] as const).map((label, idx) => (
          <button
            key={label}
            onClick={() => setTab(idx as 0 | 1)}
            className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            style={tab === idx
              ? { backgroundColor: 'var(--color-primary)', color: 'white', boxShadow: '0 4px 16px -4px var(--color-primary)50' }
              : { opacity: 0.4, color: 'var(--color-text)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 0 — PENDIENTES: buscador + chips de alumno
      ══════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="relative group">
            <Search className="absolute left-5 top-1 -translate-y-1 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por alumno o concepto..."
              className="w-full h-14 pl-14 pr-10 bg-[var(--color-card)] backdrop-blur-xl rounded-[1.5rem] border border-[var(--color-border)] outline-none font-bold text-sm text-[var(--color-text)] shadow-xl transition-all placeholder:opacity-40 focus:bg-[var(--color-card)] focus:border-[var(--color-primary)]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1 -translate-y-1 opacity-40 hover:opacity-100 transition-all text-[var(--color-text)]">
                <X size={16} />
              </button>
            )}
          </div>
          {alumnosUnicos.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-30 text-[var(--color-text)] whitespace-nowrap">Alumno:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setFiltroAlumno('')}
                  className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border"
                  style={filtroAlumno === ''
                    ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'transparent' }
                    : { opacity: 0.5, color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                  Todos ({pagos.length})
                </button>
                {alumnosUnicos.map(([idalumno, nombre]) => {
                  const count = pagos.filter(p => p.idalumno === idalumno).length;
                  const isActive = filtroAlumno === String(idalumno);
                  return (
                    <button key={idalumno}
                      onClick={() => setFiltroAlumno(isActive ? '' : String(idalumno))}
                      className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5"
                      style={isActive
                        ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'transparent' }
                        : { backgroundColor: 'var(--color-card)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                      {nombre}
                      <span className="text-[7px] px-1.5 py-0.5 rounded-full font-black"
                        style={isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }
                          : { backgroundColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 0 — PENDIENTES: grid de tarjetas
      ══════════════════════════════════════════════════ */}
      {tab === 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="col-span-full py-32 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic text-[var(--color-text)]">Consultando servidor...</p>
                </div>
              ) : filteredPagos.length === 0 ? (
                <div className="col-span-full py-32 text-center opacity-30 italic font-black uppercase text-sm tracking-widest text-[var(--color-text)]">
                  Sin pagos pendientes
                </div>
              ) : filteredPagos.map(p => (
                <motion.div
                  layout key={p.idpago}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-[var(--color-card)] backdrop-blur-xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl overflow-hidden transition-all hover:bg-[var(--color-card)] cursor-pointer"
                  onClick={() => setDetallePago(p)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-[2.5rem]"
                    style={{ backgroundColor: estatusColor(p.estatus ?? 0) }} />

                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl text-[var(--color-primary)]"
                          style={{ backgroundColor: 'var(--color-primary)15' }}>
                          <Calendar size={14} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--color-text)]">
                          {tipoPagoLabel(p.id_tipo_pago)}
                        </span>
                        <span
                          className="ml-auto text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${estatusColor(p.estatus ?? 0)}20`, color: estatusColor(p.estatus ?? 0) }}
                        >
                          {estatusLabel(p.estatus ?? 0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--color-text)] truncate leading-none">
                        {p.alumno?.nombres} {p.alumno?.apellidopaterno}
                      </h3>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] mt-1 truncate italic leading-none">{p.concepto}</p>
                      <div className="flex items-center gap-4 mt-5">
                        <div className="flex items-center gap-1.5 font-black tracking-tighter leading-none">
                          <DollarSign size={14} className="text-[var(--color-primary)]" />
                          <span className="text-xl text-[var(--color-text)]">
                            {p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {p.metodo_pago && (
                          <span className="px-3 py-1 bg-[var(--color-card)] rounded-lg text-[8px] font-black uppercase tracking-widest border border-[var(--color-border)] opacity-60">
                            {p.metodo_pago}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botones rápidos — detienen propagación */}
                    <div className="flex flex-col items-end gap-3" onClick={e => e.stopPropagation()}>
                      <span className="text-[8px] font-black opacity-30 leading-none text-[var(--color-text-muted)]">
                        {p.fecharegistro ? new Date(p.fecharegistro).toLocaleDateString('es-MX') : '—'}
                      </span>
                      <div className="flex flex-col gap-2">
                        {p.estatus === 0 ? (
                          <>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleOpenCobro(p)}
                              className="w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all hover:brightness-110"
                              style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px -4px var(--color-primary)60' }}
                              title="Cobrar"
                            >
                              <ArrowUpRight size={22} strokeWidth={3} />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleVerTicket(p)}
                              className="w-12 h-12 bg-[var(--color-card)] text-[var(--color-text-muted)] rounded-2xl flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-all shadow-lg"
                              title="Ver Cargo"
                            >
                              <Printer size={22} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleNotificar(p)}
                              disabled={notificando === p.idpago}
                              className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-lg disabled:opacity-50"
                              style={{ backgroundColor: '#f97316', borderColor: 'transparent', color: 'white', boxShadow: '0 4px 16px -4px #f9731660' }}
                              title="Notificar al tutor por correo"
                            >
                              {notificando === p.idpago
                                ? <Loader2 className="animate-spin" size={18} />
                                : <BellRing size={18} />
                              }
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleVerTicket(p)}
                              className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-lg"
                              style={{ backgroundColor: 'var(--color-primary)15', borderColor: 'var(--color-primary)30', color: 'var(--color-primary)' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)15')}
                              title="Ver Recibo"
                            >
                              <Receipt size={22} />
                            </motion.button>
                            {p.estatus === 1 && (
                              <button
                                onClick={() => { setSelectedPago(p); fileInputRef.current?.click(); }}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all"
                                style={p.url_comprobante
                                  ? { backgroundColor: 'var(--color-primary)15', borderColor: 'var(--color-primary)30', color: 'var(--color-primary)' }
                                  : { backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }
                                }
                                title={p.url_comprobante ? 'Comprobante subido' : 'Subir Comprobante'}
                              >
                                {saving && selectedPago?.idpago === p.idpago
                                  ? <Loader2 className="animate-spin" size={18} />
                                  : <ImageIcon size={20} />
                                }
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleUploadComprobante} className="hidden" accept="image/*" />
        </>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 1 — HISTORIAL: filtros avanzados
      ══════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Stats del historial */}
          {historial && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total',      val: `$${historial.total_monto.toLocaleString('es-MX',{minimumFractionDigits:2})}`, color: 'var(--color-primary)' },
                { label: 'Pagados',    val: String(historial.total_pagados),    color: '#10b981' },
                { label: 'Pendientes', val: String(historial.total_pendientes), color: '#f97316' },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-2xl p-3 text-center"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  <p className="text-lg font-black tracking-tighter leading-none" style={{ color }}>{val}</p>
                  <p className="text-[7px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Buscador */}
          <div className="relative group">
            <Search className="absolute left-5 top-1 -translate-y-1 transition-colors" size={18}
              style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="Buscar alumno o concepto..."
              className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border outline-none font-bold text-sm shadow-xl transition-all placeholder:opacity-40"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              value={histBuscar} onChange={e => { setHistBuscar(e.target.value); setHistPagina(1); }} />
            {histBuscar && (
              <button onClick={() => { setHistBuscar(''); setHistPagina(1); }}
                className="absolute right-4 top-1 -translate-y-1 opacity-40 hover:opacity-100 transition-all"
                style={{ color: 'var(--color-text)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros desplegables */}
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => setHistFiltrosOpen(v => !v)}
            className="w-full h-10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider"
            style={{
              background: [histEstatus,histTipo,histMetodo,histDesde,histHasta].some(Boolean) ? 'var(--color-primary)15' : 'var(--color-card)',
              border: `1px solid ${[histEstatus,histTipo,histMetodo,histDesde,histHasta].some(Boolean) ? 'var(--color-primary)50' : 'var(--color-border)'}`,
              color: [histEstatus,histTipo,histMetodo,histDesde,histHasta].some(Boolean) ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}>
            <Filter size={13} />
            {[histEstatus,histTipo,histMetodo,histDesde,histHasta].filter(Boolean).length > 0
              ? `${[histEstatus,histTipo,histMetodo,histDesde,histHasta].filter(Boolean).length} filtros activos`
              : 'Filtrar por fecha, tipo o método'}
          </motion.button>

          <AnimatePresence>
            {histFiltrosOpen && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="overflow-hidden">
                <div className="rounded-[2rem] p-4 space-y-3"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label:'Estatus', val:histEstatus, set:setHistEstatus, opts:[['','Todos'],['1','Pagado'],['0','Pendiente']] },
                      { label:'Tipo',    val:histTipo,    set:setHistTipo,    opts:[['','Todos'],['1','Mensualidad'],['2','Inscripción'],['4','Torneo'],['3','Otro']] },
                      { label:'Método',  val:histMetodo,  set:setHistMetodo,  opts:[['','Todos'],['Efectivo','Efectivo'],['Transferencia','Transferencia'],['Tarjeta','Tarjeta']] },
                    ].map(({ label, val, set, opts }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-[7px] font-black uppercase tracking-widest ml-1" style={{ color:'var(--color-text-muted)' }}>{label}</label>
                        <select value={val} onChange={e => { set(e.target.value); setHistPagina(1); }}
                          className="w-full h-9 px-2 rounded-xl text-[9px] font-bold outline-none appearance-none"
                          style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', color:'var(--color-text)' }}>
                          {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label:'Desde', val:histDesde, set:setHistDesde },
                      { label:'Hasta', val:histHasta, set:setHistHasta },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-[7px] font-black uppercase tracking-widest ml-1" style={{ color:'var(--color-text-muted)' }}>{label}</label>
                        <input type="date" value={val} onChange={e => { set(e.target.value); setHistPagina(1); }}
                          className="w-full h-9 px-2 rounded-xl text-[9px] font-bold outline-none"
                          style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', color:'var(--color-text)' }} />
                      </div>
                    ))}
                  </div>
                  {[histEstatus,histTipo,histMetodo,histDesde,histHasta].some(Boolean) && (
                    <button onClick={() => { setHistEstatus(''); setHistTipo(''); setHistMetodo(''); setHistDesde(''); setHistHasta(''); setHistPagina(1); }}
                      className="w-full h-9 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider"
                      style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', color:'var(--color-text-muted)' }}>
                      <X size={11} /> Limpiar filtros
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* ══════════════════════════════════════════════════
          TAB 1 — HISTORIAL: lista de pagos
      ══════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div className="max-w-2xl mx-auto space-y-3">
          {histLoading ? (
            <div className="py-32 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic text-[var(--color-text)]">
                Cargando historial...
              </p>
            </div>
          ) : !historial || historial.pagos.length === 0 ? (
            <div className="py-32 text-center opacity-30 italic font-black uppercase text-sm tracking-widest text-[var(--color-text)]">
              Sin registros en el historial
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {historial.pagos.map((p: PagoHistorial) => (
                  <motion.div
                    key={p.idpago}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] shadow-xl overflow-hidden flex items-center gap-4 cursor-pointer"
                    style={{ transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)40')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    onClick={() => setDetallePago(p as unknown as Pago)}
                  >
                    {/* Barra lateral de estatus */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[2rem]"
                      style={{ backgroundColor: estatusColor(p.estatus ?? 0) }} />

                    {/* Ícono tipo */}
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)15', color: 'var(--color-primary)' }}>
                      <Receipt size={18} />
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${estatusColor(p.estatus ?? 0)}20`, color: estatusColor(p.estatus ?? 0) }}
                        >
                          {estatusLabel(p.estatus ?? 0)}
                        </span>
                        <span className="text-[8px] font-bold uppercase opacity-40 text-[var(--color-text)]">
                          {TIPO_PAGO_LABEL[p.id_tipo_pago] ?? 'Otro'}
                        </span>
                      </div>
                      <p className="text-sm font-black italic uppercase tracking-tighter text-[var(--color-text)] truncate leading-tight">
                        {p.alumno?.nombres} {p.alumno?.apellidopaterno}
                      </p>
                      <p className="text-[10px] font-bold opacity-50 text-[var(--color-text-muted)] truncate">
                        {p.concepto}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {p.metodo_pago && (
                          <span
                            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                          >
                            {p.metodo_pago}
                          </span>
                        )}
                        {p.fecha_pago && (
                          <span className="text-[8px] font-bold opacity-40 text-[var(--color-text)] flex items-center gap-1">
                            <Calendar size={9} />
                            {new Date(p.fecha_pago).toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Monto + comprobante */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xl font-black leading-none" style={{ color: 'var(--color-primary)' }}>
                        ${Number(p.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      {p.url_comprobante && (
                        <a
                          href={p.url_comprobante}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[8px] font-black uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                          style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary)10' }}
                        >
                          <ExternalLink size={10} /> Comprobante
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Paginación */}
              {historial.total_paginas > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2 pb-4">
                  <button
                    disabled={histPagina <= 1}
                    onClick={() => setHistPagina(p => p - 1)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all disabled:opacity-30"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-card)' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-50 text-[var(--color-text)]">
                    Pág. {histPagina} / {historial.total_paginas}
                    {historial.total_registros && (
                      <span className="ml-2 opacity-60">({historial.total_registros} registros)</span>
                    )}
                  </span>
                  <button
                    disabled={histPagina >= historial.total_paginas}
                    onClick={() => setHistPagina(p => p + 1)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all disabled:opacity-30"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-card)' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════
          MODAL — DETALLE ALUMNO
      ═══════════════════════════════════════════════════════ */}
      <ModalDetalleAlumno
        pago={detallePago}
        todosPagos={[...pagos, ...(historial?.pagos ?? []).map(p => p as unknown as Pago)]}
        onClose={() => setDetallePago(null)}
        onCobrar={handleOpenCobro}
        onTicket={handleVerTicket}
        onNotificar={handleNotificar}
      />

      {/* ═══════════════════════════════════════════════════════
          MODAL — REGISTRAR COBRO
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isCobrarModalOpen && selectedPago && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.95)" }}
              onClick={() => setIsCobrarModalOpen(false)} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3rem] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* ── HEADER ── */}
              <div className="p-6 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, var(--color-primary)))' }}>
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none"><DollarSign size={100} /></div>
                <div className="flex items-center gap-3 relative z-10">
                  {pasoRecibo === 'form'
                    ? <><div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }}><DollarSign size={20} /></div>
                       <div>
                         <p className="text-lg font-black italic uppercase tracking-tighter leading-none">Registrar Pago</p>
                         <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Módulo de Tesorería</p>
                       </div></>
                    : <><motion.button whileTap={{ scale: 0.9 }} onClick={() => setPasoRecibo('form')}
                         className="p-2 rounded-xl mr-1" style={{ background: "rgba(255,255,255,0.2)" }}>
                         <ArrowLeft size={16} />
                       </motion.button>
                       <div>
                         <p className="text-lg font-black italic uppercase tracking-tighter leading-none">Recibo de Pago</p>
                         <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Sube el comprobante firmado</p>
                       </div></>
                  }
                </div>
                <button onClick={() => setIsCobrarModalOpen(false)} className="p-2.5 rounded-full relative z-10" style={{ background: "rgba(0,0,0,0.2)" }}><X size={18} /></button>
              </div>

              <AnimatePresence mode="wait">

                {/* ════════════════════════════════
                    PASO 1 — FORMULARIO DE COBRO
                ════════════════════════════════ */}
                {pasoRecibo === 'form' && (
                  <motion.div key="form"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="p-7 space-y-6 text-left overflow-y-auto">

                    {/* Info alumno */}
                    <div className="p-5 rounded-[2rem] border border-[var(--color-border)]"
                      style={{ background: 'var(--color-background)' }}>
                      <div className="flex items-center gap-2 mb-2 opacity-50">
                        <UserCircle size={12} style={{ color: 'var(--color-text)' }} />
                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>Alumno en ventanilla</span>
                      </div>
                      <p className="text-lg font-black italic" style={{ color: 'var(--color-text)' }}>
                        {selectedPago.alumno?.nombres} {selectedPago.alumno?.apellidopaterno}
                      </p>
                      <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <span className="text-xs font-bold opacity-60" style={{ color: 'var(--color-text-muted)' }}>{selectedPago.concepto}</span>
                        <span className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>
                          ${selectedPago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Desglose */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                          <CreditCard size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Forma de Pago</span>
                        </div>
                        <button onClick={() => setDesglose([...desglose, { monto: 0, metodo: 'Transferencia' }])}
                          className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border"
                          style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)30', background: 'var(--color-primary)10' }}>
                          + Dividir
                        </button>
                      </div>
                      {desglose.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-3 items-end">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase ml-2 opacity-40 tracking-widest" style={{ color: 'var(--color-text)' }}>Monto</label>
                            <input type="number" min="0" step="0.01"
                              className="w-full h-11 px-4 rounded-2xl border outline-none font-black text-sm shadow-inner"
                              style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                              value={item.monto}
                              onChange={e => { const u=[...desglose]; u[idx]={...u[idx],monto:Number(e.target.value)}; setDesglose(u); }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase ml-2 opacity-40 tracking-widest" style={{ color: 'var(--color-text)' }}>Método</label>
                            <div className="flex gap-2">
                              <select className="flex-1 h-11 px-3 rounded-2xl border outline-none font-black text-[11px] uppercase appearance-none cursor-pointer shadow-inner"
                                style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                                value={item.metodo}
                                onChange={e => { const u=[...desglose]; u[idx]={...u[idx],metodo:e.target.value as MetodoPago}; setDesglose(u); }}>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Otro">Otro</option>
                              </select>
                              {desglose.length > 1 && (
                                <button onClick={() => setDesglose(desglose.filter((_,i) => i!==idx))}
                                  className="w-9 h-9 self-center flex items-center justify-center rounded-xl transition-all"
                                  style={{ color: 'var(--color-text-muted)' }}>
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between px-3 py-2 rounded-xl text-xs font-black"
                      style={Math.abs(diferenciaDesglose) < 0.01 ? { background: '#10b98118', color: '#4ade80' } : { background: '#ef444418', color: '#f87171' }}>
                        <span>Total ingresado</span>
                        <span>${totalDesglose.toLocaleString('es-MX',{minimumFractionDigits:2})}
                          {Math.abs(diferenciaDesglose) > 0.01 && <span className="ml-2 opacity-70">({diferenciaDesglose>0?'+':''}{diferenciaDesglose.toFixed(2)})</span>}
                        </span>
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase ml-2 opacity-40 tracking-widest" style={{ color: 'var(--color-text)' }}>Notas internas</label>
                      <textarea rows={2} className="w-full p-4 rounded-2xl border outline-none font-bold text-sm resize-none shadow-inner"
                        style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)50'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        value={notasCobro} onChange={e => setNotasCobro(e.target.value)}
                        placeholder="Observaciones del cobro..." />
                    </div>

                    {/* Botón avanzar → recibo */}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirmarCobro}
                      disabled={Math.abs(diferenciaDesglose) > 0.01}
                      className="w-full h-14 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary)cc)', boxShadow: '0 6px 24px -6px var(--color-primary)60' }}>
                      <Printer size={20} />
                      <span className="text-sm uppercase italic tracking-tighter">Imprimir Recibo de Pago</span>
                    </motion.button>
                  </motion.div>
                )}

                {/* ════════════════════════════════
                    PASO 2 — RECIBO + COMPROBANTE
                ════════════════════════════════ */}
                {pasoRecibo === 'recibo' && (
                  <motion.div key="recibo"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col overflow-y-auto">

                    {/* ── RECIBO IMPRIMIBLE ── */}
                    <div id="recibo-print" style={{ background: '#fff', color: '#111', fontFamily: 'monospace' }}>

                      {/* Encabezado */}
                      <div className="flex items-start justify-between p-5 pb-4" style={{ borderBottom: '2px solid #111' }}>
                        <div className="flex items-center gap-3">
                          {escuelaInfo.logo
                            ? <img src={escuelaInfo.logo} alt="Logo" className="w-14 h-14 rounded-xl object-cover" style={{ border: '2px solid #111' }} />
                            : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[8px] font-black uppercase text-center leading-tight"
                                style={{ border: '2px solid #111', background: '#f5f5f5', color: '#555' }}>LOGO</div>
                          }
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight">{escuelaInfo.nombre || 'Dragon Negro Dojo'}</p>
                            {escuelaInfo.ciudad && <p className="text-[9px] font-bold" style={{ color: '#666' }}>{escuelaInfo.ciudad}</p>}
                            {escuelaInfo.tel    && <p className="text-[9px] font-bold" style={{ color: '#666' }}>Tel: {escuelaInfo.tel}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#888' }}>Recibo de Pago</p>
                          <p className="text-2xl font-black tracking-tight mt-0.5">N° {String(selectedPago.idpago).padStart(6,'0')}</p>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block"
                            style={{ background: '#fef3c7', color: '#92400e' }}>PENDIENTE</span>
                        </div>
                      </div>

                      {/* Cuerpo */}
                      <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: '1px dashed #ccc' }}>
                        {[
                          { label: 'Fecha de emisión', value: new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}) },
                          { label: 'Recibí de',        value: `${selectedPago.alumno?.nombres ?? ''} ${selectedPago.alumno?.apellidopaterno ?? ''}`.trim() || '—' },
                          { label: 'Por concepto de',  value: selectedPago.concepto ?? '—' },
                          { label: 'Forma de pago',    value: desglose.map(d => `${d.metodo}${desglose.length>1?' $'+d.monto:''}`).join(' + ') },
                          { label: 'Recibido por',     value: escuelaInfo.nombre || 'Dragon Negro Dojo' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-start gap-4">
                            <span className="text-[9px] font-black uppercase tracking-wider flex-shrink-0" style={{ color: '#777' }}>{label}:</span>
                            <span className="text-[10px] font-bold text-right" style={{ color: '#111' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between px-5 py-4" style={{ background: '#f9f9f9', borderBottom: '1px dashed #ccc' }}>
                        <span className="text-[11px] font-black uppercase tracking-widest">Total a Pagar</span>
                        <span className="text-3xl font-black tracking-tight">
                          ${selectedPago.monto.toLocaleString('es-MX',{minimumFractionDigits:2})}
                        </span>
                      </div>

                      {/* Pie firma */}
                      <div className="flex items-end justify-between px-5 py-5">
                        <div style={{ borderTop: '1px solid #111', paddingTop: 6, minWidth: 110 }}>
                          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#777' }}>Firma / Sello</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#777' }}>Documento válido como comprobante de pago</p>
                          <p className="text-[9px] font-black mt-1">{new Date().toLocaleDateString('es-MX')}</p>
                        </div>
                      </div>

                      {/* Talón */}
                      <div className="mx-5 mb-4 px-4 py-2 flex justify-between" style={{ border: '1px dashed #ccc', borderRadius: 8 }}>
                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#aaa' }}>
                          Folio: {String(selectedPago.idpago).padStart(6,'0')}
                        </span>
                        <span className="text-[8px] font-black" style={{ color: '#aaa' }}>% ─────────────</span>
                      </div>
                    </div>

                    {/* ── SECCIÓN IMPRIMIR + COMPROBANTE ── */}
                    <div className="p-5 space-y-4" style={{ background: 'var(--color-card)', borderTop: '1px solid var(--color-border)' }}>

                      {/* Botón imprimir */}
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => window.print()}
                        className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                        <Printer size={16} /> Imprimir Recibo
                      </motion.button>

                      {/* Separador */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                          Luego sube el recibo firmado
                        </span>
                        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                      </div>

                      {/* Upload comprobante */}
                      <motion.div whileTap={{ scale: 0.98 }}
                        onClick={() => comprobanteInputRef.current?.click()}
                        className="w-full rounded-[1.5rem] border-2 border-dashed cursor-pointer overflow-hidden"
                        style={{ borderColor: comprobanteFile ? '#10b98150' : 'var(--color-primary)40', background: comprobanteFile ? '#10b98108' : 'var(--color-background)', minHeight: 80 }}>
                        {comprobantePreview ? (
                          <div className="relative">
                            <img src={comprobantePreview} alt="Comprobante" className="w-full max-h-32 object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(0,0,0,0.5)' }}>
                              <span className="text-white text-[9px] font-black uppercase">Cambiar</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 py-5">
                            <Upload size={18} style={{ color: 'var(--color-primary)' }} />
                            <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                              Subir recibo firmado
                            </p>
                            <p className="text-[8px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                              JPG o PNG — foto del recibo firmado
                            </p>
                          </div>
                        )}
                      </motion.div>

                      {comprobanteFile && (
                        <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                          className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: '#10b98112', border: '1px solid #10b98130' }}>
                          <span className="text-[9px] font-bold truncate" style={{ color: '#10b981' }}>{comprobanteFile.name}</span>
                          <button onClick={() => { setComprobanteFile(null); setComprobantePreview(null); }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#10b981', marginLeft:8 }}>
                            <X size={12} />
                          </button>
                        </motion.div>
                      )}

                      <input type="file" ref={comprobanteInputRef} onChange={handleComprobanteChange}
                        className="hidden" accept="image/*" />

                      {/* Botón confirmar pago final */}
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirmarConComprobante}
                        disabled={saving || !comprobanteFile}
                        className="w-full h-14 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: comprobanteFile ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--color-surface)', boxShadow: comprobanteFile ? '0 6px 24px -6px #10b98160' : 'none', color: comprobanteFile ? '#fff' : 'var(--color-text-muted)' }}>
                        {saving
                          ? <Loader2 className="animate-spin" size={20} />
                          : <><CheckCircle2 size={20} /><span className="text-sm uppercase italic tracking-tighter">Confirmar Pago</span></>
                        }
                      </motion.button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          MODAL — TICKET
      ═══════════════════════════════════════════════════════ */}
      <ModalReciboImpresion
        open={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        data={ticketData}
      />

      {/* ═══════════════════════════════════════════════════════
          MODAL — GENERAR MENSUALIDADES
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isGenerarModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.95)" }}
              onClick={() => setIsGenerarModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3.5rem] border border-[var(--color-border)] shadow-2xl p-10 space-y-8 flex flex-col overflow-y-auto max-h-[90vh] text-left"
            >
              <button onClick={() => setIsGenerarModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full opacity-40 hover:opacity-100 hover:bg-[var(--color-border)] transition-all text-[var(--color-text)]"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center border shadow-inner"
                  style={{ backgroundColor: 'var(--color-primary)15', borderColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}
                >
                  <Calendar size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-none">Cargar Mensualidades</h3>
                <p className="text-sm font-bold text-[var(--color-text-muted)] leading-relaxed opacity-70 italic">
                  Se crearán cargos pendientes para todos los alumnos activos. Los duplicados se ignoran automáticamente.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase ml-3 opacity-40 tracking-widest text-[var(--color-text)]">Mes</label>
                  <input type="month"
                    className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] outline-none font-black text-sm text-[var(--color-text)] shadow-inner"
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    value={genMes} onChange={e => setGenMes(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase ml-3 opacity-40 tracking-widest text-[var(--color-text)]">Monto por defecto ($)</label>
                    <input type="number" min="1" step="0.01" placeholder="Ej. 500"
                      className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] outline-none font-black text-sm text-[var(--color-text)] shadow-inner"
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                      value={genMonto} onChange={e => setGenMonto(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase ml-3 opacity-40 tracking-widest text-[var(--color-text)]">Día de cobro (1-28)</label>
                    <input type="number" min="1" max="28" placeholder="1"
                      className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] outline-none font-black text-sm text-[var(--color-text)] shadow-inner"
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                      value={genDiaCobro} onChange={e => setGenDiaCobro(e.target.value)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-4 cursor-pointer">
                  <div
                    onClick={() => setGenSobrescribir(!genSobrescribir)}
                    className="w-12 h-6 rounded-full border-2 transition-all relative"
                    style={genSobrescribir
                      ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                      : { backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', opacity: 0.4 }
                    }
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${genSobrescribir ? 'left-6' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest opacity-60 text-[var(--color-text)]">
                    Sobrescribir cargos existentes
                  </span>
                </label>
              </div>

              <div className="p-5 rounded-3xl border border-dashed flex items-start gap-4"
                style={{ backgroundColor: 'var(--color-primary)08', borderColor: 'var(--color-primary)30' }}
              >
                <ShieldAlert size={20} style={{ color: 'var(--color-primary)', marginTop: 2 }} />
                <p className="text-[10px] font-black uppercase tracking-widest leading-normal" style={{ color: 'var(--color-primary)' }}>
                  El monto individual configurado por alumno prevalece sobre el monto por defecto.
                </p>
              </div>

              {genError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500 border border-red-500 text-red-400">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold">{genError}</span>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleGenerarMes} disabled={saving}
                className="w-full h-16 text-white font-black rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50 hover:brightness-110 transition-all"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 8px 32px -8px var(--color-primary)50' }}
              >
                {saving
                  ? <Loader2 className="animate-spin" size={24} />
                  : <><ArrowDownLeft size={24} /> Ejecutar Proceso Masivo</>
                }
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CajaFinanzas;