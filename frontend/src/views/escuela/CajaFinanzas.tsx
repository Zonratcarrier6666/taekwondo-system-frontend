// ============================================================
//  src/components/CajaFinanzas.tsx
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Search, ArrowUpRight, ArrowDownLeft,
  DollarSign, Calendar, CreditCard, PlusCircle,
  Loader2, CheckCircle2, X, History, ChevronRight,
  ShieldAlert, UserCircle, Printer, Image as ImageIcon,
  Receipt,
} from 'lucide-react';

import { finanzasService } from '../../services/finanzas.service';
import { ModalReciboImpresion } from './ModalReciboImpresion';
import type {
  Pago,
  DesgloseItem,
  CobroRequestDTO,
  GenerarMensualidadDTO,
  ReciboImpresion,
} from '../../types/finanzas.types';

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export const CajaFinanzas: React.FC = () => {
  const [pagos, setPagos]                           = useState<Pago[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [tab, setTab]                               = useState<0 | 1>(0);
  const [searchTerm, setSearchTerm]                 = useState('');

  const [selectedPago, setSelectedPago]             = useState<Pago | null>(null);
  const [isCobrarModalOpen, setIsCobrarModalOpen]   = useState(false);
  const [isGenerarModalOpen, setIsGenerarModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen]   = useState(false);
  const [ticketData, setTicketData]                 = useState<ReciboImpresion | null>(null);
  const [saving, setSaving]                         = useState(false);

  const [desglose, setDesglose]     = useState<DesgloseItem[]>([{ monto: 0, metodo: 'Efectivo' }]);
  const [notasCobro, setNotasCobro] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Carga de datos ──────────────────────────────────────────
  const loadPagos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await finanzasService.listarPagos(tab);
      setPagos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error API Finanzas:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadPagos(); }, [loadPagos]);

  // ── Derivados ───────────────────────────────────────────────
  const totalMonto = useMemo(
    () => pagos.reduce((acc, p) => acc + (p.monto || 0), 0),
    [pagos]
  );

  const filteredPagos = useMemo(() => {
    const busca = searchTerm.toLowerCase();
    return pagos.filter((p) => {
      const nombre = `${p.alumno?.nombres ?? ''} ${p.alumno?.apellidopaterno ?? ''}`.toLowerCase();
      return nombre.includes(busca) || (p.concepto ?? '').toLowerCase().includes(busca);
    });
  }, [pagos, searchTerm]);

  // ── Manejadores ─────────────────────────────────────────────
  const handleOpenCobro = (pago: Pago) => {
    setSelectedPago(pago);
    setDesglose([{ monto: pago.monto, metodo: 'Efectivo' }]);
    setNotasCobro('');
    setIsCobrarModalOpen(true);
  };

  const handleConfirmarCobro = async () => {
    if (!selectedPago) return;
    const totalIngresado = desglose.reduce((acc, d) => acc + Number(d.monto), 0);
    if (Math.abs(totalIngresado - selectedPago.monto) > 0.01) {
      alert(`Monto incorrecto. Debe sumar exactamente $${selectedPago.monto}`);
      return;
    }
    setSaving(true);
    try {
      const payload: CobroRequestDTO = { desglose_pagos: desglose, notas: notasCobro };
      await finanzasService.registrarCobro(selectedPago.idpago, payload);
      setIsCobrarModalOpen(false);
      loadPagos();
    } catch (err) {
      console.error('Error al procesar cobro:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleVerTicket = async (pago: Pago) => {
    setSelectedPago(pago);
    setIsTicketModalOpen(true);
    setTicketData(null);
    try {
      const data = await finanzasService.obtenerReciboImpresion(pago.idpago);
      setTicketData(data);
    } catch (e) {
      console.error('Error al obtener ticket:', e);
    }
  };

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedPago) return;
    setSaving(true);
    try {
      await finanzasService.subirComprobante(selectedPago.idpago, e.target.files[0]);
      loadPagos();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerarMes = async () => {
    setSaving(true);
    try {
      const hoy = new Date();
      const payload: GenerarMensualidadDTO = {
        mes: hoy.getMonth() + 1,
        anio: hoy.getFullYear(),
        monto_estandar: 0,
        concepto_prefijo: 'Mensualidad',
        dia_corte: 20,
      };
      await finanzasService.generarMensualidadesMes(payload);
      setIsGenerarModalOpen(false);
      loadPagos();
    } catch (e) {
      console.error('Error en proceso masivo:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMetodo = () =>
    setDesglose([...desglose, { monto: 0, metodo: 'Transferencia' }]);

  const handleUpdateDesglose = (idx: number, field: keyof DesgloseItem, value: string | number) => {
    const updated = [...desglose];
    updated[idx] = { ...updated[idx], [field]: value };
    setDesglose(updated);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-[var(--color-text)] animate-in fade-in duration-500 pb-20">

      {/* HEADER */}
      <div className="bg-[var(--color-card)]/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            {/* Ícono con color del tema */}
            <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-inner flex-shrink-0">
              <Wallet size={24} />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Caja y Finanzas</h2>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] mt-2 italic opacity-40 leading-none text-[var(--color-text-muted)]">Gestión Técnica de Ingresos</p>
            </div>
          </div>
          {/* Botón principal con color del tema */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsGenerarModalOpen(true)}
            className="w-full md:w-auto px-6 h-12 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg border border-white/10 transition-all hover:brightness-110"
            style={{ boxShadow: '0 8px 24px -4px var(--color-primary)40' }}
          >
            <PlusCircle size={18} />
            <span className="text-xs font-black uppercase italic tracking-tighter">Generar Mensualidades</span>
          </motion.button>
        </div>

        {/* Stats con acento del tema */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="bg-[var(--color-background)]/50 p-4 rounded-3xl border border-[var(--color-border)] flex flex-col items-start shadow-inner">
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest leading-none mb-2 text-[var(--color-text)]">
              {tab === 0 ? 'Total por Recaudar' : 'Total Recaudado'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={20} className="text-[var(--color-primary)]" />
              <span className="text-3xl font-black tracking-tighter leading-none text-[var(--color-primary)]">
                {totalMonto.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
          <div className="bg-[var(--color-background)]/50 p-4 rounded-3xl border border-[var(--color-border)] flex flex-col items-start shadow-inner">
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest leading-none mb-2 text-[var(--color-text)]">Movimientos Registrados</span>
            <div className="flex items-center gap-2 mt-1">
              <History size={20} className="text-[var(--color-primary)]" />
              <span className="text-3xl font-black tracking-tighter leading-none text-[var(--color-text)]">{pagos.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS — ambos usan color del tema */}
      <div className="flex p-1.5 bg-[var(--color-card)]/40 backdrop-blur-xl rounded-[1.8rem] border border-[var(--color-border)] shadow-xl mx-auto max-w-md">
        <button
          onClick={() => setTab(0)}
          className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          style={tab === 0 ? {
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            boxShadow: '0 4px 16px -4px var(--color-primary)50'
          } : { opacity: 0.4, color: 'var(--color-text)' }}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab(1)}
          className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          style={tab === 1 ? {
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            boxShadow: '0 4px 16px -4px var(--color-primary)50'
          } : { opacity: 0.4, color: 'var(--color-text)' }}
        >
          Historial
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por alumno o concepto..."
            className="w-full h-14 pl-14 pr-6 bg-[var(--color-card)]/40 backdrop-blur-xl rounded-[1.5rem] border border-[var(--color-border)] outline-none font-bold text-sm text-[var(--color-text)] shadow-xl transition-all placeholder:opacity-40 focus:bg-[var(--color-card)]/60 focus:border-[var(--color-primary)]/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full py-32 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic text-[var(--color-text)]">Consultando servidor...</p>
            </div>
          ) : filteredPagos.length === 0 ? (
            <div className="col-span-full py-32 text-center opacity-30 italic font-black uppercase text-sm tracking-widest text-[var(--color-text)]">
              Sin registros disponibles
            </div>
          ) : (
            filteredPagos.map((p) => (
              <motion.div
                layout
                key={p.idpago}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-[var(--color-card)]/40 backdrop-blur-xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl overflow-hidden transition-all hover:bg-[var(--color-card)]/60"
              >
                {/* Barra lateral con color del tema */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-[2.5rem]"
                  style={{ backgroundColor: 'var(--color-primary)', opacity: p.estatus === 0 ? 0.5 : 0.25 }}
                />

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <Calendar size={14} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 text-[var(--color-text)]">
                        {p.id_tipo_pago === 1 ? 'Mensualidad' : 'Servicio'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--color-text)] truncate leading-none">
                      {p.alumno?.nombres} {p.alumno?.apellidopaterno}
                    </h3>
                    <p className="text-xs font-bold text-[var(--color-text-muted)] mt-1 truncate italic leading-none">{p.concepto}</p>
                    <div className="flex items-center gap-4 mt-5 text-[var(--color-text)]">
                      <div className="flex items-center gap-1.5 font-black tracking-tighter leading-none">
                        <DollarSign size={14} className="text-[var(--color-primary)]" />
                        <span className={`text-xl ${p.estatus === 1 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                          {p.monto}
                        </span>
                      </div>
                      {p.metodo_pago && (
                        <span className="px-3 py-1 bg-[var(--color-card)] rounded-lg text-[8px] font-black uppercase tracking-widest border border-[var(--color-border)] opacity-60">
                          {p.metodo_pago}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className="text-[8px] font-black text-[var(--color-text-muted)] opacity-30 leading-none">
                      {new Date(p.fecharegistro).toLocaleDateString()}
                    </span>
                    <div className="flex flex-col gap-2">
                      {p.estatus === 0 ? (
                        <>
                          {/* Botón cobrar con color del tema */}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenCobro(p)}
                            className="w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all hover:brightness-110"
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              boxShadow: '0 4px 16px -4px var(--color-primary)60'
                            }}
                            title="Cobrar"
                          >
                            <ArrowUpRight size={22} strokeWidth={3} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleVerTicket(p)}
                            className="w-12 h-12 bg-[var(--color-card)] text-[var(--color-text-muted)] rounded-2xl flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-all shadow-lg"
                            title="Imprimir Cargo"
                          >
                            <Printer size={22} />
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleVerTicket(p)}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-lg hover:text-white hover:border-transparent"
                            style={{
                              backgroundColor: 'var(--color-primary)15',
                              borderColor: 'var(--color-primary)30',
                              color: 'var(--color-primary)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)15')}
                            title="Ver Recibo"
                          >
                            <Receipt size={22} />
                          </motion.button>
                          <button
                            onClick={() => { setSelectedPago(p); fileInputRef.current?.click(); }}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all"
                            style={p.url_comprobante ? {
                              backgroundColor: 'var(--color-primary)15',
                              borderColor: 'var(--color-primary)30',
                              color: 'var(--color-primary)'
                            } : {
                              backgroundColor: 'var(--color-background)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-muted)'
                            }}
                            title="Subir Comprobante"
                          >
                            {saving && selectedPago?.idpago === p.idpago
                              ? <Loader2 className="animate-spin" size={18} />
                              : <ImageIcon size={20} />
                            }
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* INPUT OCULTO COMPROBANTES */}
      <input type="file" ref={fileInputRef} onChange={handleUploadComprobante} className="hidden" accept="image/*" />

      {/* ── MODAL COBRO ───────────────────────────────────────── */}
      <AnimatePresence>
        {isCobrarModalOpen && selectedPago && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              onClick={() => setIsCobrarModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3rem] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header del modal con color del tema */}
              <div
                className="p-8 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, var(--color-primary)))',
                }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
                  <DollarSign size={120} />
                </div>
                <div className="flex items-center gap-4 relative z-10 text-left">
                  <div className="p-3 bg-white/20 rounded-2xl border border-white/20 shadow-inner">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Registrar Pago</h3>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-60 mt-2 italic">Módulo de Tesorería</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCobrarModalOpen(false)}
                  className="p-2.5 bg-black/20 rounded-full active:scale-90 transition-transform relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 text-left overflow-y-auto custom-scrollbar">
                {/* Info del alumno */}
                <div className="bg-[var(--color-background)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-inner text-left">
                  <div className="flex items-center gap-2 opacity-50 mb-3 font-black text-[9px] uppercase tracking-widest leading-none text-[var(--color-text)]">
                    <UserCircle size={14} /> Alumno en Ventanilla
                  </div>
                  <h4 className="text-xl font-black text-[var(--color-text)] italic leading-tight">
                    {selectedPago.alumno?.nombres} {selectedPago.alumno?.apellidopaterno}
                  </h4>
                  <div className="flex justify-between items-center mt-5 pt-5 border-t border-[var(--color-border)]">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase opacity-60">{selectedPago.concepto}</span>
                    <span className="text-2xl font-black leading-none" style={{ color: 'var(--color-primary)' }}>
                      ${selectedPago.monto}
                    </span>
                  </div>
                </div>

                {/* Desglose técnico */}
                <div className="space-y-5 text-left">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                      <CreditCard size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Desglose Técnico</span>
                    </div>
                    <button
                      onClick={handleAddMetodo}
                      className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl transition-all border"
                      style={{
                        color: 'var(--color-primary)',
                        borderColor: 'var(--color-primary)30',
                        backgroundColor: 'var(--color-primary)10',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'white';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)10';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
                      }}
                    >
                      Dividir Cobro
                    </button>
                  </div>
                  <div className="space-y-4">
                    {desglose.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-4 items-end animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2 text-left">
                          <label className="text-[8px] font-black uppercase ml-3 opacity-40 tracking-widest leading-none text-[var(--color-text)]">Monto</label>
                          <input
                            type="number"
                            className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] outline-none font-black text-base text-[var(--color-text)] shadow-inner transition-all"
                            style={{ ['--tw-ring-color' as string]: 'var(--color-primary)' }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            value={item.monto}
                            onChange={(e) => handleUpdateDesglose(idx, 'monto', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 text-left relative">
                          <label className="text-[8px] font-black uppercase ml-3 opacity-40 tracking-widest leading-none text-[var(--color-text)]">Método</label>
                          <select
                            className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] outline-none font-black text-[11px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner"
                            value={item.metodo}
                            onChange={(e) => handleUpdateDesglose(idx, 'metodo', e.target.value as DesgloseItem['metodo'])}
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta Bancaria</option>
                          </select>
                          <div className="absolute right-4 top-10 pointer-events-none opacity-40 text-[var(--color-text)]">
                            <ChevronRight size={16} className="rotate-90" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2 text-left">
                  <label className="text-[8px] font-black uppercase ml-3 opacity-40 tracking-widest leading-none text-[var(--color-text)]">Comentarios Técnicos</label>
                  <textarea
                    rows={2}
                    className="w-full p-5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] outline-none font-bold text-sm text-[var(--color-text)] resize-none shadow-inner transition-all"
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)50'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    value={notasCobro}
                    onChange={(e) => setNotasCobro(e.target.value)}
                    placeholder="Notas internas sobre el pago..."
                  />
                </div>

                {/* Botón confirmar con color del tema */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmarCobro}
                  disabled={saving}
                  className="w-full h-16 text-white font-black rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    boxShadow: '0 8px 32px -8px var(--color-primary)60'
                  }}
                >
                  {saving
                    ? <Loader2 className="animate-spin" size={28} />
                    : <><CheckCircle2 size={28} /><span className="text-lg uppercase italic tracking-tighter font-black">Confirmar Cobro Final</span></>
                  }
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL TICKET ──────────────────────────────────────── */}
      <ModalReciboImpresion
        open={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        data={ticketData}
      />

      {/* ── MODAL GENERAR MENSUALIDADES ───────────────────────── */}
      <AnimatePresence>
        {isGenerarModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-left">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              onClick={() => setIsGenerarModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3.5rem] border border-[var(--color-border)] shadow-2xl p-10 space-y-8 flex flex-col overflow-hidden text-left"
            >
              <div className="space-y-4">
                {/* Ícono con color del tema */}
                <div
                  className="w-16 h-16 rounded-[2rem] flex items-center justify-center border shadow-inner"
                  style={{
                    backgroundColor: 'var(--color-primary)15',
                    borderColor: 'var(--color-primary)20',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Calendar size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-none">
                  Cargar Mensualidades
                </h3>
                <p className="text-sm font-bold text-[var(--color-text-muted)] leading-relaxed opacity-70 italic">
                  Se crearán cargos pendientes para todos los alumnos activos en el sistema mediante proceso masivo.
                </p>
              </div>

              {/* Alerta con color del tema en lugar de naranja fijo */}
              <div
                className="p-5 rounded-3xl border border-dashed flex items-start gap-4"
                style={{
                  backgroundColor: 'var(--color-primary)08',
                  borderColor: 'var(--color-primary)30',
                }}
              >
                <ShieldAlert size={20} style={{ color: 'var(--color-primary)', marginTop: 2 }} />
                <p
                  className="text-[10px] font-black uppercase tracking-widest leading-normal"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Se ignorarán automáticamente alumnos con cargos duplicados o inscritos fuera de fecha de corte.
                </p>
              </div>

              {/* Botón ejecutar con color del tema */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerarMes}
                disabled={saving}
                className="w-full h-16 text-white font-black rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50 transition-all hover:brightness-110"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 8px 32px -8px var(--color-primary)50'
                }}
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