// ============================================================
//  src/views/profesor/CajaProfesor.tsx
//  Vista de finanzas del Profesor — solo alumnos asignados.
//  Idéntico a CajaFinanzas, sin: generar mensualidades,
//  configurar precios, ni notificaciones masivas por lote.
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Search, ArrowDownLeft,
  DollarSign, Calendar, CreditCard, PlusCircle,
  Loader2, CheckCircle2, X, History, ShieldAlert,
  UserCircle, Printer, Receipt, BookOpen, RefreshCw,
  AlertCircle, TrendingUp, FileText, Clock, AlertTriangle,
  ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, Filter,
  Bell, Users,
} from 'lucide-react';

import { finanzasService } from '../../services/finanzas.service';
import type {
  TipoNotificacion,
} from '../../services/finanzas.service';
import { alumnoService } from '../../services/alumno.service';
import { ModalReciboImpresion } from '../../views/escuela/ModalReciboImpresion';
import type {
  Pago, DesgloseItem, CobroRequestDTO,
  ReciboImpresion,
  MetodoPago, ResumenAlumno,
} from '../../types/finanzas.types';
import type { PagoHistorial, HistorialResponse } from '../../types/historial.types';
import { TIPO_PAGO_LABEL } from '../../types/historial.types';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/** Genera un folio de recibo opaco pero determinístico a partir del idpago.
 *  Formato: TKW-XXXXXX (6 chars alfanuméricos en base 36)
 *  No es el idpago en claro — usa XOR con una sal fija para ofuscarlo. */
function generarFolio(idpago: number): string {
  const SAL = 0x4B3A2C1D;
  const ofuscado = (idpago ^ SAL) >>> 0; // XOR unsigned
  return 'TKW-' + ofuscado.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

/** Formatea cifras según el ancho de pantalla:
 *  móvil vertical  (<480px)  → 3.3K
 *  móvil horizontal (<768px) → 3,300
 *  tablet/desktop  (≥768px)  → 3,300.00
 */
function fmtCompacto(n: number, width: number): string {
  if (width < 480) {
    // vertical móvil — compacto
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return n.toLocaleString('es-MX', { minimumFractionDigits: 0 });
  }
  if (width < 768) {
    // móvil horizontal — sin decimales
    return n.toLocaleString('es-MX', { minimumFractionDigits: 0 });
  }
  // tablet/desktop — completo
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

/** Hook que devuelve el ancho actual de la ventana y se actualiza al girar/redimensionar */
function useScreenWidth(): number {
  const [width, setWidth] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);
  return width;
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
    let cancelled = false;
    setLoadingResumen(true);
    finanzasService
      .resumenAlumno(pago.idalumno)
      .then(data  => { if (!cancelled) setResumen(data); })
      .catch(()   => { if (!cancelled) setResumen(null); })
      .finally(() => { if (!cancelled) setLoadingResumen(false); });
    return () => { cancelled = true; setResumen(null); };
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
//  HELPER — Cálculo de atraso y recargos para mensualidades
// ─────────────────────────────────────────────────────────────

function diasHabilesEntre(desde: Date, hasta: Date): number {
  let count = 0;
  const cur = new Date(desde);
  cur.setDate(cur.getDate() + 1);
  while (cur <= hasta) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

interface InfoAtraso {
  diasCorridos: number;
  diasHabilesVencidos: number;
  diasHabilesRestantes: number;
  semanasAtraso: number;
  recargo: number;
  montoConRecargo: number;
  urgencia: 'ok' | 'alerta' | 'vencido';
}

function calcAtraso(pago: any, recargoPorSemana = 50, diasGracia = 5): InfoAtraso {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const matchMes = (pago.concepto ?? '').match(/(\d{4})-(\d{2})/);
  const diaCobro: number = pago.dia_cobro ?? 1;
  let fechaVencimiento: Date;
  if (matchMes) {
    fechaVencimiento = new Date(parseInt(matchMes[1]), parseInt(matchMes[2]) - 1, diaCobro);
  } else if (pago.fecharegistro) {
    fechaVencimiento = new Date(pago.fecharegistro);
    fechaVencimiento.setHours(0, 0, 0, 0);
  } else {
    fechaVencimiento = new Date(hoy);
  }
  const diasCorridos = Math.max(0, Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / 86400000));
  const diasHabilesVencidos = diasCorridos > 0 ? diasHabilesEntre(fechaVencimiento, hoy) : 0;
  const diasHabilesRestantes = hoy < fechaVencimiento ? diasHabilesEntre(hoy, fechaVencimiento) : 0;
  const semanasAtraso = Math.floor(diasCorridos / 7);
  const recargo = semanasAtraso * recargoPorSemana;
  const montoConRecargo = (pago.monto ?? 0) + recargo;
  let urgencia: 'ok' | 'alerta' | 'vencido' = 'ok';
  if (diasCorridos > 7) urgencia = 'vencido';
  else if (diasCorridos > 0) urgencia = 'alerta';
  else if (diasHabilesRestantes <= diasGracia) urgencia = 'alerta';
  return { diasCorridos, diasHabilesVencidos, diasHabilesRestantes, semanasAtraso, recargo, montoConRecargo, urgencia };
}

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTE: ModalDeudorDetalle
//  Muestra TODOS los cargos pendientes de un alumno con cobro inline
// ─────────────────────────────────────────────────────────────

interface DesgloseTipo {
  tipo: number;
  label: string;
  monto: number;
  count: number;
  color: string;
}

interface DeudorAgrupado {
  idalumno: number;
  nombreCompleto: string;
  totalDeuda: number;
  pagos: Pago[];
  cintaColor?: string;
  cintaNivel?: string;
  maxAtraso?: InfoAtraso;
  totalConRecargo?: number;
  desgloseDeuda: DesgloseTipo[];
}

interface ModalDeudorDetalleProps {
  deudor: DeudorAgrupado | null;
  onClose: () => void;
  onCobrado: () => void;
  onAbrirCobro: (p: any) => void;
  onNotificar: (p: any) => void;
  notificando: number | null;
}

const ModalDeudorDetalle: React.FC<ModalDeudorDetalleProps> = ({
  deudor, onClose, onAbrirCobro, onNotificar, notificando,
}) => {
  const [resumen, setResumen]           = useState<ResumenAlumno | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  useEffect(() => {
    if (!deudor?.idalumno) return;
    let cancelled = false;
    setLoadingResumen(true);
    finanzasService.resumenAlumno(deudor.idalumno)
      .then(data  => { if (!cancelled) setResumen(data); })
      .catch(()   => { if (!cancelled) setResumen(null); })
      .finally(() => { if (!cancelled) setLoadingResumen(false); });
    return () => { cancelled = true; setResumen(null); };
  }, [deudor?.idalumno]);

  if (!deudor) return null;

  const pendientes = deudor.pagos.filter(p => (p.estatus ?? 0) === 0);
  const pagados    = deudor.pagos.filter(p => (p.estatus ?? 0) !== 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[125] flex items-end sm:items-center justify-center p-4">
        <motion.div
          key="bd-deudor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={onClose}
        />
        <motion.div
          key="md-deudor"
          initial={{ scale: 0.93, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[var(--color-card)] rounded-t-[3rem] sm:rounded-[3rem] border border-[var(--color-border)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 flex items-center gap-4 flex-shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, var(--color-primary)))' }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end justify-end pr-4 pb-0">
              <DollarSign size={110} />
            </div>
            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center text-white flex-shrink-0 z-10"
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}>
              <UserCircle size={24} />
            </div>
            <div className="flex-1 min-w-0 z-10 text-left">
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white opacity-60 leading-none mb-1">
                Estado de cuenta · ID {deudor.idalumno}
              </p>
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-white leading-tight truncate">
                {deudor.nombreCompleto}
              </h2>
            </div>
            <button onClick={onClose}
              className="z-10 p-2 rounded-full text-white flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* KPIs resumen backend */}
            {loadingResumen ? (
              <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={16} />
                <span className="text-[10px] font-bold opacity-50 text-[var(--color-text)]">Cargando resumen...</span>
              </div>
            ) : resumen && (
              <div className="space-y-3">
                {/* Adeudo destacado */}
                {resumen.total_adeudo > 0 && (
                  <div className="rounded-2xl p-4 border space-y-3"
                    style={{ backgroundColor: '#ef444412', borderColor: '#ef444430' }}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} style={{ color: '#ef4444' }} className="flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#ef4444' }}>Adeudo total</p>
                        <p className="text-2xl font-black leading-none" style={{ color: '#ef4444' }}>
                          ${resumen.total_adeudo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] font-black uppercase opacity-40">Mensualidad</p>
                        <p className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>
                          ${resumen.monto_mensualidad.toLocaleString('es-MX', { minimumFractionDigits: 0 })}/mes
                        </p>
                        <p className="text-[8px] opacity-40">Día {resumen.dia_cobro}</p>
                      </div>
                    </div>
                    {/* Desglose por tipo desde deudor */}
                    {(deudor.desgloseDeuda ?? []).length > 1 && (
                      <div className="flex gap-2 flex-wrap pt-1" style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                        {(deudor.desgloseDeuda ?? []).map(t => (
                          <div key={t.tipo} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                            style={{ backgroundColor: `${t.color}15`, border: `1px solid ${t.color}25` }}>
                            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.color }}>{t.label}</span>
                            <span className="text-[8px] font-black" style={{ color: t.color }}>
                              ${t.monto.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-[7px] opacity-50 font-bold" style={{ color: t.color }}>({t.count})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Stats mensualidades */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Mens. pagadas', val: resumen.mensualidades_pagadas, color: '#22c55e' },
                    { label: 'Pendientes',    val: resumen.mensualidades_pendientes, color: 'var(--color-primary)' },
                    { label: 'Inscripción',   val: resumen.inscripcion_ciclo_actual === 'PAGADA' ? '✓' : resumen.inscripcion_ciclo_actual === 'NO_APLICA' ? '—' : '⚠', color: resumen.inscripcion_ciclo_actual === 'PAGADA' ? '#22c55e' : resumen.inscripcion_ciclo_actual === 'NO_APLICA' ? 'var(--color-text-muted)' : '#f97316' },
                  ].map(k => (
                    <div key={k.label} className="rounded-2xl p-3 text-center border"
                      style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                      <p className="text-xl font-black leading-none" style={{ color: k.color }}>{k.val}</p>
                      <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-50">{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cargos pendientes — con cobro inline */}
            {pendientes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 px-1 text-[var(--color-text)]">
                  Por cobrar ({pendientes.length})
                </p>
                {pendientes.map(p => (
                  <div key={p.idpago} className="rounded-2xl p-4 space-y-3 border"
                    style={{ background: 'var(--color-background)', borderColor: 'rgba(239,68,68,0.25)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-primary)20', color: 'var(--color-primary)' }}>
                            {tipoPagoLabel(p.id_tipo_pago)}
                          </span>
                          <span className="text-[8px] font-bold opacity-30 text-[var(--color-text)]">#{p.folio_recibo}</span>
                        </div>
                        <p className="text-sm font-black truncate leading-tight text-[var(--color-text)]">{p.concepto}</p>
                        <p className="text-[9px] opacity-40 mt-0.5 flex items-center gap-1">
                          <Calendar size={9}/> Vence: {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '—'}
                        </p>
                        {/* Indicador de atraso por cargo */}
                        {p.id_tipo_pago === 1 && (() => {
                          const inf = calcAtraso(p, 50, 5); // TODO: pasar precios del context
                          return (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {inf.diasCorridos > 0 ? (
                                <>
                                  <span className="text-[8px] font-black flex items-center gap-1"
                                    style={{ color: inf.urgencia === 'vencido' ? '#ef4444' : '#f97316' }}>
                                    <AlertTriangle size={9} />
                                    {inf.diasCorridos}d atraso · {inf.diasHabilesVencidos} háb.
                                  </span>
                                  {inf.semanasAtraso > 0 && (
                                    <span className="text-[7px] font-black px-2 py-0.5 rounded-full"
                                      style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
                                      +${inf.recargo} recargo
                                    </span>
                                  )}
                                  <span className="text-[7px] font-black px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#ef444410', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    Total c/recargo: ${inf.montoConRecargo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </span>
                                </>
                              ) : inf.diasHabilesRestantes > 0 ? (
                                <span className="text-[8px] font-black flex items-center gap-1" style={{ color: '#22c55e' }}>
                                  <Clock size={9} />
                                  {inf.diasHabilesRestantes} día{inf.diasHabilesRestantes !== 1 ? 's' : ''} hábil{inf.diasHabilesRestantes !== 1 ? 'es' : ''} para pagar sin recargo
                                </span>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                      <span className="text-xl font-black leading-none flex-shrink-0" style={{ color: '#ef4444' }}>
                        ${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { onClose(); onAbrirCobro(p); }}
                        className="flex-1 h-10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110"
                        style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px -4px var(--color-primary)50' }}
                      >
                        <TrendingUp size={13} /> Cobrar
                      </motion.button>
                      <button
                        onClick={() => onNotificar(p)}
                        disabled={notificando === p.idpago}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all flex-shrink-0 disabled:opacity-40"
                        style={{ backgroundColor: '#f9731615', borderColor: '#f9731630', color: '#f97316' }}
                        title="Notificar al tutor"
                      >
                        {notificando === p.idpago ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Historial pagados */}
            {pagados.length > 0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 px-1 text-[var(--color-text)]">
                  Historial pagado ({pagados.length})
                </p>
                {pagados.map(p => (
                  <div key={p.idpago}
                    className="rounded-2xl px-4 py-3 flex items-center gap-3 border"
                    style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#22c55e15' }}>
                      <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-black truncate text-[var(--color-text)]">{p.concepto}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--color-primary)15', color: 'var(--color-primary)' }}>
                          {tipoPagoLabel(p.id_tipo_pago)}
                        </span>
                        {p.metodo_pago && <span className="text-[7px] opacity-30 uppercase">{p.metodo_pago}</span>}
                        {p.fecha_pago && <span className="text-[7px] opacity-30">{new Date(p.fecha_pago).toLocaleDateString('es-MX')}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-black flex-shrink-0" style={{ color: '#22c55e' }}>
                      ${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {deudor.pagos.length === 0 && (
              <div className="py-10 text-center opacity-30">
                <Receipt size={28} className="mx-auto mb-2"/>
                <p className="text-[10px] font-bold uppercase">Sin registros</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────
//  ERROR BOUNDARY — evita que errores de imagen o red revienten
//  toda la pantalla. Muestra un fallback y permite reintentar.
// ─────────────────────────────────────────────────────────────

class CajaErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: err?.message ?? 'Error desconocido' };
  }
  componentDidCatch(err: any, info: any) {
    console.error('[CajaProfesor]', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
            style={{ background: '#ef444415', border: '1px solid rgba(239,68,68,0.3)' }}>⚠️</div>
          <p className="text-sm font-black uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Algo salió mal en Mis Cobros
          </p>
          <p className="text-[10px] opacity-40 max-w-xs">{this.state.msg}</p>
          <button
            onClick={() => this.setState({ hasError: false, msg: '' })}
            className="px-6 h-10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest"
            style={{ background: 'var(--color-primary)' }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL: CajaProfesor
// ─────────────────────────────────────────────────────────────

const CajaProfesor: React.FC = () => {
  const [pagos, setPagos]           = useState<Pago[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<0 | 1>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [idescuela]                 = useState<number | null>(null); // no usado — el profesor opera sin idescuela
  const [escuelaInfo, setEscuelaInfo] = useState<{
    nombre: string; logo: string | null; ciudad: string; tel: string;
  }>({ nombre: '', logo: null, ciudad: '', tel: '' });
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [notificando, setNotificando] = useState<number | null>(null); // idpago en proceso

  // ── Tab deudores ────────────────────────────────────────────
  const [deudorSeleccionado, setDeudorSeleccionado] = useState<DeudorAgrupado | null>(null);
  const [deudorFiltroTipo, setDeudorFiltroTipo]     = useState<number | null>(null);

  // ── Notificación individual ──────────────────────────────
  // (sin modal de lote ni config de precios para el profesor)

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
  const comprobanteInputRef  = useRef<HTMLInputElement>(null);
  const reciboPrintRef       = useRef<HTMLDivElement>(null);
  const [reciboImpreso, setReciboImpreso]   = useState(false);
  const [vecesImpreso, setVecesImpreso]     = useState(0);
  const [capturandoRecibo, setCapturandoRecibo] = useState(false);

  // ── Modal ticket ────────────────────────────────────────────
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketData, setTicketData]               = useState<ReciboImpresion | null>(null);
  const [comprobanteViewer, setComprobanteViewer] = useState<string | null>(null); // URL imagen comprobante

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Bootstrap: obtener info de la escuela del profesor ──────
  useEffect(() => {
    (async () => {
      try {
        const _axE = (await import('../../api/axios')).default;
        // El profesor obtiene su info desde su propio perfil
        const res = await _axE.get<any>('/profesores/mi-perfil');
        const d = res.data;
        setEscuelaInfo({
          nombre: d?.escuela?.nombreescuela ?? d?.nombreescuela ?? 'Mi Escuela',
          logo:   d?.escuela?.logo_url      ?? null,
          ciudad: d?.escuela?.ciudad        ?? '',
          tel:    d?.escuela?.telefono_oficina ?? '',
        });
      } catch {
        // silencioso — la info de escuela es solo para el recibo, no es crítica
      }
    })();
  }, []);

  // ── Cache de nombres por idalumno ─────────────────────────
  const [nombresCache, setNombresCache] = useState<Record<number, string>>({});

  // ── Carga de pagos ──────────────────────────────────────────
  const loadPagos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      // El profesor solo ve los pagos pendientes de sus alumnos asignados
      const data = await finanzasService.listarPagosProfesor();
      const arr: Pago[] = Array.isArray(data) ? data : [];
      setPagos(arr);

      // Enriquecer nombres: construir cache desde los pagos que sí traen alumno
      const cache: Record<number, string> = {};
      arr.forEach(p => {
        if (p.idalumno && p.alumno?.nombres) {
          cache[p.idalumno] = `${p.alumno.nombres} ${p.alumno.apellidopaterno ?? ''}`.trim();
        }
      });

      // Para los que no traen nombre, usar alumnoService.getDetalle en paralelo
      const sinNombre = [...new Set(arr.map(p => p.idalumno).filter(id => id && !cache[id]))] as number[];
      if (sinNombre.length > 0) {
        await Promise.allSettled(
          sinNombre.map(async id => {
            try {
              const alumno = await alumnoService.getDetalle(id);
              if (alumno?.nombres) {
                cache[id] = `${alumno.nombres} ${alumno.apellidopaterno ?? ''}`.trim();
              }
            } catch { /* silencioso — fallback a "Alumno #ID" */ }
          })
        );
      }

      setNombresCache(cache);
    } catch {
      setErrorMsg('Error al cargar los pagos. Intenta de nuevo.');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadPagos(); }, [loadPagos]);

  // ── Cargar historial (tab 1) ────────────────────────────────
  const loadHistorial = useCallback(async () => {
    setHistLoading(true);
    try {
      // El profesor consulta su propio historial de cobros
      const data = await finanzasService.historialProfesor({
        buscar:       histBuscar   || undefined,
        estatus:      histEstatus  !== '' ? Number(histEstatus) : undefined,
        id_tipo_pago: histTipo     !== '' ? Number(histTipo)    : undefined,
        metodo_pago:  histMetodo   || undefined,
        fecha_desde:  histDesde    || undefined,
        fecha_hasta:  histHasta    || undefined,
        pagina:       histPagina,
        por_pagina:   20,
      });
      setHistorial(data);
    } catch (e) {
      console.error('Error historial:', e);
    } finally {
      setHistLoading(false);
    }
  }, [histPagina, histEstatus, histTipo, histMetodo, histBuscar, histDesde, histHasta]);

  useEffect(() => {
    setSearchTerm('');
    setDeudorFiltroTipo(null);
    if (tab === 1) loadHistorial();
  }, [tab, loadHistorial]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3500);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Derivados ───────────────────────────────────────────────
  const screenWidth = useScreenWidth();
  const totalMonto = useMemo(() => pagos.reduce((a, p) => a + (p.monto || 0), 0), [pagos]);

  // filteredPagos y alumnosUnicos removidos (tab Pendientes eliminado)

  // ── Deudores agrupados por alumno ───────────────────────────
  const deudoresAgrupados = useMemo((): DeudorAgrupado[] => {
    const map = new Map<number, DeudorAgrupado>();
    pagos.forEach(p => {
      const aid = p.idalumno;
      if (!aid) return;
      if (!map.has(aid)) {
        map.set(aid, {
          idalumno: aid,
          nombreCompleto: (nombresCache[aid]
            ?? `${p.alumno?.nombres ?? ''} ${p.alumno?.apellidopaterno ?? ''}`.trim())
            || `Alumno #${aid}`,
          totalDeuda: 0,
          pagos: [],
          cintaColor: p.alumno?.cinta?.color ?? p.alumno?.grado?.color ?? undefined,
          cintaNivel: p.alumno?.cinta?.nivelkupdan ?? p.alumno?.grado?.nivelkupdan ?? undefined,
        });
      }
      const d = map.get(aid)!;
      // Si nombre era placeholder y este pago trae datos reales, actualizarlo
      if (d.nombreCompleto === `Alumno #${aid}` && p.alumno?.nombres) {
        d.nombreCompleto = `${p.alumno.nombres} ${p.alumno.apellidopaterno ?? ''}`.trim();
      }
      if ((p.estatus ?? 0) === 0) d.totalDeuda += p.monto;
      d.pagos.push(p);
    });
    const TIPO_META: Record<number, { label: string; color: string }> = {
      1: { label: 'Mensualidad', color: 'var(--color-primary)' },
      2: { label: 'Inscripción', color: '#8b5cf6' },
      3: { label: 'Examen',     color: '#f59e0b' },
      4: { label: 'Torneo',     color: '#06b6d4' },
    };

    const result = Array.from(map.values()).filter(d => d.totalDeuda > 0);
    result.forEach(d => {
      const pends = d.pagos.filter(p => (p.estatus ?? 0) === 0);

      // Atraso y recargos — SOLO mensualidades (tipo 1)
      const mensPends = pends.filter(p => p.id_tipo_pago === 1);
      if (mensPends.length > 0) {
        // El profesor usa los defaults globales — no tiene acceso a config de precios
        const infos = mensPends.map(p => calcAtraso(p, 50, 5));
        d.maxAtraso = infos.reduce((max, cur) => cur.diasCorridos > max.diasCorridos ? cur : max, infos[0]);
        d.totalConRecargo = d.totalDeuda + infos.reduce((sum, i) => sum + i.recargo, 0);
      } else {
        d.totalConRecargo = d.totalDeuda;
      }

      // Desglose por tipo de pago
      const tipoMap = new Map<number, DesgloseTipo>();
      pends.forEach((p: Pago) => {
        const tipo = p.id_tipo_pago ?? 0;
        const meta = TIPO_META[tipo] ?? { label: 'Otro', color: '#6b7280' };
        if (!tipoMap.has(tipo)) tipoMap.set(tipo, { tipo, label: meta.label, monto: 0, count: 0, color: meta.color });
        const entry = tipoMap.get(tipo)!;
        entry.monto += p.monto ?? 0;
        entry.count += 1;
      });
      d.desgloseDeuda = Array.from(tipoMap.values()).sort((a, b) => b.monto - a.monto);
    });
    return result.sort((a, b) => (b.maxAtraso?.diasCorridos ?? 0) - (a.maxAtraso?.diasCorridos ?? 0));
  }, [pagos, nombresCache]);

  const totalDesglose      = desglose.reduce((a, d) => a + Number(d.monto || 0), 0);
  const infoAtrasoSelected = selectedPago?.id_tipo_pago === 1 ? calcAtraso(selectedPago) : null;
  const montoEsperado      = (infoAtrasoSelected && infoAtrasoSelected.recargo > 0)
    ? infoAtrasoSelected.montoConRecargo
    : (selectedPago?.monto ?? 0);
  const diferenciaDesglose = selectedPago ? totalDesglose - montoEsperado : 0;

  // ── Handlers ────────────────────────────────────────────────
  const handleOpenCobro = (pago: Pago) => {
    setDetallePago(null);
    setSelectedPago(pago);
    // Si es mensualidad con atraso, pre-cargar el monto con recargo
    const infoAtraso = pago.id_tipo_pago === 1 ? calcAtraso(pago) : null;
    const montoACobrar = infoAtraso && infoAtraso.recargo > 0
      ? infoAtraso.montoConRecargo
      : pago.monto;
    setDesglose([{ monto: montoACobrar, metodo: 'Efectivo' }]);
    setNotasCobro('');
    setPasoRecibo('form');
    setReciboImpreso(false);
    setVecesImpreso(0);
    setComprobanteFile(null);
    setComprobantePreview(null);
    setIsCobrarModalOpen(true);
  };

  // Captura el recibo como PNG (usando html2canvas si está disponible,
  // si no genera un Blob SVG/HTML como fallback) y lo registra como comprobante
  const captureYImprimir = async () => {
    setCapturandoRecibo(true);
    try {
      const node = reciboPrintRef.current;
      if (!node) { window.print(); return; }

      // Intentar usar html2canvas (cargado dinámicamente)
      let captureBlob: Blob | null = null;

      try {
        // Carga dinámica de html2canvas si no está disponible
        let html2canvas: any = (window as any).html2canvas;
        if (!html2canvas) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = () => res();
            s.onerror = () => rej(new Error('No se pudo cargar html2canvas'));
            document.head.appendChild(s);
          });
          html2canvas = (window as any).html2canvas;
        }
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        captureBlob = await new Promise<Blob | null>(res =>
          canvas.toBlob(res, 'image/png', 0.95)
        );
      } catch {
        // Fallback: serializar HTML como SVG data URL
        const xml = new XMLSerializer().serializeToString(node);
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${xml}</div>
          </foreignObject>
        </svg>`;
        captureBlob = new Blob([svgStr], { type: 'image/svg+xml' });
      }

      if (captureBlob) {
        const captureFile = new File(
          [captureBlob],
          `recibo_${selectedPago?.idpago ?? 'x'}_${Date.now()}.png`,
          { type: captureBlob.type }
        );
        setComprobanteFile(captureFile);
        setComprobantePreview(URL.createObjectURL(captureBlob));
      }

      // Imprimir
      window.print();
      setReciboImpreso(true);
      setVecesImpreso(v => v + 1);
    } catch (err) {
      console.error('Error capturando recibo:', err);
      window.print();
      setReciboImpreso(true);
      setVecesImpreso(v => v + 1);
    } finally {
      setCapturandoRecibo(false);
    }
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
      alert(`El monto debe sumar exactamente $${montoEsperado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
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

    // Construir ReciboData desde el pago local (instantáneo, sin esperar backend)
    const nombreAlumno = (pago.alumno?.nombres
      ? `${pago.alumno.nombres} ${pago.alumno.apellidopaterno ?? ''}`.trim()
      : nombresCache[pago.idalumno]) || `Alumno #${pago.idalumno}`;

    const localData: ReciboImpresion = {
      idpago: pago.idpago,
      escuela: {
        nombre:    escuelaInfo.nombre || 'Dragon Negro Dojo',
        logo_url:  escuelaInfo.logo   ?? undefined,
        direccion: escuelaInfo.ciudad ?? undefined,
        telefono:  escuelaInfo.tel    ?? undefined,
      },
      alumno: {
        nombre_completo: nombreAlumno,
        id_interno:      pago.idalumno,
      },
      pago: {
        concepto:    pago.concepto     ?? '—',
        monto:       pago.monto        ?? 0,
        monto_texto: undefined,
        tipo_label:  tipoPagoLabel(pago.id_tipo_pago),
        desglose:    pago.metodo_pago
          ? [{ metodo: pago.metodo_pago, monto: pago.monto }]
          : [],
      },
      metadata: {
        folio:           pago.idpago,
        fecha_impresion: pago.fecha_pago
          ? new Date(pago.fecha_pago).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
        status_texto: (pago.estatus ?? 0) === 1 ? 'PAGADO' : 'PENDIENTE',
      },
    } as unknown as ReciboImpresion;

    setTicketData(localData);

    // Intentar enriquecer desde backend (silencioso si falla)
    try {
      const serverData = await finanzasService.obtenerReciboImpresion(pago.idpago);
      if (serverData) setTicketData(serverData);
    } catch { /* usa datos locales */ }
  };

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedPago) return;
    setSaving(true);
    try {
      await finanzasService.subirComprobante(selectedPago.idpago, selectedPago.idalumno, e.target.files[0], '');
      setSuccessMsg('Comprobante subido correctamente');
      loadPagos();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Error al subir el comprobante.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNotificar = async (pago: Pago, tipo: TipoNotificacion = 'pago_pendiente') => {
    if (notificando) return;
    setNotificando(pago.idpago);
    try {
      await finanzasService.notificarAlumno(pago.idalumno, tipo, pago.idpago);
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-primary)20', border: '1.5px solid var(--color-primary)40' }}>
              <DollarSign size={26} style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Mis Cobros</h2>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-40 leading-none text-[var(--color-text-muted)]">Pagos de tus alumnos</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">

            {/* Fila superior — acciones secundarias */}
            <div className="flex gap-2">
              {/* Refresh */}
              <motion.button
                whileTap={{ scale: 0.90, rotate: 180 }}
                whileHover={{ scale: 1.05 }}
                onClick={loadPagos}
                disabled={loading}
                className="h-10 w-10 rounded-xl flex items-center justify-center border transition-all flex-shrink-0"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
                title="Actualizar lista"
              >
                <RefreshCw size={15} strokeWidth={2.5}
                  className={loading ? 'animate-spin' : ''}
                  style={{ color: loading ? 'var(--color-primary)' : undefined }}
                />
              </motion.button>

              {/* Notificar a todos (solo alumnos del profesor) */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                  const ids = deudoresAgrupados.map(d => d.idalumno);
                  if (!ids.length) { setSuccessMsg('No hay alumnos con deuda'); return; }
                  finanzasService.notificarLote(ids, 'pago_pendiente' as TipoNotificacion)
                    .then(r => setSuccessMsg(`${r.enviados} notificaciones enviadas`))
                    .catch(() => setErrorMsg('Error al enviar notificaciones'));
                }}
                className="flex-1 h-10 px-4 rounded-xl flex items-center justify-center gap-2 border transition-all"
                style={{
                  background: 'var(--color-primary)18',
                  borderColor: 'var(--color-primary)35',
                  color: 'var(--color-primary)',
                }}
                title="Notificar a todos mis alumnos con adeudo"
              >
                <Bell size={14} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase italic tracking-tighter">Notificar</span>
              </motion.button>


            </div>


          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-[var(--color-background)] p-4 rounded-3xl border border-[var(--color-border)] flex flex-col items-start shadow-inner">
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest leading-none mb-2 text-[var(--color-text)]">
              {tab === 0 ? 'Por Cobrar' : 'Total Recaudado'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={20} className="text-[var(--color-primary)]" />
              <span className="text-3xl font-black tracking-tighter leading-none text-[var(--color-primary)]">
                {fmtCompacto(totalMonto, screenWidth)}
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
      <div className="flex p-1.5 bg-[var(--color-card)] backdrop-blur-xl rounded-[1.8rem] border border-[var(--color-border)] shadow-xl mx-auto max-w-xs">
        {([
          { label: 'Cobros',    Icon: CreditCard },
          { label: 'Historial', Icon: BookOpen   },
        ] as const).map(({ label, Icon }, idx) => (
          <button
            key={label}
            onClick={() => setTab(idx as 0 | 1)}
            className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            style={tab === idx
              ? { backgroundColor: 'var(--color-primary)', color: 'white', boxShadow: '0 4px 16px -4px var(--color-primary)50' }
              : { opacity: 0.4, color: 'var(--color-text)' }
            }
          >
            <Icon size={13} strokeWidth={2.5} />{label}
          </button>
        ))}
      </div>

      {/* file input oculto para comprobantes — accesible desde modal */}
      <input type="file" ref={fileInputRef} onChange={handleUploadComprobante} className="hidden" accept="image/*" />

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
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors" size={18}
              style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="Buscar alumno o concepto..."
              className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border outline-none font-bold text-sm shadow-xl transition-all placeholder:opacity-40"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              value={histBuscar} onChange={e => { setHistBuscar(e.target.value); setHistPagina(1); }} />
            {histBuscar && (
              <button onClick={() => { setHistBuscar(''); setHistPagina(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-all"
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
                    onClick={() => {
                      if (p.url_comprobante) {
                        setComprobanteViewer(p.url_comprobante);
                      } else {
                        handleVerTicket(p as unknown as Pago);
                      }
                    }}
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
                        <span className="text-[8px] font-black uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded-lg"
                          style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary)10' }}>
                          <Printer size={10} /> Ver recibo
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Paginación */}
              {(historial.total_pagados ?? 0) > 20 && (
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
                    Pág. {histPagina}

                  </span>
                  <button
                    disabled={false}
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

      {/* ══════════════════════════════════════════════════
          TAB 0 — COBROS: buscador + filtros + lista agrupada
      ══════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Buscador */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar alumno..."
              className="w-full h-12 pl-14 pr-10 bg-[var(--color-card)] backdrop-blur-xl rounded-[1.5rem] border border-[var(--color-border)] outline-none font-bold text-sm text-[var(--color-text)] shadow-xl transition-all placeholder:opacity-40 focus:border-[var(--color-primary)]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-all text-[var(--color-text)]">
                <X size={16} />
              </button>
            )}
          </div>

          {/* KPIs + Filtro por tipo */}
          {(() => {
            const TIPOS_FILTRO = [
              { tipo: null,  label: 'Todos',       color: 'var(--color-primary)' },
              { tipo: 1,     label: 'Mensualidad', color: 'var(--color-primary)' },
              { tipo: 2,     label: 'Inscripción', color: '#8b5cf6' },
              { tipo: 3,     label: 'Examen',      color: '#f59e0b' },
              { tipo: 4,     label: 'Torneo',      color: '#06b6d4' },
            ];

            // Totales por tipo para los KPIs
            const deudaTotal = deudoresAgrupados.reduce((a, d) => {
              if (deudorFiltroTipo === null) return a + d.totalDeuda;
              const slice = d.desgloseDeuda?.find(t => t.tipo === deudorFiltroTipo);
              return a + (slice?.monto ?? 0);
            }, 0);

            const alumnosConDeudaTipo = deudoresAgrupados.filter(d => {
              if (deudorFiltroTipo === null) return true;
              return (d.desgloseDeuda ?? []).some(t => t.tipo === deudorFiltroTipo && t.monto > 0);
            }).length;

            const recargosAcumulados = deudoresAgrupados.reduce((a, d) => {
              if (deudorFiltroTipo !== null && deudorFiltroTipo !== 1) return a;
              return a + ((d.totalConRecargo ?? d.totalDeuda) - d.totalDeuda);
            }, 0);

            return (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[1.8rem] p-4 text-left border col-span-1"
                    style={{ background: 'var(--color-card)', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <AlertTriangle size={14} style={{ color: '#ef4444' }} className="mb-2" />
                    <p className="text-2xl font-black leading-none" style={{ color: '#ef4444' }}>
                      ${fmtCompacto(deudaTotal, screenWidth)}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-50">
                      {deudorFiltroTipo === null ? 'Total adeudado' : `Adeudo ${TIPOS_FILTRO.find(t=>t.tipo===deudorFiltroTipo)?.label}`}
                    </p>
                  </div>
                  <div className="rounded-[1.8rem] p-4 text-left border"
                    style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <Users size={14} style={{ color: 'var(--color-primary)' }} className="mb-2" />
                    <p className="text-2xl font-black leading-none" style={{ color: 'var(--color-text)' }}>
                      {alumnosConDeudaTipo}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-50">Alumnos</p>
                  </div>
                  <div className="rounded-[1.8rem] p-4 text-left border"
                    style={{ background: recargosAcumulados > 0 ? '#ef444410' : 'var(--color-card)', borderColor: recargosAcumulados > 0 ? 'rgba(239,68,68,0.25)' : 'var(--color-border)' }}>
                    <TrendingUp size={14} style={{ color: recargosAcumulados > 0 ? '#ef4444' : 'var(--color-text-muted)' }} className="mb-2" />
                    <p className="text-2xl font-black leading-none" style={{ color: recargosAcumulados > 0 ? '#ef4444' : 'var(--color-text-muted)' }}>
                      ${fmtCompacto(recargosAcumulados, screenWidth)}
                    </p>
                    <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-50">Recargos (+$50/sem)</p>
                  </div>
                </div>

                {/* Chips filtro tipo */}
                <div className="flex gap-2 flex-wrap">
                  {TIPOS_FILTRO.map(({ tipo, label, color }: { tipo: number | null; label: string; color: string }) => {
                    const isActive = deudorFiltroTipo === tipo;
                    // Contar alumnos con ese tipo de deuda
                    const countAlumnos = tipo === null
                      ? deudoresAgrupados.length
                      : deudoresAgrupados.filter(d => (d.desgloseDeuda ?? []).some(t => t.tipo === tipo && t.monto > 0)).length;
                    if (tipo !== null && countAlumnos === 0) return null;
                    return (
                      <button
                        key={String(tipo)}
                        onClick={() => setDeudorFiltroTipo(tipo)}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border"
                        style={isActive
                          ? { backgroundColor: color, color: '#fff', borderColor: 'transparent', boxShadow: `0 4px 12px -4px ${color}60` }
                          : { backgroundColor: 'var(--color-card)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                        }
                      >
                        {label}
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black"
                          style={isActive
                            ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                            : { backgroundColor: `${color}20`, color }
                          }>
                          {countAlumnos}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {loading ? (
            <div className="py-32 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic text-[var(--color-text)]">Cargando...</p>
            </div>
          ) : deudoresAgrupados.length === 0 ? (
            <div className="py-32 text-center space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500 opacity-60" />
              <p className="text-sm font-black uppercase italic tracking-tighter opacity-40 text-[var(--color-text)]">
                {searchTerm ? 'Sin resultados para la búsqueda' : 'Sin cobros pendientes 🎉'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deudoresAgrupados
                .filter(d => {
                  const matchTipo = deudorFiltroTipo === null ||
                    (d.desgloseDeuda ?? []).some(t => t.tipo === deudorFiltroTipo && t.monto > 0);
                  const matchSearch = searchTerm === '' ||
                    d.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchTipo && matchSearch;
                })
                .map((d, i) => {
                return (
                  <motion.div
                    key={d.idalumno}
                    layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative bg-[var(--color-card)] p-4 rounded-[2rem] border shadow-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                    style={{
                      borderColor: d.maxAtraso?.urgencia === 'vencido'
                        ? 'rgba(239,68,68,0.4)'
                        : d.maxAtraso?.urgencia === 'alerta'
                          ? 'rgba(249,115,22,0.35)'
                          : 'var(--color-border)',
                    }}
                    onClick={() => setDeudorSeleccionado(d)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor =
                      d.maxAtraso?.urgencia === 'vencido' ? 'rgba(239,68,68,0.4)' :
                      d.maxAtraso?.urgencia === 'alerta'  ? 'rgba(249,115,22,0.35)' : 'var(--color-border)'
                    )}
                  >
                    {/* Barra lateral urgencia */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[2rem]"
                      style={{
                        backgroundColor:
                          d.maxAtraso?.urgencia === 'vencido' ? '#ef4444' :
                          d.maxAtraso?.urgencia === 'alerta'  ? '#f97316' : '#22c55e',
                      }}
                    />

                    <div className="flex items-center gap-3 ml-1">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm"
                        style={{
                          background: d.maxAtraso?.urgencia === 'vencido' ? '#ef444412' : '#f9731612',
                          color:      d.maxAtraso?.urgencia === 'vencido' ? '#ef4444'   : '#f97316',
                          border:     `1px solid ${d.maxAtraso?.urgencia === 'vencido' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
                        }}>
                        {d.nombreCompleto.split(' ').slice(0, 2).map(w => w[0]).join('')}
                      </div>

                      {/* Info central */}
                      <div className="flex-1 min-w-0 text-left space-y-1">
                        {/* Nombre — prominente */}
                        <p className="text-[15px] font-black uppercase italic tracking-tighter truncate leading-none text-[var(--color-text)]">
                          {d.nombreCompleto.startsWith('Alumno #')
                            ? <span className="opacity-40 text-[11px]">{d.nombreCompleto}</span>
                            : d.nombreCompleto
                          }
                        </p>

                        {/* Badges: cinta + desglose por tipo con montos */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {d.cintaNivel && (
                            <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                              style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                              🥋 {d.cintaNivel}
                            </span>
                          )}
                          {(d.desgloseDeuda ?? []).map((t: DesgloseTipo) => (
                            <span key={t.tipo}
                              className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ backgroundColor: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}>
                              {t.label}
                              <span className="opacity-70 font-bold normal-case tracking-normal">
                                ${t.monto.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                              </span>
                            </span>
                          ))}
                        </div>

                        {/* Días atraso / días hábiles restantes */}
                        {d.maxAtraso && d.maxAtraso.diasCorridos > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[8px] font-black uppercase tracking-wider flex items-center gap-1"
                              style={{ color: d.maxAtraso.urgencia === 'vencido' ? '#ef4444' : '#f97316' }}>
                              <AlertTriangle size={9} />
                              {d.maxAtraso.diasCorridos}d atraso
                              <span className="opacity-60 font-bold normal-case tracking-normal">
                                ({d.maxAtraso.diasHabilesVencidos} háb.)
                              </span>
                            </span>
                            {d.maxAtraso.semanasAtraso > 0 && (
                              <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
                                +${d.maxAtraso.recargo} recargo
                              </span>
                            )}
                          </div>
                        ) : d.maxAtraso && d.maxAtraso.diasHabilesRestantes > 0 ? (
                          <span className="text-[8px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: '#22c55e' }}>
                            <Clock size={9} />
                            {d.maxAtraso.diasHabilesRestantes} día{d.maxAtraso.diasHabilesRestantes !== 1 ? 's' : ''} hábil{d.maxAtraso.diasHabilesRestantes !== 1 ? 'es' : ''} para pagar
                          </span>
                        ) : null}
                      </div>

                      {/* Monto con recargo */}
                      <div className="text-right shrink-0 flex items-center gap-1">
                        <div>
                          <p className="text-base font-black leading-none" style={{ color: '#ef4444' }}>
                            ${d.totalDeuda.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                          {d.totalConRecargo !== undefined && d.totalConRecargo > d.totalDeuda && (
                            <p className="text-[8px] font-black mt-0.5 text-right" style={{ color: '#ef4444', opacity: 0.65 }}>
                              +${(d.totalConRecargo - d.totalDeuda).toFixed(0)} recargo
                            </p>
                          )}
                          <p className="text-[7px] opacity-30 font-bold mt-0.5 text-right text-[var(--color-text-muted)]">adeudo</p>
                        </div>
                        <ChevronRight size={14} className="opacity-20 ml-1" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                        {selectedPago.alumno?.nombres
                          ? `${selectedPago.alumno.nombres} ${selectedPago.alumno.apellidopaterno ?? ''}`
                          : (nombresCache[selectedPago.idalumno] ?? `Alumno #${selectedPago.idalumno}`)
                        }
                      </p>
                      <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        {/* Monto base */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold opacity-60" style={{ color: 'var(--color-text-muted)' }}>{selectedPago.concepto}</span>
                          <span className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>
                            ${selectedPago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {/* Recargo si aplica */}
                        {infoAtrasoSelected && infoAtrasoSelected.recargo > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                                <AlertTriangle size={11} />
                                Recargo por atraso ({infoAtrasoSelected.semanasAtraso} sem. × $50)
                              </span>
                              <span className="text-base font-black" style={{ color: '#ef4444' }}>
                                +${infoAtrasoSelected.recargo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ef4444' }}>Total a cobrar</span>
                              <span className="text-2xl font-black" style={{ color: '#ef4444' }}>
                                ${infoAtrasoSelected.montoConRecargo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        )}
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

                    {/* ── RECIBO IMPRIMIBLE — diseño horizontal profesional ── */}
                    {(() => {
                      const folio = generarFolio(selectedPago.idpago);
                      const nombreAlumno = (selectedPago.alumno?.nombres
                        ? `${selectedPago.alumno.nombres} ${selectedPago.alumno.apellidopaterno ?? ''}`.trim()
                        : nombresCache[selectedPago.idalumno]) || '—';
                      const fechaEmision = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
                      const metodoPago = desglose.map(d => `${d.metodo}${desglose.length > 1 ? ' $' + d.monto : ''}`).join(' + ');
                      const totalFinal = infoAtrasoSelected && infoAtrasoSelected.recargo > 0 ? montoEsperado : selectedPago.monto;
                      return (
                        <div id="recibo-print" ref={reciboPrintRef}
                          style={{ background: '#fff', color: '#111', fontFamily: "'Arial', sans-serif", width: '100%' }}>

                          {/* ── BANDA SUPERIOR OSCURA ── */}
                          <div style={{ background: '#111', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {escuelaInfo.logo
                                ? <img src={escuelaInfo.logo} alt="Logo"
                                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '2px solid #fff' }}
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#333', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>LOGO</div>
                              }
                              <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>
                                  {escuelaInfo.nombre || 'Dragon Negro Dojo'}
                                </p>
                                <p style={{ margin: 0, fontSize: 9, color: '#aaa', marginTop: 2 }}>
                                  {[escuelaInfo.ciudad, escuelaInfo.tel ? `Tel: ${escuelaInfo.tel}` : ''].filter(Boolean).join('  ·  ')}
                                </p>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontSize: 8, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Comprobante de Pago</p>
                              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: 1, marginTop: 2 }}>{folio}</p>
                              <div style={{ marginTop: 4, display: 'inline-block', background: '#f59e0b', color: '#111', fontSize: 7, fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: 2, textTransform: 'uppercase' }}>
                                PENDIENTE DE COBRO
                              </div>
                            </div>
                          </div>

                          {/* ── CUERPO HORIZONTAL: 2 columnas ── */}
                          <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>

                            {/* Columna izquierda — datos del alumno y concepto */}
                            <div style={{ flex: 1, padding: '16px 20px', borderRight: '1px solid #e5e5e5' }}>
                              <p style={{ margin: 0, fontSize: 7, fontWeight: 900, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                                Datos del Alumno
                              </p>
                              {[
                                { label: 'Nombre',     value: nombreAlumno },
                                { label: 'Concepto',   value: selectedPago.concepto ?? '—' },
                                { label: 'Fecha',      value: fechaEmision },
                                { label: 'Método',     value: metodoPago },
                              ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7, gap: 8 }}>
                                  <span style={{ fontSize: 8, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>{label}:</span>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: '#111', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                                </div>
                              ))}
                            </div>

                            {/* Columna derecha — totales */}
                            <div style={{ width: 180, padding: '16px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fafafa' }}>
                              <p style={{ margin: 0, fontSize: 7, fontWeight: 900, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                                Resumen
                              </p>
                              {infoAtrasoSelected && infoAtrasoSelected.recargo > 0 ? (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 8, color: '#888' }}>Base</span>
                                    <span style={{ fontSize: 9, fontWeight: 700 }}>${selectedPago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 8, color: '#c0392b' }}>Recargo ({infoAtrasoSelected.semanasAtraso}×$50)</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: '#c0392b' }}>+${infoAtrasoSelected.recargo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div style={{ borderTop: '2px solid #111', paddingTop: 8 }}>
                                    <p style={{ margin: 0, fontSize: 7, fontWeight: 900, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Total</p>
                                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: -1 }}>
                                      ${totalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div style={{ borderTop: '2px solid #111', paddingTop: 8 }}>
                                  <p style={{ margin: 0, fontSize: 7, fontWeight: 900, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Total</p>
                                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: -1 }}>
                                    ${totalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── PIE: firma + talón ── */}
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '12px 20px 8px' }}>
                            <div style={{ borderTop: '1px solid #111', paddingTop: 4, minWidth: 120 }}>
                              <p style={{ margin: 0, fontSize: 7, color: '#999', textTransform: 'uppercase', letterSpacing: 2 }}>Firma / Sello</p>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 7, color: '#bbb' }}>
                              Documento válido como comprobante de pago
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 7, color: '#999' }}>
                              {new Date().toLocaleDateString('es-MX')}
                            </div>
                          </div>

                          {/* ── TALÓN DESPRENDIBLE ── */}
                          <div style={{ margin: '0 20px 12px', padding: '6px 12px', border: '1px dashed #ccc', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 7, fontWeight: 900, color: '#bbb', textTransform: 'uppercase', letterSpacing: 2 }}>
                              Folio: {folio}
                            </span>
                            <span style={{ fontSize: 7, color: '#bbb' }}>
                              {nombreAlumno}  ·  {new Date().toLocaleDateString('es-MX')}  ·  ${totalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── SECCIÓN IMPRIMIR + CONFIRMAR ── */}
                    <div className="p-5 space-y-3" style={{ background: 'var(--color-card)', borderTop: '1px solid var(--color-border)' }}>

                      {/* Paso 1 — Imprimir (captura automática) */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={captureYImprimir}
                        disabled={capturandoRecibo}
                        className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-60"
                        style={{
                          background: reciboImpreso ? 'var(--color-surface)' : 'var(--color-primary)',
                          border: reciboImpreso ? '1px solid var(--color-border)' : 'none',
                          color: reciboImpreso ? 'var(--color-text)' : '#fff',
                          boxShadow: reciboImpreso ? 'none' : '0 4px 16px -4px var(--color-primary)50',
                        }}>
                        {capturandoRecibo
                          ? <><Loader2 className="animate-spin" size={15} /> Capturando recibo...</>
                          : reciboImpreso
                            ? <><Printer size={15} /> Reimprimir{vecesImpreso > 1 ? ` (${vecesImpreso}×)` : ''}</>
                            : <><Printer size={15} /> Imprimir Recibo</>
                        }
                      </motion.button>

                      {/* Preview miniatura del recibo capturado */}
                      <AnimatePresence>
                        {comprobantePreview && reciboImpreso && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="rounded-2xl overflow-hidden border flex items-center gap-3 px-3 py-2"
                            style={{ background: '#10b98110', borderColor: '#10b98140' }}>
                            <img
                              src={comprobantePreview}
                              alt="Recibo capturado"
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#10b981' }}>
                                ✓ Recibo capturado automáticamente
                              </p>
                              <p className="text-[8px] opacity-60" style={{ color: '#10b981' }}>
                                Se adjuntará al confirmar el pago
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hint si aún no imprimió */}
                      {!reciboImpreso && (
                        <p className="text-center text-[8px] font-black uppercase tracking-widest opacity-40"
                          style={{ color: 'var(--color-text-muted)' }}>
                          Imprime primero para habilitar el cobro
                        </p>
                      )}

                      {/* Paso 2 — Confirmar pago (solo activo tras imprimir) */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleConfirmarConComprobante}
                        disabled={saving || !reciboImpreso}
                        className="w-full h-14 font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          background: reciboImpreso ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--color-surface)',
                          boxShadow: reciboImpreso ? '0 6px 24px -6px #10b98160' : 'none',
                          color: reciboImpreso ? '#fff' : 'var(--color-text-muted)',
                          border: reciboImpreso ? 'none' : '1px solid var(--color-border)',
                        }}>
                        {saving
                          ? <Loader2 className="animate-spin" size={20} />
                          : <><CheckCircle2 size={20} /><span className="text-sm uppercase italic tracking-tighter">Confirmar Pago</span></>
                        }
                      </motion.button>

                      <input type="file" ref={comprobanteInputRef} onChange={handleComprobanteChange}
                        className="hidden" accept="image/*" />
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
      {/* Modal deudor agrupado */}
      {deudorSeleccionado && (
        <ModalDeudorDetalle
          deudor={deudorSeleccionado}
          onClose={() => setDeudorSeleccionado(null)}
          onCobrado={loadPagos}
          onAbrirCobro={handleOpenCobro}
          onNotificar={handleNotificar}
          notificando={notificando}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL — VER RECIBO (usa ModalReciboImpresion oficial)
      ═══════════════════════════════════════════════════════ */}
      <ModalReciboImpresion
        open={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        data={ticketData}
      />

      {/* ═══════════════════════════════════════════════════════
          VISOR — Imagen del comprobante capturado al cobrar
      ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {comprobanteViewer && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.97)' }}
              onClick={() => setComprobanteViewer(null)}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative z-10 flex flex-col items-center gap-4 w-full max-w-lg"
            >
              {/* Barra de acciones */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-60">
                  Comprobante de pago
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={comprobanteViewer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 h-9 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-white transition-all hover:brightness-110"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <ExternalLink size={12} /> Abrir
                  </a>
                  <button
                    onClick={() => setComprobanteViewer(null)}
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-white transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Imagen del recibo */}
              <div className="w-full rounded-[2rem] overflow-hidden shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <img
                  src={comprobanteViewer}
                  alt="Comprobante de pago"
                  className="w-full object-contain"
                  style={{ maxHeight: '75vh', background: '#fff' }}
                  onError={e => {
                    // Si la imagen falla, mostrar placeholder
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center py-16 flex-col gap-3"
                  style={{ background: '#1a1a1a' }}>
                  <FileText size={32} style={{ color: '#555' }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#555' }}>
                    No se pudo cargar la imagen
                  </p>
                  <a href={comprobanteViewer} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    Abrir en navegador
                  </a>
                </div>
              </div>

              <p className="text-[8px] font-bold uppercase tracking-widest opacity-30 text-white">
                Toca fuera para cerrar
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>




    </div>
  );
};

const CajaProfesorWithBoundary: React.FC = () => (
  <CajaErrorBoundary>
    <CajaProfesor />
  </CajaErrorBoundary>
);

export default CajaProfesorWithBoundary;