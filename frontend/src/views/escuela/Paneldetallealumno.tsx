// ============================================================
//  src/components/PanelDetalleAlumno.tsx
//  Panel lateral con resumen financiero de un alumno
//  Usa GET /finanzas/pagos/alumno/{idalumno}/resumen
// ============================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserCircle, DollarSign, CheckCircle2, Clock,
  AlertTriangle, Calendar, Loader2, TrendingUp,
  FileText, CreditCard, ChevronRight,
} from 'lucide-react';
import { finanzasService } from '../../services/finanzas.service';
import type { ResumenAlumno, Pago } from '../../types/finanzas.types';

// ── helpers ──────────────────────────────────────────────────

function labelEstatusColor(estatus: number): string {
  switch (estatus) {
    case 0: return 'var(--color-primary)';
    case 1: return '#22c55e';
    case 2: return '#6b7280';
    case 3: return '#ef4444';
    default: return 'var(--color-primary)';
  }
}

function labelEstatus(estatus: number): string {
  switch (estatus) {
    case 0: return 'Pendiente';
    case 1: return 'Pagado';
    case 2: return 'Cancelado';
    case 3: return 'Vencido';
    default: return '—';
  }
}

function labelTipoPago(tipo: number): string {
  switch (tipo) {
    case 1: return 'Mensualidad';
    case 2: return 'Inscripción';
    case 3: return 'Examen';
    case 4: return 'Torneo';
    default: return 'Otro';
  }
}

// ─────────────────────────────────────────────────────────────

interface Props {
  /** Pago seleccionado — de aquí sacamos idalumno y nombre */
  pago: Pago | null;
  /** Todos los pagos cargados en CajaFinanzas (para mostrar historial local) */
  todosPagos: Pago[];
  onClose: () => void;
  onCobrar: (pago: Pago) => void;
  onVerTicket: (pago: Pago) => void;
}

export const PanelDetalleAlumno: React.FC<Props> = ({
  pago, todosPagos, onClose, onCobrar, onVerTicket,
}) => {
  const [resumen, setResumen] = useState<ResumenAlumno | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // Filtrar todos los pagos del mismo alumno del listado local
  const pagosAlumno = pago
    ? todosPagos.filter(p => p.idalumno === pago.idalumno)
    : [];

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

  const nombreCompleto = pago
    ? `${pago.alumno?.nombres ?? ''} ${pago.alumno?.apellidopaterno ?? ''}`.trim()
    : '';

  return (
    <AnimatePresence>
      {pago && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[130] w-full max-w-md flex flex-col bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-2xl overflow-hidden"
          >
            {/* ── Header ── */}
            <div
              className="relative p-6 flex items-center gap-4 flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, var(--color-primary)))' }}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-4">
                <UserCircle size={140} />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0 z-10">
                <UserCircle size={28} />
              </div>
              <div className="flex-1 min-w-0 z-10 text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 leading-none mb-1">
                  Ficha de Alumno
                </p>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight truncate">
                  {nombreCompleto}
                </h2>
                <p className="text-[9px] font-bold text-white/50 mt-1">
                  ID {pago.idalumno}
                </p>
              </div>
              <button
                onClick={onClose}
                className="z-10 p-2 bg-white/15 hover:bg-white/30 rounded-full transition-all text-white flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Contenido scrollable ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Resumen financiero del backend */}
              {loadingResumen ? (
                <div className="flex items-center gap-3 px-4 py-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" size={20} />
                  <span className="text-xs font-bold opacity-50 text-[var(--color-text)]">Cargando resumen...</span>
                </div>
              ) : resumen ? (
                <div className="space-y-3">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] px-1">Resumen del Ciclo</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Mensualidades pagadas */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-left">
                      <CheckCircle2 size={16} className="text-green-400 mb-2" />
                      <p className="text-2xl font-black text-green-400 leading-none">{resumen.mensualidades_pagadas}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-green-400/70 mt-1">Pagadas</p>
                    </div>

                    {/* Mensualidades pendientes */}
                    <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-2xl p-4 text-left">
                      <Clock size={16} style={{ color: 'var(--color-primary)' }} className="mb-2" />
                      <p className="text-2xl font-black leading-none" style={{ color: 'var(--color-primary)' }}>
                        {resumen.mensualidades_pendientes}
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mt-1" style={{ color: 'var(--color-primary)' }}>
                        Pendientes
                      </p>
                    </div>
                  </div>

                  {/* Adeudo total */}
                  {resumen.total_adeudo > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-red-400/70">Adeudo Total</p>
                          <p className="text-xl font-black text-red-400 leading-none mt-0.5">
                            ${resumen.total_adeudo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Config del alumno */}
                  <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3 text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)]">Configuración</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-60">
                        <DollarSign size={13} className="text-[var(--color-text)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Mensualidad</span>
                      </div>
                      <span className="text-sm font-black text-[var(--color-text)]">
                        ${resumen.monto_mensualidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-60">
                        <Calendar size={13} className="text-[var(--color-text)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Día de cobro</span>
                      </div>
                      <span className="text-sm font-black text-[var(--color-text)]">Día {resumen.dia_cobro}</span>
                    </div>
                    {resumen.inscripcion_ciclo_actual && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 opacity-60">
                          <FileText size={13} className="text-[var(--color-text)]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Inscripción ciclo</span>
                        </div>
                        <span
                          className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: resumen.inscripcion_ciclo_actual === 'pagada' ? '#22c55e20' : 'var(--color-primary)20',
                            color: resumen.inscripcion_ciclo_actual === 'pagada' ? '#22c55e' : 'var(--color-primary)',
                          }}
                        >
                          {resumen.inscripcion_ciclo_actual}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold opacity-40 text-[var(--color-text)] text-left">
                  Resumen no disponible
                </div>
              )}

              {/* Pago actual seleccionado — destacado */}
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] px-1 mb-3">
                  Pago Seleccionado
                </p>
                <PagoCard
                  p={pago}
                  destacado
                  onCobrar={onCobrar}
                  onVerTicket={onVerTicket}
                />
              </div>

              {/* Otros pagos del mismo alumno en el listado actual */}
              {pagosAlumno.length > 1 && (
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] px-1 mb-3">
                    Otros cargos en pantalla ({pagosAlumno.length - 1})
                  </p>
                  <div className="space-y-2">
                    {pagosAlumno
                      .filter(p => p.idpago !== pago.idpago)
                      .map(p => (
                        <PagoCard
                          key={p.idpago}
                          p={p}
                          onCobrar={onCobrar}
                          onVerTicket={onVerTicket}
                        />
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Sub-componente: card de pago dentro del panel ─────────────

interface PagoCardProps {
  p: Pago;
  destacado?: boolean;
  onCobrar: (p: Pago) => void;
  onVerTicket: (p: Pago) => void;
}

const PagoCard: React.FC<PagoCardProps> = ({ p, destacado, onCobrar, onVerTicket }) => (
  <div
    className={`rounded-2xl border p-4 space-y-3 transition-all text-left ${
      destacado
        ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
        : 'border-[var(--color-border)] bg-[var(--color-background)]'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${labelEstatusColor(p.estatus ?? 0)}20`,
              color: labelEstatusColor(p.estatus ?? 0),
            }}
          >
            {labelEstatus(p.estatus ?? 0)}
          </span>
          <span className="text-[8px] font-bold uppercase opacity-40 text-[var(--color-text)]">
            {labelTipoPago(p.id_tipo_pago)}
          </span>
        </div>
        <p className="text-sm font-black text-[var(--color-text)] truncate leading-tight italic">
          {p.concepto}
        </p>
        {p.mes_correspondiente && (
          <p className="text-[9px] font-bold opacity-40 text-[var(--color-text)] mt-0.5">
            {p.mes_correspondiente}
          </p>
        )}
      </div>
      <span className="text-lg font-black leading-none flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
        ${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </span>
    </div>

    {p.metodo_pago && (
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <CreditCard size={12} className="opacity-40" />
        <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{p.metodo_pago}</span>
      </div>
    )}

    {p.fecha_pago && (
      <div className="flex items-center gap-2 text-[var(--color-text)]">
        <Calendar size={12} className="opacity-40" />
        <span className="text-[9px] font-bold opacity-40">
          Pagado: {new Date(p.fecha_pago).toLocaleDateString('es-MX')}
        </span>
      </div>
    )}

    <div className="flex gap-2 pt-1">
      {p.estatus === 0 && (
        <button
          onClick={() => onCobrar(p)}
          className="flex-1 h-9 rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <TrendingUp size={13} /> Cobrar
        </button>
      )}
      <button
        onClick={() => onVerTicket(p)}
        className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border transition-all hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
          backgroundColor: 'transparent',
        }}
      >
        <FileText size={13} />
        {p.estatus === 0 ? 'Cargo' : 'Recibo'}
      </button>
    </div>
  </div>
);

export default PanelDetalleAlumno;